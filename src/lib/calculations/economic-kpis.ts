/**
 * ECONOMIC KPI CALCULATIONS
 * Cost savings, ROI, and financial impact metrics
 */

import { getMaterialProperties } from "@/lib/constants/material-database";
import { calculateCarbonEmissions } from "./environmental-kpis";

// ============================================
// CIRCULAR SAVINGS CALCULATIONS
// ============================================

export interface CircularSavingsParams {
  virgin_material: {
    type: string;
    volume: number; // tons
    cost_per_unit: number; // €/ton
    transport_cost?: number; // €
  };
  circular_alternative: {
    type: string;
    volume: number; // tons
    cost_per_unit: number; // €/ton
    transport_cost?: number; // €
    quality_tier: number; // 1-4
  };
}

export interface CircularSavingsResult {
  virgin_cost: number;
  circular_cost: number;
  cost_savings: number; // €
  savings_percentage: number;
  carbon_savings: number; // kg CO₂
  quality_trade_off: string;
  payback_period_days?: number;
  recommendation:
    | "highly_recommended"
    | "recommended"
    | "consider"
    | "not_recommended";
  reasoning: string;
}

/**
 * Calculate potential savings from circular materials
 */
export function calculateCircularSavings(
  params: CircularSavingsParams,
): CircularSavingsResult {
  // Virgin material cost
  const virgin_material_cost =
    params.virgin_material.volume * params.virgin_material.cost_per_unit;
  const virgin_transport_cost = params.virgin_material.transport_cost || 0;
  const virgin_cost = virgin_material_cost + virgin_transport_cost;

  // Circular material cost
  const circular_material_cost =
    params.circular_alternative.volume *
    params.circular_alternative.cost_per_unit;
  const circular_transport_cost =
    params.circular_alternative.transport_cost || 0;
  const circular_cost = circular_material_cost + circular_transport_cost;

  // Savings
  const cost_savings = virgin_cost - circular_cost;
  const savings_percentage =
    virgin_cost > 0 ? (cost_savings / virgin_cost) * 100 : 0;

  // Carbon savings
  const virgin_emissions = calculateCarbonEmissions({
    material_type: params.virgin_material.type,
    volume: params.virgin_material.volume,
    process: "virgin",
  });

  const circular_emissions = calculateCarbonEmissions({
    material_type: params.circular_alternative.type,
    volume: params.circular_alternative.volume,
    process: "recycled",
  });

  const carbon_savings =
    virgin_emissions.total_emissions - circular_emissions.total_emissions;

  // Quality assessment
  let quality_trade_off = "No quality loss";
  if (params.circular_alternative.quality_tier === 2) {
    quality_trade_off = "Minor quality difference (acceptable for most uses)";
  } else if (params.circular_alternative.quality_tier === 3) {
    quality_trade_off = "Moderate quality difference (verify suitability)";
  } else if (params.circular_alternative.quality_tier === 4) {
    quality_trade_off = "Lower quality (may require process adjustments)";
  }

  // Recommendation
  let recommendation:
    | "highly_recommended"
    | "recommended"
    | "consider"
    | "not_recommended";
  let reasoning = "";

  if (cost_savings > 0 && params.circular_alternative.quality_tier <= 2) {
    recommendation = "highly_recommended";
    reasoning = `Save €${cost_savings.toFixed(2)} (${savings_percentage.toFixed(1)}%) with minimal quality impact. ${carbon_savings > 0 ? `Plus ${(carbon_savings / 1000).toFixed(1)} tons CO₂ reduction.` : ""}`;
  } else if (
    cost_savings > 0 &&
    params.circular_alternative.quality_tier === 3
  ) {
    recommendation = "recommended";
    reasoning = `Save €${cost_savings.toFixed(2)} (${savings_percentage.toFixed(1)}%). Verify quality requirements first.`;
  } else if (cost_savings > 0) {
    recommendation = "consider";
    reasoning = `Savings available but quality tier ${params.circular_alternative.quality_tier}. Assess if acceptable for your use case.`;
  } else {
    recommendation = "not_recommended";
    reasoning = `Circular option costs €${Math.abs(cost_savings).toFixed(2)} more. Consider only for sustainability goals.`;
  }

  return {
    virgin_cost,
    circular_cost,
    cost_savings,
    savings_percentage,
    carbon_savings,
    quality_trade_off,
    recommendation,
    reasoning,
  };
}

