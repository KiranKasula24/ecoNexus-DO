import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  ExcelInputRow,
  ExcelOutputRow,
  ExcelProductRow,
} from "@/lib/passport/excel-passport-parser";
import {
  getEffectiveMappingsForWasteSku,
  getSubstitutionCandidatesForInputSku,
} from "@/lib/mapping/processed-sku-mapper";

type IngestArgs = {
  companyId: string;
  fileName: string;
  sourceDocVersion: string;
  products: ExcelProductRow[];
  inputs: ExcelInputRow[];
  outputs: ExcelOutputRow[];
};

function isFiniteNumber(n: unknown): n is number {
  return Number.isFinite(Number(n));
}

export async function ingestProductPassportWorkbook(args: IngestArgs): Promise<{
  job_id: string;
  product_passports_created: number;
  input_lines_created: number;
  output_lines_created: number;
  offers_created: number;
  requests_created: number;
  product_passport_ids: string[];
}> {
  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const db: any = admin;

  const { data: agent } = await db
    .from("agents")
    .select("id, locality")
    .eq("company_id", args.companyId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const jobInsert = await db
    .from("excel_ingestion_jobs")
    .insert({
      company_id: args.companyId,
      file_name: args.fileName,
      source_doc_version: args.sourceDocVersion,
      status: "validated",
      summary: {
        products: args.products.length,
        inputs: args.inputs.length,
        outputs: args.outputs.length,
      },
    })
    .select("id")
    .single();
  const jobId = jobInsert.data.id as string;

  let productPassportsCreated = 0;
  let inputLinesCreated = 0;
  let outputLinesCreated = 0;
  let offersCreated = 0;
  let requestsCreated = 0;
  const createdPassportIds: string[] = [];

  for (const product of args.products) {
    const productInputs = args.inputs.filter((i) => i.product_code === product.product_code);
    const productOutputs = args.outputs.filter((o) => o.product_code === product.product_code);

    const pp = await db
      .from("product_passports")
      .upsert(
        {
          company_id: args.companyId,
          product_code: product.product_code,
          product_name: product.product_name,
          reporting_period: product.reporting_period || null,
          locality: product.locality || agent?.locality || null,
          status: "active",
          technical_properties: {
            source: "excel",
            source_doc_version: args.sourceDocVersion,
          },
        },
        { onConflict: "company_id,product_code" },
      )
      .select("id")
      .single();

    const productPassportId = pp.data.id as string;
    productPassportsCreated++;
    createdPassportIds.push(productPassportId);

    await db.from("passport_input_lines").delete().eq("product_passport_id", productPassportId);
    await db.from("passport_output_lines").delete().eq("product_passport_id", productPassportId);

    for (let idx = 0; idx < productInputs.length; idx++) {
      const input = productInputs[idx];
      const substitutes = await getSubstitutionCandidatesForInputSku(input.input_sku);
      const payload = substitutes.slice(0, 5).map((s) => ({
        waste_sku: s.waste_sku,
        processed_sku: s.processed_sku,
        source: s.source,
        confidence: s.confidence,
        score_breakdown: {
          quality_score: s.quality_score,
          cost_competitiveness_score: s.cost_competitiveness_score,
          recovery_score: s.recovery_score,
          market_demand_score: s.market_demand_score,
        },
      }));

      const inputLine = await db
        .from("passport_input_lines")
        .insert({
          product_passport_id: productPassportId,
          line_no: idx + 1,
          input_sku: input.input_sku,
          input_material: input.input_material,
          monthly_volume: input.monthly_volume,
          unit: input.unit,
          cost_per_unit: input.cost_per_unit,
          supplier: input.supplier || null,
          quality_tier: isFiniteNumber(input.quality_tier) ? Number(input.quality_tier) : null,
          processed_substitutes: payload,
          mapping_source: payload[0]?.source || null,
          score_breakdown: payload[0]?.score_breakdown || null,
        })
        .select("id")
        .single();
      inputLinesCreated++;

      if (agent?.id) {
        const maxPrice = Number(input.cost_per_unit || 0) > 0 ? Number(input.cost_per_unit) : 200;
        await db.from("agent_feed").insert({
          agent_id: agent.id,
          post_type: "request",
          locality: product.locality || agent.locality || "unknown",
          visibility: "local",
          is_active: true,
          content: {
            product_passport_id: productPassportId,
            source_line_id: inputLine.data.id,
            line_type: "input",
            sku: input.input_sku,
            material_category: input.input_sku,
            material_subtype: input.input_sku,
            volume_needed: Number(input.monthly_volume),
            max_price: maxPrice,
            quality_tier_max: isFiniteNumber(input.quality_tier) ? Number(input.quality_tier) : 3,
            substitution_candidates: payload,
          },
        });
        requestsCreated++;
      }
    }

    for (let idx = 0; idx < productOutputs.length; idx++) {
      const output = productOutputs[idx];
      const mappings = await getEffectiveMappingsForWasteSku(output.waste_sku);
      const candidates = mappings.slice(0, 8).map((m) => ({
        processed_sku: m.processed_sku,
        source: m.source,
        confidence: m.confidence,
        score_breakdown: {
          quality_score: m.quality_score,
          cost_competitiveness_score: m.cost_competitiveness_score,
          recovery_score: m.recovery_score,
          market_demand_score: m.market_demand_score,
        },
      }));

      const outputLine = await db
        .from("passport_output_lines")
        .insert({
          product_passport_id: productPassportId,
          line_no: idx + 1,
          waste_sku: output.waste_sku,
          waste_material: output.waste_material,
          monthly_volume: output.monthly_volume,
          unit: output.unit,
          current_disposal_cost: output.current_disposal_cost,
          potential_value: isFiniteNumber(output.potential_value) ? Number(output.potential_value) : null,
          quality_grade: output.quality_grade || null,
          contamination_level: isFiniteNumber(output.contamination_level)
            ? Number(output.contamination_level)
            : null,
          classification: output.classification || "recyclable",
          processed_sku_candidates: candidates,
          mapping_source: candidates[0]?.source || null,
          score_breakdown: candidates[0]?.score_breakdown || null,
        })
        .select("id")
        .single();
      outputLinesCreated++;

      if (agent?.id) {
        const ask =
          isFiniteNumber(output.asking_price) && Number(output.asking_price) > 0
            ? Number(output.asking_price)
            : Math.max(1, Number(output.current_disposal_cost || 0) * 0.8);
        await db.from("agent_feed").insert({
          agent_id: agent.id,
          post_type: "offer",
          locality: product.locality || agent.locality || "unknown",
          visibility: "local",
          is_active: true,
          content: {
            product_passport_id: productPassportId,
            source_line_id: outputLine.data.id,
            line_type: "output",
            waste_sku: output.waste_sku,
            sku: output.waste_sku,
            material_category: output.waste_sku,
            material_subtype: output.waste_sku,
            material: output.waste_material || output.waste_sku,
            volume: Number(output.monthly_volume),
            unit: output.unit,
            price: ask,
            mapping_source: candidates[0]?.source || null,
            processed_sku_candidates: candidates,
          },
        });
        offersCreated++;
      }
    }

    const firstOutput = productOutputs[0];
    if (firstOutput) {
      const topCandidates = await getEffectiveMappingsForWasteSku(firstOutput.waste_sku);
      await db.from("material_passports").insert({
        current_owner_company_id: args.companyId,
        material_category: firstOutput.waste_sku,
        material_subtype: firstOutput.waste_sku,
        physical_form: "mixed",
        volume: Number(firstOutput.monthly_volume || 0),
        unit: firstOutput.unit || "tons",
        quality_grade: firstOutput.quality_grade || "C",
        quality_tier: 2,
        contamination_level: isFiniteNumber(firstOutput.contamination_level)
          ? Number(firstOutput.contamination_level)
          : null,
        technical_properties: {
          source: "excel_product_passport_snapshot",
          product_passport_id: productPassportId,
          product_code: product.product_code,
          inputs_count: productInputs.length,
          outputs_count: productOutputs.length,
          top_processed_candidates: topCandidates.slice(0, 5),
          source_doc_version: args.sourceDocVersion,
        },
      });
    }
  }

  await db
    .from("excel_ingestion_jobs")
    .update({
      status: "ingested",
      summary: {
        products: args.products.length,
        inputs: args.inputs.length,
        outputs: args.outputs.length,
        product_passports_created: productPassportsCreated,
        input_lines_created: inputLinesCreated,
        output_lines_created: outputLinesCreated,
        offers_created: offersCreated,
        requests_created: requestsCreated,
      },
    })
    .eq("id", jobId);

  return {
    job_id: jobId,
    product_passports_created: productPassportsCreated,
    input_lines_created: inputLinesCreated,
    output_lines_created: outputLinesCreated,
    offers_created: offersCreated,
    requests_created: requestsCreated,
    product_passport_ids: createdPassportIds,
  };
}

