/**
 * ENVIRONMENTAL KPI CALCULATIONS
 * Carbon emissions, energy efficiency, and environmental impact metrics
 */

import {
  getMaterialProperties,
  MaterialProperties,
} from "@/lib/constants/material-database";

// ============================================
// CARBON EMISSIONS CALCULATIONS
// ============================================

export interface CarbonEmissionsParams {
  material_type: string;
  volume: number; // tons
  process: "virgin" | "recycled" | "disposal";
  transport_distance_km?: number;
}

export interface CarbonEmissionsResult {
  process_emissions: number; // kg CO₂
  transport_emissions: number; // kg CO₂
  total_emissions: number; // kg CO₂
  emissions_per_unit: number; // kg CO₂/ton
  breakdown: {
    process: number;
    transport: number;
  };
}

/**
 * Calculate carbon emissions for material usage
 */
export function calculateCarbonEmissions(
  params: CarbonEmissionsParams,
): CarbonEmissionsResult {
  const props = getMaterialProperties(params.material_type);

  if (!props) {
    return {
      process_emissions: 0,
      transport_emissions: 0,
      total_emissions: 0,
      emissions_per_unit: 0,
      breakdown: { process: 0, transport: 0 },
    };
  }

  // Process emissions
  let process_emissions = 0;
  switch (params.process) {
    case "virgin":
      process_emissions =
        props.carbon_footprint.virgin_production * params.volume;
      break;
    case "recycled":
      process_emissions = props.carbon_footprint.recycling * params.volume;
      break;
    case "disposal":
      process_emissions = props.carbon_footprint.disposal * params.volume;
      break;
  }

  // Transport emissions
  const transport_emissions = params.transport_distance_km
    ? props.carbon_footprint.transport_per_km *
      params.volume *
      params.transport_distance_km
    : 0;

  const total_emissions = process_emissions + transport_emissions;
  const emissions_per_unit =
    params.volume > 0 ? total_emissions / params.volume : 0;

  return {
    process_emissions,
    transport_emissions,
    total_emissions,
    emissions_per_unit,
    breakdown: {
      process: process_emissions,
      transport: transport_emissions,
    },
  };
}

/**
 * Calculate carbon savings from using circular materials
 */
export interface CarbonSavingsParams {
  virgin_material: {
    type: string;
    volume: number;
    transport_distance_km?: number;
  };
  circular_material: {
    type: string;
    volume: number;
    transport_distance_km?: number;
  };
}

export interface CarbonSavingsResult {
  virgin_emissions: number;
  circular_emissions: number;
  savings: number; // kg CO₂ saved
  savings_percentage: number;
  equivalent_trees: number; // trees needed to offset
  equivalent_cars: number; // cars off road for 1 year
}

export function calculateCarbonSavings(
  params: CarbonSavingsParams,
): CarbonSavingsResult {
  // Virgin material emissions
  const virgin = calculateCarbonEmissions({
    material_type: params.virgin_material.type,
    volume: params.virgin_material.volume,
    process: "virgin",
    transport_distance_km: params.virgin_material.transport_distance_km,
  });

  // Circular material emissions
  const circular = calculateCarbonEmissions({
    material_type: params.circular_material.type,
    volume: params.circular_material.volume,
    process: "recycled",
    transport_distance_km: params.circular_material.transport_distance_km,
  });

  const savings = virgin.total_emissions - circular.total_emissions;
  const savings_percentage =
    virgin.total_emissions > 0 ? (savings / virgin.total_emissions) * 100 : 0;

  // CO₂ equivalents
  const equivalent_trees = savings / 21; // 1 tree absorbs ~21 kg CO₂/year
  const equivalent_cars = savings / 4600; // 1 car emits ~4.6 tons CO₂/year

  return {
    virgin_emissions: virgin.total_emissions,
    circular_emissions: circular.total_emissions,
    savings,
    savings_percentage,
    equivalent_trees: Math.round(equivalent_trees),
    equivalent_cars: Math.round(equivalent_cars * 10) / 10,
  };
}

// ============================================
// ENERGY EFFICIENCY CALCULATIONS
// ============================================

export interface EnergyEfficiencyParams {
  total_energy_kwh: number;
  total_revenue: number;
  total_output_volume?: number; // tons
  industry?: string;
}

export interface EnergyEfficiencyResult {
  energy_per_revenue: number; // kWh per €1000
  energy_per_output?: number; // kWh per ton
  industry_comparison?: "below" | "median" | "above";
  efficiency_rating: "poor" | "fair" | "good" | "excellent";
}

/**
 * Calculate energy efficiency metrics
 */
