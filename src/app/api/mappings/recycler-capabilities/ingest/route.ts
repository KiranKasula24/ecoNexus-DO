import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseRecyclerCapabilitiesDocx } from "@/lib/mapping/recycler-capabilities-parser";
import type { Database } from "@/types/database";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const sourceDocVersion =
      String(form.get("source_doc_version") || "").trim() || "recycler-capabilities-v1";
    const deactivatePrior = String(form.get("deactivate_prior") || "true") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".docx")) {
      return NextResponse.json({ error: "Only .docx is supported" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const parsed = await parseRecyclerCapabilitiesDocx(buf);
    const db: any = admin;

    if (deactivatePrior) {
      await db
        .from("recycler_capability_mappings")
        .update({ is_active: false })
        .eq("source_doc_version", sourceDocVersion);
    }

    if (parsed.mappings.length > 0) {
      const records = parsed.mappings.map((row) => ({
        waste_sku: row.waste_sku,
        processed_sku: row.processed_sku,
        source: "capabilities",
        quality_score: row.quality_score,
        cost_competitiveness_score: row.cost_competitiveness_score,
        recovery_score: row.recovery_score,
        market_demand_score: row.market_demand_score,
        industry_segment: row.industry_segment,
        source_doc_version: sourceDocVersion,
        confidence: row.confidence,
        is_active: true,
      }));
      await db
        .from("recycler_capability_mappings")
        .upsert(records, { onConflict: "waste_sku,processed_sku,source_doc_version" });
    }

    if (parsed.exceptions.length > 0) {
      const exceptions = parsed.exceptions.map((x) => ({
        source: x.source,
        row_ref: x.row_ref,
        waste_sku: x.waste_sku,
        processed_sku: x.processed_sku,
        reason: x.reason,
        payload: x.payload,
      }));
      await db.from("sku_mapping_exceptions").insert(exceptions);
    }

    return NextResponse.json({
      success: true,
      source_doc_version: sourceDocVersion,
      inserted_mappings: parsed.mappings.length,
      inserted_exceptions: parsed.exceptions.length,
    });
  } catch (error: any) {
    console.error("Recycler capabilities ingestion failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to ingest recycler capabilities" },
      { status: 500 },
    );
  }
}

