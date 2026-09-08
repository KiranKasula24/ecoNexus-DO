import { supabase } from "@/lib/database/supabase";

export type EffectiveSkuMapping = {
  waste_sku: string;
  processed_sku: string;
  source: "capabilities" | "sku_rules";
  quality_score: number | null;
  cost_competitiveness_score: number | null;
  recovery_score: number | null;
  market_demand_score: number | null;
  industry_segment: string | null;
  confidence: number;
};

export type ConversionEconomics = {
  processing_fee_per_ton: number;
  pure_material_cost_per_ton: number;
  net_cost_per_ton: number;
  total_cost: number;
  quality_score: number | null;
  recovery_score: number | null;
  cost_competitiveness_score: number | null;
  viable_for_buyer: boolean;
};

function normalizeSku(sku: string | null | undefined): string {
  return String(sku || "").trim().toUpperCase();
}

function scoreFromNullable(value: number | null | undefined, fallback = 3): number {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export async function getEffectiveMappingsForWasteSku(
  wasteSku: string,
): Promise<EffectiveSkuMapping[]> {
  const normalized = normalizeSku(wasteSku);
  if (!normalized) return [];

  const db: any = supabase;
  const { data } = await db
    .from("effective_processed_sku_mappings")
    .select("*")
    .eq("waste_sku", normalized);

  const rows = (data || []) as EffectiveSkuMapping[];
  return rows.sort((a, b) => {
    const qa = scoreFromNullable(a.quality_score);
    const qb = scoreFromNullable(b.quality_score);
    if (qb !== qa) return qb - qa;
    return (b.confidence || 0) - (a.confidence || 0);
  });
}

export async function getWasteCandidatesForProcessedSku(
  processedSku: string,
): Promise<EffectiveSkuMapping[]> {
  const normalized = normalizeSku(processedSku);
  if (!normalized) return [];

  const db: any = supabase;
  const { data } = await db
    .from("effective_processed_sku_mappings")
    .select("*")
    .eq("processed_sku", normalized);

  return ((data || []) as EffectiveSkuMapping[]).sort((a, b) => {
    const qa = scoreFromNullable(a.quality_score);
    const qb = scoreFromNullable(b.quality_score);
    if (qb !== qa) return qb - qa;
    return (b.confidence || 0) - (a.confidence || 0);
  });
}

export async function getSubstitutionCandidatesForInputSku(
  inputSku: string,
): Promise<EffectiveSkuMapping[]> {
  return getWasteCandidatesForProcessedSku(inputSku);
}

async function getRuleEconomics(
  wasteSku: string,
  processedSku: string,
): Promise<{
  processing_cost_per_ton: number;
  net_cost_multiplier: number;
  pure_material_cost_per_ton: number;
}> {
  const db: any = supabase;
  const { data } = await db
    .from("sku_processing_rules")
    .select("processing_cost_per_ton, net_cost_multiplier, pure_material_cost_per_ton")
    .eq("waste_sku", normalizeSku(wasteSku))
    .eq("processed_sku", normalizeSku(processedSku))
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return {
    processing_cost_per_ton: Number(data?.processing_cost_per_ton || 0),
    net_cost_multiplier: Number(data?.net_cost_multiplier || 1),
    pure_material_cost_per_ton: Number(data?.pure_material_cost_per_ton || 0),
  };
}

export async function computeConversionEconomics(params: {
  wasteSku: string;
  processedSku: string;
  sellerPricePerTon: number;
  volume: number;
  buyerMaxPricePerTon: number;
  defaultProcessingFeePerTon?: number;
  qualityScore?: number | null;
  recoveryScore?: number | null;
  costCompetitivenessScore?: number | null;
}): Promise<ConversionEconomics> {
  const ruleEconomics = await getRuleEconomics(params.wasteSku, params.processedSku);
  const baseProcessingFee = Number(params.defaultProcessingFeePerTon || 75);
  const processingFeePerTon =
    ruleEconomics.processing_cost_per_ton > 0
      ? ruleEconomics.processing_cost_per_ton
      : baseProcessingFee;

  const netCostPerTon =
    (Number(params.sellerPricePerTon || 0) + processingFeePerTon) *
    Number(ruleEconomics.net_cost_multiplier || 1);
  const pureMaterialCostPerTon =
    ruleEconomics.pure_material_cost_per_ton > 0
      ? ruleEconomics.pure_material_cost_per_ton
      : Number(params.sellerPricePerTon || 0);

  return {
    processing_fee_per_ton: Number(processingFeePerTon.toFixed(2)),
    pure_material_cost_per_ton: Number(pureMaterialCostPerTon.toFixed(2)),
    net_cost_per_ton: Number(netCostPerTon.toFixed(2)),
    total_cost: Number((netCostPerTon * Number(params.volume || 0)).toFixed(2)),
    quality_score: params.qualityScore ?? null,
    recovery_score: params.recoveryScore ?? null,
    cost_competitiveness_score: params.costCompetitivenessScore ?? null,
    viable_for_buyer: netCostPerTon <= Number(params.buyerMaxPricePerTon || 0),
  };
}

export async function selectProcessorCandidate(params: {
  inputSku: string;
  outputSku: string;
  volume: number;
  locality?: string | null;
}): Promise<{
  processor_agent_id: string;
  processor_company_id: string;
  score: number;
  processing_fee_per_ton: number;
} | null> {
  const db: any = supabase;
  const { data: processors } = await db
    .from("agents")
    .select("id, company_id, locality")
    .eq("agent_type", "specialist_processor")
    .eq("status", "active");

  if (!processors || processors.length === 0) return null;

  const { data: profiles } = await db
    .from("processor_profiles")
    .select(
      "company_id, input_materials, output_materials, processing_capacity_tons_month, current_utilization_percentage, processing_fee_per_ton",
    );

  const profileByCompany = new Map<string, any>(
    (profiles || []).map((p: any) => [p.company_id, p]),
  );

  const inputNeedle = normalizeSku(params.inputSku).toLowerCase();
  const outputNeedle = normalizeSku(params.outputSku).toLowerCase();
  let best: any = null;

  for (const agent of processors as any[]) {
    const profile = profileByCompany.get(agent.company_id);
    if (!profile) continue;

    const canInput = (profile.input_materials || []).some((m: string) =>
      m.toLowerCase().includes(inputNeedle) || inputNeedle.includes(m.toLowerCase()),
    );
    const canOutput = (profile.output_materials || []).some((m: string) =>
      m.toLowerCase().includes(outputNeedle) || outputNeedle.includes(m.toLowerCase()),
    );
    if (!canInput || !canOutput) continue;

    const capacity = Number(profile.processing_capacity_tons_month || 0);
    const utilization = Number(profile.current_utilization_percentage || 0);
    const available = capacity * (1 - utilization / 100);
    if (available < Number(params.volume || 0)) continue;

    const feeMap = profile.processing_fee_per_ton || {};
    const fee = Number(feeMap.default || feeMap.sorting || 75);
    const localityBonus =
      params.locality && agent.locality && String(agent.locality) === String(params.locality)
        ? 0.25
        : 0;

    const score = (available / Math.max(1, params.volume)) + localityBonus - fee / 1000;

    if (!best || score > best.score) {
      best = {
        processor_agent_id: agent.id,
        processor_company_id: agent.company_id,
        score: Number(score.toFixed(4)),
        processing_fee_per_ton: fee,
      };
    }
  }

  return best;
}