export function calculateEnergyEfficiency(
  params: EnergyEfficiencyParams,
): EnergyEfficiencyResult {
  const energy_per_revenue =
    params.total_revenue > 0
      ? (params.total_energy_kwh / params.total_revenue) * 1000
      : 0;

  const energy_per_output =
    params.total_output_volume && params.total_output_volume > 0
      ? params.total_energy_kwh / params.total_output_volume
      : undefined;

  // Efficiency rating (general thresholds)
  let efficiency_rating: "poor" | "fair" | "good" | "excellent";
  if (energy_per_revenue < 500) {
    efficiency_rating = "excellent";
  } else if (energy_per_revenue < 800) {
    efficiency_rating = "good";
  } else if (energy_per_revenue < 1200) {
    efficiency_rating = "fair";
  } else {
    efficiency_rating = "poor";
  }

  return {
    energy_per_revenue,
    energy_per_output,
    efficiency_rating,
  };
}

/**
 * Calculate potential energy savings
 */
export interface EnergySavingsParams {
  current_energy_kwh: number;
  target_efficiency_improvement: number; // percentage (e.g., 20 for 20%)
  electricity_cost_per_kwh: number; // €/kWh
}

export interface EnergySavingsResult {
  current_energy: number;
  potential_energy: number;
  energy_saved: number; // kWh
  cost_saved: number; // €
  carbon_saved: number; // kg CO₂ (assuming grid carbon intensity)
}

export function calculateEnergySavings(
  params: EnergySavingsParams,
): EnergySavingsResult {
  const energy_saved =
    params.current_energy_kwh * (params.target_efficiency_improvement / 100);
  const potential_energy = params.current_energy_kwh - energy_saved;
  const cost_saved = energy_saved * params.electricity_cost_per_kwh;

  // EU grid average: ~0.3 kg CO₂/kWh
  const carbon_saved = energy_saved * 0.3;

  return {
    current_energy: params.current_energy_kwh,
    potential_energy,
    energy_saved,
    cost_saved,
    carbon_saved,
  };
}

// ============================================
// CARBON PER REVENUE CALCULATIONS
// ============================================

export interface CarbonPerRevenueParams {
  total_carbon_kg: number;
  total_revenue: number;
  industry?: string;
}

export interface CarbonPerRevenueResult {
  carbon_per_revenue: number; // kg CO₂ per €1000
  carbon_intensity_rating: "low" | "medium" | "high" | "very-high";
  industry_comparison?: "below" | "median" | "above";
}

/**
 * Calculate carbon intensity per revenue
 */
export function calculateCarbonPerRevenue(
  params: CarbonPerRevenueParams,
): CarbonPerRevenueResult {
  const carbon_per_revenue =
    params.total_revenue > 0
      ? (params.total_carbon_kg / params.total_revenue) * 1000
      : 0;

  // Carbon intensity rating (general thresholds)
  let carbon_intensity_rating: "low" | "medium" | "high" | "very-high";
  if (carbon_per_revenue < 300) {
    carbon_intensity_rating = "low";
  } else if (carbon_per_revenue < 600) {
    carbon_intensity_rating = "medium";
  } else if (carbon_per_revenue < 1000) {
    carbon_intensity_rating = "high";
  } else {
    carbon_intensity_rating = "very-high";
  }

  return {
    carbon_per_revenue,
    carbon_intensity_rating,
  };
}

// ============================================
// WASTE DIVERSION CALCULATIONS
// ============================================

export interface WasteDiversionParams {
  total_waste: number; // tons
  landfill_waste: number; // tons
  recycled_waste: number; // tons
  energy_recovery_waste: number; // tons
}

export interface WasteDiversionResult {
  diversion_rate: number; // percentage
  landfill_rate: number; // percentage
  recycling_rate: number; // percentage
  energy_recovery_rate: number; // percentage
  diversion_rating: "poor" | "fair" | "good" | "excellent";
}

/**
 * Calculate waste diversion metrics
 */
export function calculateWasteDiversion(
  params: WasteDiversionParams,
): WasteDiversionResult {
  const total = params.total_waste || 1; // Avoid division by zero

  const landfill_rate = (params.landfill_waste / total) * 100;
  const recycling_rate = (params.recycled_waste / total) * 100;
  const energy_recovery_rate = (params.energy_recovery_waste / total) * 100;
  const diversion_rate = 100 - landfill_rate;

  // Diversion rating
  let diversion_rating: "poor" | "fair" | "good" | "excellent";
  if (diversion_rate >= 90) {
    diversion_rating = "excellent";
  } else if (diversion_rate >= 70) {
    diversion_rating = "good";
  } else if (diversion_rate >= 50) {
    diversion_rating = "fair";
  } else {
    diversion_rating = "poor";
  }

  return {
    diversion_rate,
    landfill_rate,
    recycling_rate,
    energy_recovery_rate,
    diversion_rating,
  };
}

// ============================================
// COMPREHENSIVE ENVIRONMENTAL REPORT
// ============================================