// ============================================
// WASTE-TO-VALUE CALCULATIONS
// ============================================

export interface WasteToValueParams {
  waste_streams: Array<{
    material_type: string;
    volume: number; // tons/month
    current_disposal_cost: number; // €/ton
    potential_sale_price: number; // €/ton
    quality_tier: number;
  }>;
}

export interface WasteToValueResult {
  current_cost: number; // € (disposal cost)
  potential_revenue: number; // €
  net_benefit: number; // €
  annual_benefit: number; // €
  payback_period_months: number;
  best_opportunities: Array<{
    material: string;
    volume: number;
    benefit: number;
    priority: "high" | "medium" | "low";
  }>;
}

/**
 * Calculate waste-to-value potential
 */
export function calculateWasteToValue(
  params: WasteToValueParams,
): WasteToValueResult {
  let current_cost = 0;
  let potential_revenue = 0;

  const opportunities = params.waste_streams.map((waste) => {
    const disposal_cost = waste.volume * waste.current_disposal_cost;
    const sale_revenue = waste.volume * waste.potential_sale_price;
    const benefit = disposal_cost + sale_revenue; // Save disposal + earn revenue

    current_cost += disposal_cost;
    potential_revenue += sale_revenue;

    // Priority based on benefit and quality
    let priority: "high" | "medium" | "low";
    if (benefit > 5000 && waste.quality_tier <= 2) {
      priority = "high";
    } else if (benefit > 2000 && waste.quality_tier <= 3) {
      priority = "medium";
    } else {
      priority = "low";
    }

    return {
      material: waste.material_type,
      volume: waste.volume,
      benefit,
      priority,
    };
  });

  // Sort by benefit (highest first)
  const best_opportunities = opportunities.sort(
    (a, b) => b.benefit - a.benefit,
  );

  const net_benefit = current_cost + potential_revenue;
  const annual_benefit = net_benefit * 12;

  // Assume minimal setup cost for payback (e.g., €500 for logistics setup)
  const setup_cost = 500;
  const payback_period_months =
    net_benefit > 0 ? Math.ceil(setup_cost / net_benefit) : 999;

  return {
    current_cost,
    potential_revenue,
    net_benefit,
    annual_benefit,
    payback_period_months,
    best_opportunities,
  };
}

// ============================================
// ROI CALCULATIONS
// ============================================

export interface ROIParams {
  initial_investment: number; // €
  monthly_savings: number; // €
  monthly_revenue: number; // €
  monthly_costs: number; // €
  project_lifetime_months: number;
  discount_rate?: number; // annual % (for NPV)
}

export interface ROIResult {
  payback_period_months: number;
  total_savings: number; // € over project lifetime
  total_revenue: number;
  total_costs: number;
  net_benefit: number;
  roi_percentage: number;
  npv?: number; // Net Present Value
  irr?: number; // Internal Rate of Return
  recommendation: "excellent" | "good" | "marginal" | "poor";
}

/**
 * Calculate ROI for circular economy investment
 */
