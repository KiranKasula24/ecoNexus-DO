/**
 * MASTER MATERIAL INDEX
 * Central export for 195 material SKUs across 10 classes
 * Provides comprehensive search, filtering, and lookup functions
 * 
 * SKU Count: 12 + 13 + 40 + 20 + 25 + 15 + 15 + 15 + 15 + 10 = 180 SKUs
 */

import {
  MaterialSKU,
  MaterialClass,
  MaterialSearchOptions,
  MaterialSearchResult,
  WasteTier,
} from "./types";
import { FERROUS_METALS, FERROUS_METALS_CLASS } from "./ferrous-metals";
import {
  NON_FERROUS_METALS,
  NON_FERROUS_METALS_CLASS,
} from "./non-ferrous-metals";
import { POLYMERS, POLYMERS_CLASS } from "./polymers";
import {
  PROCESS_CHEMICALS,
  PROCESS_CHEMICALS_CLASS,
} from "./process-chemicals";
import { ORGANICS, ORGANICS_CLASS } from "./organics";
import { ENERGY, ENERGY_CLASS } from "./energy";
import { TEXTILES, TEXTILES_CLASS } from "./textiles";
import { GLASS_CERAMICS, GLASS_CERAMICS_CLASS } from "./glass-ceramics";
import {
  ELECTRONICS_BATTERIES,
  ELECTRONICS_BATTERIES_CLASS,
} from "./electronics-batteries";
import { COMPOSITES, COMPOSITES_CLASS } from "./composites";

// Export all material classes
export const MATERIAL_CLASSES: MaterialClass[] = [
  FERROUS_METALS_CLASS,
  NON_FERROUS_METALS_CLASS,
  POLYMERS_CLASS,
  PROCESS_CHEMICALS_CLASS,
  ORGANICS_CLASS,
  ENERGY_CLASS,
  TEXTILES_CLASS,
  GLASS_CERAMICS_CLASS,
  ELECTRONICS_BATTERIES_CLASS,
  COMPOSITES_CLASS,
];

// Flatten all materials into single searchable array
export const ALL_MATERIALS: MaterialSKU[] = MATERIAL_CLASSES.flatMap(
  (c) => c.materials,
);

// Class metadata
export const CLASS_METADATA = {
  1: { name: "Ferrous Metals", icon: "", color: "#8B4513" },
  2: { name: "Non-Ferrous Metals", icon: "", color: "#FFD700" },
  3: { name: "Polymers & Plastics", icon: "", color: "#4169E1" },
  4: { name: "Process Chemicals", icon: "", color: "#FF4500" },
  5: { name: "Organic Waste", icon: "", color: "#228B22" },
  6: { name: "Energy Streams", icon: "", color: "#FF8C00" },
  7: { name: "Textiles", icon: "", color: "#FF69B4" },
  8: { name: "Glass & Ceramics", icon: "", color: "#CD853F" },
  9: { name: "Electronics & Batteries", icon: "", color: "#32CD32" },
  10: { name: "Composites", icon: "", color: "#9370DB" },
};

/**
 * Get all materials (180 SKUs)
 */
export function getAllMaterials(): MaterialSKU[] {
  return ALL_MATERIALS;
}

/**
 * Get material by exact ID
 */
export function getMaterialById(id: string): MaterialSKU | undefined {
  return ALL_MATERIALS.find((m) => m.id === id);
}

/**
 * Get material by SKU code
 */
export function getMaterialBySKU(sku: string): MaterialSKU | undefined {
  return ALL_MATERIALS.find(
    (m) => (m.sku ?? "").toUpperCase() === sku.toUpperCase(),
  );
}

/**
 * Get materials by EWC code
 */
export function getMaterialsByEWC(ewcCode: string): MaterialSKU[] {
  const normalized = ewcCode.replace(/\s+/g, " ").trim();
  return ALL_MATERIALS.filter((m) => m.ewcCode === normalized);
}

/**
 * Get materials by class number
 */
export function getMaterialsByClass(classNumber: number): MaterialSKU[] {
  return ALL_MATERIALS.filter((m) => m.class === classNumber);
}

/**
 * Get materials by waste tier
 */
export function getMaterialsByWasteTier(tier: WasteTier): MaterialSKU[] {
  return ALL_MATERIALS.filter((m) => m.wasteTier === tier);
}

/**
 * Get hazardous materials only
 */
export function getHazardousMaterials(): MaterialSKU[] {
  return ALL_MATERIALS.filter(
    (m) => m.wasteTier === "T4" || m.hazard !== undefined,
  );
}

/**
 * Search materials with comprehensive filtering
 */
