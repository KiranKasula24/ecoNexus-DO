import { NextResponse } from "next/server";
import { createClient } from "@/lib/database/supabase";
import { buildCompanyKpiInsert } from "@/lib/calculations/kpis";
import { getPeriodEnd, getPeriodStart } from "@/lib/calculations/material-flow";

type KpiRequest = {
  company_id: string;
  period?: string;
};

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const body = (await req.json()) as KpiRequest;

  if (!body.company_id) {
    return NextResponse.json(
      { error: "company_id is required." },
      { status: 400 },
    );
  }

  const periodStart = getPeriodStart(body.period);
  const periodEnd = getPeriodEnd(periodStart);

  const { data: materials, error: materialsError } = await supabase
    .from("materials")
    .select("*")
    .eq("company_id", body.company_id)
    .gte("date_recorded", periodStart)
    .lt("date_recorded", periodEnd);

  if (materialsError) {
    return NextResponse.json({ error: materialsError }, { status: 500 });
  }

  const { data: waste, error: wasteError } = await supabase
    .from("waste_streams")
    .select("*")
    .eq("company_id", body.company_id)
    .gte("created_at", periodStart)
    .lt("created_at", periodEnd);

  if (wasteError) {
    return NextResponse.json({ error: wasteError }, { status: 500 });
  }

  if (!materials || materials.length === 0) {
    return NextResponse.json(
      { error: "No materials found for the period." },
      { status: 404 },
    );
  }

  const kpiRow = buildCompanyKpiInsert(
    body.company_id,
    periodStart,
    materials,
    waste || [],
  );

  const { data: kpi, error: kpiError } = await supabase
    .from("company_kpis")
    .insert([kpiRow] as any)
    .select("*")
    .single();

  if (kpiError) {
    return NextResponse.json({ error: kpiError }, { status: 500 });
  }

  return NextResponse.json({ kpi });
}
