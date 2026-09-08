import { NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase";
import {
  buildMaterialInsertRows,
  buildWasteInsertRows,
  calculateMaterialFlowTotals,
  getPeriodStart,
} from "@/lib/calculations/material-flow";
import { generateMaterialFlowOpportunitiesFromTypes } from "@/lib/material-intelligence/opportunity-engine";
import type { Database } from "@/types/database";
import type { IdentifiedMaterial, ParsedInvoiceData } from "@/types/material";

type AnalyzeRequest = {
  invoice_id?: string;
  company_id?: string;
  materials?: IdentifiedMaterial[];
  period?: string;
};

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const body = (await req.json()) as AnalyzeRequest;

  let companyId = body.company_id;
  let materials = body.materials;
  let period = body.period;

  if (body.invoice_id) {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", body.invoice_id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found." },
        { status: 404 },
      );
    }

    companyId = companyId || invoice.company_id;
    materials = materials || (invoice.materials_identified as IdentifiedMaterial[] | null) || undefined;
    const parsed = invoice.parsed_data as ParsedInvoiceData | null;
    period = period || parsed?.date || invoice.processed_at || invoice.created_at;
  }

  if (!companyId) {
    return NextResponse.json(
      { error: "company_id is required." },
      { status: 400 },
    );
  }

  if (!materials || materials.length === 0) {
    return NextResponse.json(
      { error: "materials are required for analysis." },
      { status: 400 },
    );
  }

  const periodStart = getPeriodStart(period);
  const materialRows = buildMaterialInsertRows(companyId, materials, periodStart);

  const { data: insertedMaterials, error: materialError } = await supabase
    .from("materials")
    .insert(materialRows)
    .select("*");

  if (materialError) {
    return NextResponse.json({ error: materialError }, { status: 500 });
  }

  const wasteRows = buildWasteInsertRows(companyId, insertedMaterials || []);
  let insertedWaste: Database["public"]["Tables"]["waste_streams"]["Row"][] = [];

  if (wasteRows.length > 0) {
    const { data: wasteData, error: wasteError } = await supabase
      .from("waste_streams")
      .insert(wasteRows)
      .select("*");

    if (wasteError) {
      return NextResponse.json({ error: wasteError }, { status: 500 });
    }

    insertedWaste = wasteData || [];
  }

  const totals = calculateMaterialFlowTotals(
    insertedMaterials || [],
    insertedWaste || [],
  );
  const circularOpportunities = generateMaterialFlowOpportunitiesFromTypes({
    materialTypes: materials.map((m) => m.material_type),
  });

  return NextResponse.json({
    period: periodStart,
    materials: insertedMaterials,
    waste_streams: insertedWaste,
    totals,
    circular_opportunities: circularOpportunities,
  });
}