export function searchMaterials(
  options: MaterialSearchOptions,
): MaterialSearchResult[] {
  let results = [...ALL_MATERIALS];

  // Filter by class
  if (options.class !== undefined) {
    results = results.filter((m) => m.class === options.class);
  }

  // Filter by waste tier
  if (options.wasteTier) {
    results = results.filter((m) => m.wasteTier === options.wasteTier);
  }

  // Filter by EWC code
  if (options.ewcCode) {
    const normalized = options.ewcCode.replace(/\s+/g, " ").trim();
    results = results.filter((m) => (m.ewcCode ?? "").includes(normalized));
  }

  // Filter by price range
  if (options.minPrice !== undefined) {
    results = results.filter((m) => m.pricing.basePrice >= options.minPrice!);
  }
  if (options.maxPrice !== undefined) {
    results = results.filter((m) => m.pricing.basePrice <= options.maxPrice!);
  }

  // Filter by hazardous
  if (options.hazardous !== undefined) {
    if (options.hazardous) {
      results = results.filter(
        (m) => m.wasteTier === "T4" || m.hazard !== undefined,
      );
    } else {
      results = results.filter(
        (m) => m.wasteTier !== "T4" && m.hazard === undefined,
      );
    }
  }

  // Keyword search (fuzzy matching)
  if (options.keyword) {
    const keyword = options.keyword.toLowerCase();
    return results
      .map((material) => {
        let relevance = 0;
        const matchedFields: string[] = [];

        // Check trade name (highest weight)
        if ((material.tradeName ?? "").toLowerCase().includes(keyword)) {
          relevance += 10;
          matchedFields.push("tradeName");
        }

        // Check SKU code
        if ((material.sku ?? "").toLowerCase().includes(keyword)) {
          relevance += 8;
          matchedFields.push("sku");
        }

        // Check alternative names
        material.alternativeNames?.forEach((name) => {
          if (name.toLowerCase().includes(keyword)) {
            relevance += 6;
            matchedFields.push("alternativeNames");
          }
        });

        // Check EWC description
        if ((material.ewcDescription ?? "").toLowerCase().includes(keyword)) {
          relevance += 5;
          matchedFields.push("ewcDescription");
        }

        // Check typical sources
        material.typicalSources.forEach((source) => {
          if (source.toLowerCase().includes(keyword)) {
            relevance += 3;
            matchedFields.push("typicalSources");
          }
        });

        // Check end markets
        material.endMarkets.forEach((market) => {
          if (market.toLowerCase().includes(keyword)) {
            relevance += 2;
            matchedFields.push("endMarkets");
          }
        });

        // Check notes
        if (material.notes && material.notes.toLowerCase().includes(keyword)) {
          relevance += 1;
          matchedFields.push("notes");
        }

        return {
          material,
          relevance,
          matchedFields: [...new Set(matchedFields)],
        };
      })
      .filter((result) => result.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);
  }

  // No keyword - just return filtered results with default relevance
  return results.map((material) => ({
    material,
    relevance: 1,
    matchedFields: [],
  }));
}

/**
 * Get suggested materials based on industry
 */
export function getSuggestedMaterialsByIndustry(
  industry: string,
): MaterialSKU[] {
  const industryMap: Record<string, string[]> = {
    "metal-fabrication": ["1.1.", "1.2.", "2.1.", "2.2."],
    "plastic-manufacturing": ["3.1.", "3.2."],
    automotive: ["1.1.4", "2.1.2", "1.2.3"],
    electronics: ["2.2.1", "2.4.1", "2.4.2"],
    "food-processing": ["5.1.", "5.2."],
    construction: ["1.1.1", "1.1.2", "12."],
  };

  const prefixes = industryMap[industry] || [];
  if (prefixes.length === 0) return [];

  return ALL_MATERIALS.filter((m) =>
    prefixes.some((prefix) => m.id.startsWith(prefix)),
  );
}

/**
 * Get materials by typical source
 */
export function getMaterialsBySource(source: string): MaterialSKU[] {
  const keyword = source.toLowerCase();
  return ALL_MATERIALS.filter((m) =>
    m.typicalSources.some((s) => s.toLowerCase().includes(keyword)),
  );
}

/**
 * Get materials by end market
 */
export function getMaterialsByEndMarket(market: string): MaterialSKU[] {
  const keyword = market.toLowerCase();
  return ALL_MATERIALS.filter((m) =>
    m.endMarkets.some((e) => e.toLowerCase().includes(keyword)),
  );
}

/**
 * Get premium materials (Q1 available + high demand)
 */
export function getPremiumMaterials(): MaterialSKU[] {
  return ALL_MATERIALS.filter(
    (m) =>
      m.qualityTiers.some((qt) => qt.tier === "Q1") &&
      (m.marketData.demand === "high" || m.marketData.demand === "very-high"),
  );
}