export function calculateROI(params: ROIParams): ROIResult {
  const monthly_net_benefit =
    params.monthly_savings + params.monthly_revenue - params.monthly_costs;

  // Payback period
  const payback_period_months =
    params.initial_investment > 0
      ? params.initial_investment / monthly_net_benefit
      : 0;

  // Totals over project lifetime
  const total_savings = params.monthly_savings * params.project_lifetime_months;
  const total_revenue = params.monthly_revenue * params.project_lifetime_months;
  const total_costs = params.monthly_costs * params.project_lifetime_months;
  const total_benefit = total_savings + total_revenue - total_costs;

  const net_benefit = total_benefit - params.initial_investment;

  // ROI percentage
  const roi_percentage =
    params.initial_investment > 0
      ? (net_benefit / params.initial_investment) * 100
      : 0;

  // NPV calculation (if discount rate provided)
  let npv: number | undefined;
  if (params.discount_rate) {
    const monthly_rate = params.discount_rate / 100 / 12;
    npv = -params.initial_investment;

    for (let month = 1; month <= params.project_lifetime_months; month++) {
      npv += monthly_net_benefit / Math.pow(1 + monthly_rate, month);
    }
  }

  // Recommendation
  let recommendation: "excellent" | "good" | "marginal" | "poor";
  if (payback_period_months < 12 && roi_percentage > 50) {
    recommendation = "excellent";
  } else if (payback_period_months < 24 && roi_percentage > 25) {
    recommendation = "good";
  } else if (payback_period_months < 36 && roi_percentage > 0) {
    recommendation = "marginal";
  } else {
    recommendation = "poor";
  }

  return {
    payback_period_months,
    total_savings,
    total_revenue,
    total_costs,
    net_benefit,
    roi_percentage,
    npv,
    recommendation,
  };
}

// ============================================
// COST-BENEFIT ANALYSIS
// ============================================

export interface CostBenefitParams {
  scenario_name: string;
  costs: {
    initial_investment: number;
    monthly_operational: number;
    one_time_fees: number;
  };
  benefits: {
    material_savings: number; // €/month
    waste_disposal_savings: number; // €/month
    waste_sale_revenue: number; // €/month
    carbon_credit_value?: number; // €/month
    brand_value?: number; // €/month
  };
  risks: {
    quality_risk: "low" | "medium" | "high";
    supply_risk: "low" | "medium" | "high";
    market_risk: "low" | "medium" | "high";
  };
  timeframe_months: number;
}

export interface CostBenefitResult {
  total_costs: number;
  total_benefits: number;
  net_value: number;
  benefit_cost_ratio: number;
  monthly_net_benefit: number;
  risk_score: number; // 0-100 (higher = riskier)
  risk_adjusted_value: number;
  recommendation: string;
  sensitivity_analysis: {
    best_case: number;
    worst_case: number;
    expected: number;
  };
}

/**
 * Perform comprehensive cost-benefit analysis
 */
export function performCostBenefitAnalysis(
  params: CostBenefitParams,
): CostBenefitResult {
  // Calculate total costs
  const total_operational_costs =
    params.costs.monthly_operational * params.timeframe_months;
  const total_costs =
    params.costs.initial_investment +
    total_operational_costs +
    params.costs.one_time_fees;

  // Calculate total benefits
  const monthly_benefits =
    params.benefits.material_savings +
    params.benefits.waste_disposal_savings +
    params.benefits.waste_sale_revenue +
    (params.benefits.carbon_credit_value || 0) +
    (params.benefits.brand_value || 0);

  const total_benefits = monthly_benefits * params.timeframe_months;

  const net_value = total_benefits - total_costs;
  const benefit_cost_ratio = total_costs > 0 ? total_benefits / total_costs : 0;

  // Risk scoring
  const risk_weights = {
    quality_risk: { low: 10, medium: 25, high: 40 },
    supply_risk: { low: 10, medium: 25, high: 40 },
    market_risk: { low: 5, medium: 15, high: 30 },
  };

  const risk_score =
    risk_weights.quality_risk[params.risks.quality_risk] +
    risk_weights.supply_risk[params.risks.supply_risk] +
    risk_weights.market_risk[params.risks.market_risk];

  // Risk-adjusted value (discount by risk)
  const risk_adjusted_value = net_value * (1 - risk_score / 100);

  // Sensitivity analysis
  const sensitivity_analysis = {
    best_case: net_value * 1.3, // 30% better
    worst_case: net_value * 0.7, // 30% worse
    expected: net_value,
  };

  // Recommendation
  let recommendation = "";
  if (benefit_cost_ratio >= 2 && risk_score < 50) {
    recommendation =
      "Highly recommended: Strong positive ROI with manageable risk";
  } else if (benefit_cost_ratio >= 1.5 && risk_score < 70) {
    recommendation = "Recommended: Good financial case with acceptable risk";
  } else if (benefit_cost_ratio >= 1.2) {
    recommendation = "Consider: Positive return but requires risk mitigation";
  } else if (benefit_cost_ratio >= 1.0) {
    recommendation =
      "Marginal: Break-even case, consider non-financial benefits";
  } else {
    recommendation = "Not recommended: Negative financial impact";
  }

  return {
    total_costs,
    total_benefits,
    net_value,
    benefit_cost_ratio,
    monthly_net_benefit: monthly_benefits - params.costs.monthly_operational,
    risk_score,
    risk_adjusted_value,
    recommendation,
    sensitivity_analysis,
  };
}

