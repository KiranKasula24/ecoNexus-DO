import type { Database } from "@/types/database";

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type WasteRow = Database["public"]["Tables"]["waste_streams"]["Row"];
type CompanyKpiInsert = Database["public"]["Tables"]["company_kpis"]["Insert"];

export function buildCompanyKpiInsert(
  companyId: string,
  periodStart: string,
  materials: MaterialRow[],
  waste: WasteRow[],
): CompanyKpiInsert {
  const totalInput = sumBy(
    materials.filter((m) => m.category === "input"),
    (m) => m.monthly_volume,
  );
  const totalOutput = sumBy(
    materials.filter((m) => m.category === "output" || m.category === "byproduct"),
    (m) => m.monthly_volume,
  );
  const totalWaste = sumBy(waste, (w) => w.monthly_volume);
  const landfillWaste = sumBy(
    waste.filter((w) => w.classification === "landfill"),
    (w) => w.monthly_volume,
  );

  const totalWasteCost = sumBy(waste, (w) => w.current_disposal_cost || 0);
  const potentialCircularRevenue = sumBy(waste, (w) => w.potential_value || 0);

  const mciScore = totalInput > 0 ? (1 - totalWaste / totalInput) * 100 : 0;
  const landfillDiversion =
    totalWaste > 0 ? (1 - landfillWaste / totalWaste) * 100 : 0;

  const materialById = new Map(materials.map((material) => [material.id, material]));
  const carbonEmissions = sumBy(
    materials.filter((m) => m.category === "input"),
    (m) => m.carbon_footprint || 0,
  );
  const carbonSavedPotential = sumBy(
    waste.filter((w) => w.classification !== "landfill"),
    (w) => (w.material_id ? materialById.get(w.material_id)?.carbon_footprint : 0) || 0,
  );

  const emissionIntensity =
    totalOutput > 0 ? carbonEmissions / totalOutput : 0;

  return {
    company_id: companyId,
    period: periodStart,
    mci_score: Number(mciScore.toFixed(2)),
    waste_to_value_ratio:
      potentialCircularRevenue > 0
        ? Number((totalWasteCost / potentialCircularRevenue).toFixed(2))
        : null,
    landfill_diversion_percentage: Number(landfillDiversion.toFixed(2)),
    total_input_volume: Number(totalInput.toFixed(2)),
    total_output_volume: Number(totalOutput.toFixed(2)),
    total_waste_volume: Number(totalWaste.toFixed(2)),
    total_waste_cost: Number(totalWasteCost.toFixed(2)),
    potential_circular_revenue: Number(potentialCircularRevenue.toFixed(2)),
    net_circular_value: Number((potentialCircularRevenue - totalWasteCost).toFixed(2)),
    carbon_emissions: Number(carbonEmissions.toFixed(2)),
    carbon_saved_potential: Number(carbonSavedPotential.toFixed(2)),
    emission_intensity: Number(emissionIntensity.toFixed(2)),
    industry_percentile: null,
  };
}

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((sum, item) => sum + selector(item), 0);
}