/**
 * Get materials with high carbon savings
 */
export function getHighCarbonSavingsMaterials(
  minSavings: number = 2000,
): MaterialSKU[] {
  return ALL_MATERIALS.filter(
    (m) => m.environmental.carbonAvoided >= minSavings,
  );
}

/**
 * Calculate price multiplier for quality/contamination
 */
export function calculatePriceMultiplier(
  materialId: string,
  qualityTier: "Q1" | "Q2" | "Q3" | "Q4",
  contaminationLevel: number,
): number {
  const material = getMaterialById(materialId);
  if (!material) return 1.0;

  const tier = material.qualityTiers.find((qt) => qt.tier === qualityTier);
  if (!tier) return 1.0;

  // Base multiplier from quality tier
  let multiplier = tier.priceMultiplier;

  // Penalty if contamination exceeds tier max
  if (contaminationLevel > tier.contaminationMax) {
    const excessContamination = contaminationLevel - tier.contaminationMax;
    multiplier *= Math.max(0.5, 1 - excessContamination * 0.05); // -5% per 1% excess
  }

  return multiplier;
}

/**
 * Get effective price for material based on quality & contamination
 */
export function getEffectivePrice(
  materialId: string,
  qualityTier: "Q1" | "Q2" | "Q3" | "Q4",
  contaminationLevel: number,
): number {
  const material = getMaterialById(materialId);
  if (!material) return 0;

  const multiplier = calculatePriceMultiplier(
    materialId,
    qualityTier,
    contaminationLevel,
  );
  return material.pricing.basePrice * multiplier;
}

/**
 * Validate EWC code format
 */
export function validateEWCCode(code: string): {
  valid: boolean;
  message?: string;
} {
  // EWC codes are: XX YY ZZ or XX YY ZZ* (hazardous)
  const pattern = /^\d{2}\s\d{2}\s\d{2}\*?$/;

  if (!pattern.test(code)) {
    return {
      valid: false,
      message: 'Invalid EWC code format. Use format: "12 01 01" or "12 01 09*"',
    };
  }

  // Check if exists in our database
  const materials = getMaterialsByEWC(code);
  if (materials.length === 0) {
    return { valid: false, message: "EWC code not found in material database" };
  }

  return { valid: true };
}

/**
 * Get waste tier from EWC code
 */
export function getWasteTierFromEWC(ewcCode: string): WasteTier | undefined {
  const materials = getMaterialsByEWC(ewcCode);
  if (materials.length === 0) return undefined;

  // Return most common tier for this EWC code
  const tierCounts = materials.reduce(
    (acc, m) => {
      acc[m.wasteTier] = (acc[m.wasteTier] || 0) + 1;
      return acc;
    },
    {} as Record<WasteTier, number>,
  );

  return Object.entries(tierCounts).sort(
    ([, a], [, b]) => b - a,
  )[0][0] as WasteTier;
}

/**
 * Check if EWC code is hazardous
 */
export function isHazardousEWC(ewcCode: string): boolean {
  return ewcCode.endsWith("*");
}

/**
 * Get statistics about material database
 */
export function getMaterialDatabaseStats() {
  return {
    totalMaterials: ALL_MATERIALS.length,
    totalClasses: MATERIAL_CLASSES.length,
    byClass: MATERIAL_CLASSES.map((c) => ({
      class: c.classNumber,
      name: c.className,
      count: c.skuCount,
    })),
    byWasteTier: {
      T1: ALL_MATERIALS.filter((m) => m.wasteTier === "T1").length,
      T2: ALL_MATERIALS.filter((m) => m.wasteTier === "T2").length,
      T3: ALL_MATERIALS.filter((m) => m.wasteTier === "T3").length,
      T4: ALL_MATERIALS.filter((m) => m.wasteTier === "T4").length,
    },
    hazardousMaterials: getHazardousMaterials().length,
    avgPricePerUnit: {
      tonne: (
        ALL_MATERIALS.filter((m) => m.pricing.unit === "t").reduce(
          (sum, m) => sum + m.pricing.basePrice,
          0,
        ) / ALL_MATERIALS.filter((m) => m.pricing.unit === "t").length
      ).toFixed(2),
    },
    highestValue: ALL_MATERIALS.reduce((max, m) =>
      m.pricing.basePrice > max.pricing.basePrice ? m : max,
    ),
    lowestValue: ALL_MATERIALS.reduce((min, m) =>
      m.pricing.basePrice < min.pricing.basePrice ? m : min,
    ),
  };
}

// Export types and constants
export type {
  MaterialSKU,
  MaterialClass,
  MaterialSearchOptions,
  MaterialSearchResult,
};
export type { WasteTier, QualityTier, ContaminationLevel, MaterialUnit } from "./types";