// ============================================
// COMPREHENSIVE ECONOMIC REPORT
// ============================================

export interface EconomicReportParams {
  company_id: string;
  period_start: Date;
  period_end: Date;
  material_costs: number; // €
  waste_disposal_costs: number; // €
  total_revenue: number; // €
  circular_opportunities: CircularSavingsParams[];
  waste_opportunities: WasteToValueParams;
}

export interface EconomicReport {
  current_state: {
    material_costs: number;
    waste_costs: number;
    total_costs: number;
    cost_per_revenue: number;
  };
  circular_potential: {
    material_savings: number;
    waste_value: number;
    total_benefit: number;
    annual_projection: number;
  };
  top_opportunities: Array<{
    type: "material" | "waste";
    description: string;
    monthly_benefit: number;
    recommendation: string;
  }>;
  summary: {
    current_monthly_costs: number;
    potential_monthly_savings: number;
    potential_monthly_revenue: number;
    net_monthly_benefit: number;
    payback_period_months: number;
  };
}

/**
 * Generate comprehensive economic report
 */
export function generateEconomicReport(
  params: EconomicReportParams,
): EconomicReport {
  // Current state
  const total_costs = params.material_costs + params.waste_disposal_costs;
  const cost_per_revenue =
    params.total_revenue > 0 ? (total_costs / params.total_revenue) * 100 : 0;

  // Analyze circular material opportunities
  let material_savings = 0;
  const material_opportunities: Array<{
    type: "material";
    description: string;
    monthly_benefit: number;
    recommendation: string;
  }> = [];

  for (const opp of params.circular_opportunities) {
    const savings = calculateCircularSavings(opp);
    if (savings.cost_savings > 0) {
      material_savings += savings.cost_savings;
      material_opportunities.push({
        type: "material",
        description: `Switch from ${opp.virgin_material.type} to ${opp.circular_alternative.type}`,
        monthly_benefit: savings.cost_savings,
        recommendation: savings.reasoning,
      });
    }
  }

  // Analyze waste opportunities
  const waste_analysis = calculateWasteToValue(params.waste_opportunities);
  const waste_opportunities = waste_analysis.best_opportunities
    .filter((o) => o.priority === "high" || o.priority === "medium")
    .map((o) => ({
      type: "waste" as const,
      description: `Sell ${o.material} waste instead of disposal`,
      monthly_benefit: o.benefit,
      recommendation: `${o.priority === "high" ? "High priority" : "Medium priority"} - ${o.benefit.toFixed(0)}€/month potential`,
    }));

  // Combine and sort opportunities
  const top_opportunities = [...material_opportunities, ...waste_opportunities]
    .sort((a, b) => b.monthly_benefit - a.monthly_benefit)
    .slice(0, 5);

  const total_benefit = material_savings + waste_analysis.net_benefit;

  return {
    current_state: {
      material_costs: params.material_costs,
      waste_costs: params.waste_disposal_costs,
      total_costs,
      cost_per_revenue,
    },
    circular_potential: {
      material_savings,
      waste_value: waste_analysis.net_benefit,
      total_benefit,
      annual_projection: total_benefit * 12,
    },
    top_opportunities,
    summary: {
      current_monthly_costs: total_costs,
      potential_monthly_savings: material_savings,
      potential_monthly_revenue: waste_analysis.potential_revenue,
      net_monthly_benefit: total_benefit,
      payback_period_months: waste_analysis.payback_period_months,
    },
  };
}
