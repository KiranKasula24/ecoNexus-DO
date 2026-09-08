import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createPassportFromWasteStream } from "@/lib/material-intelligence/passport-service";
import { generateMaterialFlowOpportunities } from "@/lib/material-intelligence/opportunity-engine";
import { AgentRunner } from "@/lib/agents/agent-runner";
import { ensureSuperAgentForLocality } from "@/lib/agents/super-agent-registry";
import {
  getEffectiveMappingsForWasteSku,
  getSubstitutionCandidatesForInputSku,
} from "@/lib/mapping/processed-sku-mapper";

type WasteClassification =
  | "reusable"
  | "processable"
  | "recyclable"
  | "energy_recovery"
  | "landfill";

type PrimaryMaterialInput = {
  name: string;
  category: string;
  subtype: string;
  sku?: string;
  monthlyVolume: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  recycledContentPercent: number;
  processStep: string;
};

type WasteGeneratedInput = {
  materialName: string;
  materialCategory: string;
  materialSubtype: string;
  sku?: string;
  physicalForm: string;
  monthlyVolume: number;
  unit: string;
  qualityGrade: "A" | "B" | "C" | "D";
  contaminationLevel: number;
  moistureContent: number;
  carbonFootprint: number;
  waterUsage: number;
  energyConsumption: number;
  currentDisposalCost: number;
  potentialValue: number;
  classification: WasteClassification;
  generationFrequency: string;
  storageLocation: string;
  isHazardous: boolean;
  wasteCode: string;
  regulatoryClassification: string;
};

type CreateMaterialFlowPayload = {
  company_id: string;
  primaryMaterials: PrimaryMaterialInput[];
  wasteGenerated: WasteGeneratedInput;
};

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