export interface EnvironmentalReportParams {
  company_id: string;
  period_start: Date;
  period_end: Date;
  materials: Array<{
    material_type: string;
    volume: number;
    process: "virgin" | "recycled";
    transport_distance_km?: number;
  }>;
  waste: Array<{
    material_type: string;
    volume: number;
    classification: "landfill" | "recycling" | "energy_recovery";
  }>;
  energy_kwh: number;
  revenue: number;
}

export interface EnvironmentalReport {
  carbon_emissions: {
    total: number;
    by_source: {
      materials: number;
      transport: number;
      waste_disposal: number;
    };
    per_revenue: number;
  };
  energy: {
    total_kwh: number;
    per_revenue: number;
    efficiency_rating: string;
  };
  waste_diversion: WasteDiversionResult;
  circular_content_percentage: number;
  recommendations: string[];
}

/**
 * Generate comprehensive environmental report
 */
export function generateEnvironmentalReport(
  params: EnvironmentalReportParams,
): EnvironmentalReport {
  // Calculate emissions from materials
  let materials_emissions = 0;
  let transport_emissions = 0;
  let recycled_volume = 0;
  let total_materials_volume = 0;

  for (const material of params.materials) {
    const emissions = calculateCarbonEmissions({
      material_type: material.material_type,
      volume: material.volume,
      process: material.process,
      transport_distance_km: material.transport_distance_km,
    });

    materials_emissions += emissions.process_emissions;
    transport_emissions += emissions.transport_emissions;

    if (material.process === "recycled") {
      recycled_volume += material.volume;
    }
    total_materials_volume += material.volume;
  }

  // Calculate emissions from waste disposal
  let waste_disposal_emissions = 0;
  let landfill_waste = 0;
  let recycled_waste = 0;
  let energy_recovery_waste = 0;

  for (const waste of params.waste) {
    const emissions = calculateCarbonEmissions({
      material_type: waste.material_type,
      volume: waste.volume,
      process: "disposal",
    });

    waste_disposal_emissions += emissions.total_emissions;

    if (waste.classification === "landfill") {
      landfill_waste += waste.volume;
    } else if (waste.classification === "recycling") {
      recycled_waste += waste.volume;
    } else if (waste.classification === "energy_recovery") {
      energy_recovery_waste += waste.volume;
    }
  }

  const total_waste = landfill_waste + recycled_waste + energy_recovery_waste;

  // Total carbon
  const total_carbon =
    materials_emissions + transport_emissions + waste_disposal_emissions;
  const carbon_per_revenue = calculateCarbonPerRevenue({
    total_carbon_kg: total_carbon,
    total_revenue: params.revenue,
  });

  // Energy efficiency
  const energy_efficiency = calculateEnergyEfficiency({
    total_energy_kwh: params.energy_kwh,
    total_revenue: params.revenue,
  });

  // Waste diversion
  const waste_diversion = calculateWasteDiversion({
    total_waste,
    landfill_waste,
    recycled_waste,
    energy_recovery_waste,
  });

  // Circular content percentage
  const circular_content_percentage =
    total_materials_volume > 0
      ? (recycled_volume / total_materials_volume) * 100
      : 0;

  // Generate recommendations
  const recommendations: string[] = [];

  if (circular_content_percentage < 30) {
    recommendations.push(
      "Increase use of recycled/circular materials to reduce virgin material consumption",
    );
  }

  if (waste_diversion.diversion_rate < 70) {
    recommendations.push(
      "Improve waste diversion rate through better sorting and recycling programs",
    );
  }

  if (
    carbon_per_revenue.carbon_intensity_rating === "high" ||
    carbon_per_revenue.carbon_intensity_rating === "very-high"
  ) {
    recommendations.push(
      "Focus on carbon reduction: switch to renewable energy and optimize processes",
    );
  }

  if (
    energy_efficiency.efficiency_rating === "poor" ||
    energy_efficiency.efficiency_rating === "fair"
  ) {
    recommendations.push(
      "Implement energy efficiency measures: upgrade equipment and optimize operations",
    );
  }

  if (transport_emissions > total_carbon * 0.2) {
    recommendations.push(
      "Reduce transport emissions: source materials locally and optimize logistics",
    );
  }

  return {
    carbon_emissions: {
      total: total_carbon,
      by_source: {
        materials: materials_emissions,
        transport: transport_emissions,
        waste_disposal: waste_disposal_emissions,
      },
      per_revenue: carbon_per_revenue.carbon_per_revenue,
    },
    energy: {
      total_kwh: params.energy_kwh,
      per_revenue: energy_efficiency.energy_per_revenue,
      efficiency_rating: energy_efficiency.efficiency_rating,
    },
    waste_diversion,
    circular_content_percentage,
    recommendations,
  };
}
