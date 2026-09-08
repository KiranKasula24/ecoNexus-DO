import { findMaterial } from "@/lib/constants/material-database";
import type { Database } from "@/types/database";
import type {
  IdentifiedMaterial,
  MaterialCategory,
  WasteClassification,
  WasteClassificationResult,
} from "@/types/material";

type MaterialInsert = Database["public"]["Tables"]["materials"]["Insert"];
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type WasteInsert = Database["public"]["Tables"]["waste_streams"]["Insert"];
type WasteRow = Database["public"]["Tables"]["waste_streams"]["Row"];

const DEFAULT_DISPOSAL_COST_PER_TON = 50;

export function getPeriodStart(dateInput?: string): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    return formatDateOnly(new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), 1)));
  }

  return formatDateOnly(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
}

export function getPeriodEnd(periodStart: string): string {
  const date = new Date(periodStart);
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return formatDateOnly(end);
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function buildMaterialInsertRows(
  companyId: string,
  materials: IdentifiedMaterial[],
  periodStart: string,
): MaterialInsert[] {
  return materials.map((material) => {
    const costPerUnit =
      material.cost && material.quantity > 0
        ? material.cost / material.quantity
        : null;

    return {
      company_id: companyId,
      material_type: material.material_type,
      category: material.category,
      monthly_volume: material.quantity,
      unit: material.unit || "units",
      cost_per_unit: costPerUnit,
      carbon_footprint: estimateCarbonFootprint(material),
      date_recorded: periodStart,
    };
  });
}

export function buildWasteInsertRows(
  companyId: string,
  materials: MaterialRow[],
): WasteInsert[] {
  return materials
    .filter((material) => isWasteCategory(material.category))
    .map((material) => {
      const classificationResult = classifyWaste(
        material.material_type,
        material.category as MaterialCategory,
      );
      const disposalCost = estimateDisposalCost(material.monthly_volume, material.unit);
      const potentialValue = estimatePotentialValue(material.material_type, material.monthly_volume, material.unit);

      return {
        company_id: companyId,
        material_id: material.id,
        classification: classificationResult.classification,
        monthly_volume: material.monthly_volume,
        current_disposal_cost: disposalCost,
        contamination_level: null,
        quality_grade: null,
        potential_value: potentialValue,
      };
    });
}

export function calculateMaterialFlowTotals(materials: MaterialRow[], waste: WasteRow[]) {
  const totalInput = sumBy(materials.filter((m) => m.category === "input"), (m) => m.monthly_volume);
  const totalOutput = sumBy(
    materials.filter((m) => m.category === "output" || m.category === "byproduct"),
    (m) => m.monthly_volume,
  );
  const totalWaste = sumBy(waste, (w) => w.monthly_volume);
  const efficiencyRate = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;

  return {
    total_input: totalInput,
    total_output: totalOutput,
    total_waste: totalWaste,
    efficiency_rate: Number(efficiencyRate.toFixed(2)),
  };
}

export function classifyWaste(
  materialType: string,
  category: MaterialCategory,
): WasteClassificationResult {
  const reference = findMaterial(materialType);

  if (category === "byproduct") {
    return {
      classification: "reusable",
      confidence: 0.7,
      reasoning: "Byproduct streams are often reusable with minimal processing.",
      potential_value: estimatePotentialValue(materialType, 1, "tons"),
      recommended_action: "Identify internal or external reuse pathways.",
    };
  }

  if (!reference) {
    return {
      classification: "landfill",
      confidence: 0.3,
      reasoning: "No material reference found; defaulting to landfill.",
      potential_value: 0,
      recommended_action: "Collect more material detail before reclassification.",
    };
  }

  const classification = mapCategoryToWaste(reference.category);
  const reasoning = `Classified based on ${reference.category} material properties.`;

  return {
    classification,
    confidence: 0.6,
    reasoning,
    potential_value: estimatePotentialValue(materialType, 1, "tons"),
    recommended_action: recommendedActionFor(classification),
  };
}

function mapCategoryToWaste(category: string): WasteClassification {
  if (category === "metal" || category === "plastic") return "recyclable";
  if (category === "organic") return "processable";
  if (category === "chemical") return "processable";
  return "landfill";
}

function recommendedActionFor(classification: WasteClassification): string {
  switch (classification) {
    case "reusable":
      return "Capture for direct reuse or resale.";
    case "recyclable":
      return "Route to recycling partner.";
    case "processable":
      return "Send to processing or composting facility.";
    case "energy_recovery":
      return "Evaluate energy recovery options.";
    case "landfill":
    default:
      return "Optimize to reduce landfill dependency.";
  }
}

function estimateDisposalCost(volume: number, unit: string): number {
  if (unit === "tons") {
    return Number((volume * DEFAULT_DISPOSAL_COST_PER_TON).toFixed(2));
  }
  return 0;
}

function estimatePotentialValue(
  materialType: string,
  volume: number,
  unit: string,
): number {
  const reference = findMaterial(materialType);
  if (!reference?.average_cost_per_ton) return 0;
  if (unit !== "tons") return 0;
  return Number((volume * reference.average_cost_per_ton).toFixed(2));
}

function estimateCarbonFootprint(material: IdentifiedMaterial): number | null {
  const reference = findMaterial(material.material_type);
  if (!reference?.carbon_factor) return null;
  if (material.unit !== "tons") return null;
  const kgCo2 = material.quantity * 1000 * reference.carbon_factor;
  return Number(kgCo2.toFixed(2));
}

function isWasteCategory(category: string): boolean {
  return category === "waste" || category === "byproduct";
}

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((sum, item) => sum + selector(item), 0);
}