function toPositiveNumber(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function isQualityGrade(value: unknown): value is "A" | "B" | "C" | "D" {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

function isClassification(value: unknown): value is WasteClassification {
  return (
    value === "reusable" ||
    value === "processable" ||
    value === "recyclable" ||
    value === "energy_recovery" ||
    value === "landfill"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateMaterialFlowPayload;

    if (!body.company_id) {
      return NextResponse.json(
        { error: "company_id is required." },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.primaryMaterials) || body.primaryMaterials.length !== 3) {
      return NextResponse.json(
        { error: "Exactly 3 primary materials are required." },
        { status: 400 },
      );
    }

    if (!body.wasteGenerated) {
      return NextResponse.json(
        { error: "wasteGenerated is required." },
        { status: 400 },
      );
    }

    const invalidPrimary = body.primaryMaterials.some(
      (item) =>
        !item.name ||
        !item.category ||
        toPositiveNumber(item.monthlyVolume) <= 0 ||
        !item.unit,
    );

    if (invalidPrimary) {
      return NextResponse.json(
        { error: "Each primary material needs name, category, volume, and unit." },
        { status: 400 },
      );
    }

    if (
      !body.wasteGenerated.materialName ||
      !body.wasteGenerated.materialCategory ||
      !body.wasteGenerated.physicalForm ||
      toPositiveNumber(body.wasteGenerated.monthlyVolume) <= 0
    ) {
      return NextResponse.json(
        { error: "Waste generated details are incomplete." },
        { status: 400 },
      );
    }

    if (!isQualityGrade(body.wasteGenerated.qualityGrade)) {
      return NextResponse.json(
        { error: "Waste quality grade must be A, B, C, or D." },
        { status: 400 },
      );
    }

    if (!isClassification(body.wasteGenerated.classification)) {
      return NextResponse.json(
        { error: "Invalid waste classification." },
        { status: 400 },
      );
    }

    const materialRows: Database["public"]["Tables"]["materials"]["Insert"][] =
      body.primaryMaterials.map((material) => ({
        company_id: body.company_id,
        material_type: material.name.trim(),
        category: "input",
        material_category: material.category.trim().toLowerCase(),
        material_subtype: material.subtype?.trim() || null,
        physical_form: "mixed",
        monthly_volume: toPositiveNumber(material.monthlyVolume),
        unit: material.unit || "tons",
        cost_per_unit: toPositiveNumber(material.costPerUnit),
        technical_properties: {
          sku: material.sku || null,
          supplier: material.supplier || null,
          recycled_content_percent: toPositiveNumber(material.recycledContentPercent),
          process_step: material.processStep || null,
        },
      }));

    const { data: insertedPrimaryMaterials, error: primaryError } = await supabase
      .from("materials")
      .insert(materialRows)
      .select("*");

    if (primaryError) {
      return NextResponse.json(
        { error: `Failed to save primary materials: ${primaryError.message}` },
        { status: 500 },
      );
    }

    const wasteGenerated = body.wasteGenerated;

    const wasteMaterialInsert: Database["public"]["Tables"]["materials"]["Insert"] = {
      company_id: body.company_id,
      material_type: wasteGenerated.materialName.trim(),
      category: "waste",
      material_category: wasteGenerated.materialCategory.trim().toLowerCase(),
      material_subtype: wasteGenerated.materialSubtype?.trim() || null,
      physical_form: wasteGenerated.physicalForm.trim().toLowerCase(),
      monthly_volume: toPositiveNumber(wasteGenerated.monthlyVolume),
      unit: wasteGenerated.unit || "tons",
      cost_per_unit: toPositiveNumber(wasteGenerated.currentDisposalCost),
      carbon_footprint: toPositiveNumber(wasteGenerated.carbonFootprint),
      technical_properties: {
        sku: wasteGenerated.sku || null,
        moisture_content_percent: toPositiveNumber(wasteGenerated.moistureContent),
        water_usage_per_unit: toPositiveNumber(wasteGenerated.waterUsage),
        energy_consumption_per_unit: toPositiveNumber(wasteGenerated.energyConsumption),
        generation_frequency: wasteGenerated.generationFrequency || null,
        storage_location: wasteGenerated.storageLocation || null,
        is_hazardous: Boolean(wasteGenerated.isHazardous),
        waste_code: wasteGenerated.wasteCode || null,
        regulatory_classification: wasteGenerated.regulatoryClassification || null,
      },
    };

    const { data: wasteMaterial, error: wasteMaterialError } = await supabase
      .from("materials")
      .insert(wasteMaterialInsert)
      .select("*")
      .single();

    if (wasteMaterialError || !wasteMaterial) {
      return NextResponse.json(
        {
          error: `Failed to save waste material: ${wasteMaterialError?.message || "Unknown error"}`,
        },
        { status: 500 },
      );
    }

    const wasteStreamInsert: Database["public"]["Tables"]["waste_streams"]["Insert"] = {
      company_id: body.company_id,
      material_id: wasteMaterial.id,
      classification: wasteGenerated.classification,
      monthly_volume: toPositiveNumber(wasteGenerated.monthlyVolume),
      current_disposal_cost: toPositiveNumber(wasteGenerated.currentDisposalCost),
      contamination_level: toPositiveNumber(wasteGenerated.contaminationLevel),
      quality_grade: wasteGenerated.qualityGrade,
      potential_value: toPositiveNumber(wasteGenerated.potentialValue),
    };

    const { data: wasteStream, error: wasteStreamError } = await supabase
      .from("waste_streams")
      .insert(wasteStreamInsert)
      .select("*")
      .single();

    if (wasteStreamError || !wasteStream) {
      return NextResponse.json(
        {
          error: `Failed to create waste stream: ${wasteStreamError?.message || "Unknown error"}`,
        },
        { status: 500 },
      );
    }

    const passport = await createPassportFromWasteStream(wasteStream);

    const circularOpportunities = generateMaterialFlowOpportunities({
      primaryMaterials: body.primaryMaterials,
      wasteGenerated: body.wasteGenerated,
    });

    const outputSkuCandidate =
      (wasteGenerated.sku || wasteGenerated.materialSubtype || wasteGenerated.materialCategory || "")
        .trim()
        .toUpperCase();
    const outputProcessedMappings = outputSkuCandidate
      ? await getEffectiveMappingsForWasteSku(outputSkuCandidate)
      : [];

    const inputSubstitutionMappings = await Promise.all(
      body.primaryMaterials.map(async (input) => {
        const inputSku = (input.sku || input.subtype || input.category || "").trim().toUpperCase();
        if (!inputSku) return { input_sku: "", candidates: [] as any[] };
        const candidates = await getSubstitutionCandidatesForInputSku(inputSku);
        return {
          input_sku: inputSku,
          candidates: candidates.slice(0, 5).map((c) => ({
            waste_sku: c.waste_sku,
            processed_sku: c.processed_sku,
            source: c.source,
            score_breakdown: {
              quality_score: c.quality_score,
              cost_competitiveness_score: c.cost_competitiveness_score,
              recovery_score: c.recovery_score,
              market_demand_score: c.market_demand_score,
            },
          })),
        };
      }),
    );

    const mergedTechnicalProperties = {
      ...((passport.technical_properties as Record<string, unknown> | null) || {}),
      circular_opportunities: circularOpportunities,
      processed_mapping: {
        mapping_source: outputProcessedMappings[0]?.source || null,
        output_waste_sku: outputSkuCandidate || null,
        processed_sku_candidates: outputProcessedMappings.slice(0, 8).map((m) => ({
          processed_sku: m.processed_sku,
          source: m.source,
          confidence: m.confidence,
          score_breakdown: {
            quality_score: m.quality_score,
            cost_competitiveness_score: m.cost_competitiveness_score,
            recovery_score: m.recovery_score,
            market_demand_score: m.market_demand_score,
          },
        })),
      },
      input_substitution_candidates: inputSubstitutionMappings.filter((x) => x.input_sku),
    };

    const { data: updatedPassport, error: passportUpdateError } = await supabase
      .from("material_passports")
      .update({ technical_properties: mergedTechnicalProperties })
      .eq("id", passport.id)
      .select("*")
      .single();

    if (passportUpdateError) {
      return NextResponse.json(
        { error: `Failed to store opportunities on passport: ${passportUpdateError.message}` },
        { status: 500 },
      );
    }

    const { data: companyData } = await supabase
      .from("companies")
      .select("locality, location")
      .eq("id", body.company_id)
      .maybeSingle();

    if (companyData?.locality) {
      await ensureSuperAgentForLocality({
        locality: companyData.locality,
        city: (companyData.location as any)?.city,
        country: (companyData.location as any)?.country,
      });
    }

    let agentRunResult: { success: boolean; stats?: unknown; error?: string } | null = null;
    try {
      const run = await AgentRunner.runAllAgents();
      agentRunResult = { success: run.success, stats: run.stats };
    } catch (agentErr: any) {
      agentRunResult = {
        success: false,
        error: agentErr?.message || "Agent run failed after MFA",
      };
    }

    return NextResponse.json({
      success: true,
      primary_materials: insertedPrimaryMaterials || [],
      waste_material: wasteMaterial,
      waste_stream: wasteStream,
      passport: updatedPassport,
      circular_opportunities: circularOpportunities,
      next_redirect: `/opportunities?passport_id=${passport.id}&auto=1`,
      agent_run: agentRunResult,
    });
  } catch (error: unknown) {
    console.error("Material flow create error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create material flow and passport.";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

