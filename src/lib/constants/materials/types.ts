/**
 * Material SKU Type Definitions
 */

export type WasteTier = "T1" | "T2" | "T3" | "T4";
export type QualityTier = "Q1" | "Q2" | "Q3" | "Q4";
export type ContaminationLevel = "C0" | "C1" | "C2" | "C3";
export type MaterialUnit = "t" | "kg" | "L" | "m3" | "kWh" | "Nm3" | string;
export type PackingGroup = "I" | "II" | "III";

export interface Range {
  min?: number;
  max?: number;
  unit?: string;
}

export interface MaterialComposition {
  element: string;
  range: Range;
  unit: string;
}

export interface HazardProperties {
  unNumber?: string;
  adrClass?: string;
  packingGroup?: PackingGroup;
  hProperties: string[];
  flashPoint?: number;
  transportRestrictions?: string | string[];
}

export interface QualityTierRequirement {
  tier: QualityTier;
  requirements: string | string[];
  priceMultiplier: number;
  contaminationMax: number;
  certificationRequired?: boolean;
}

export interface PricingData {
  basePrice: number;
  unit: MaterialUnit;
  range?: Range;
  priceRange?: Range;
  marketIndex?: string;
  updateFrequency?: string;
  lastUpdated?: Date;
}

export interface ProcessingRequirements {
  recyclingRoutes?: string[];
  recyclingRoute?: string[];
  specialRequirements?: string | string[];
  difficulty?: string;
  processingDifficulty?: string;
  energyRequired?: number;
  equipmentNeeded?: string[];
}

export interface MaterialSpecifications {
  composition: MaterialComposition[];
  physicalForm: string | string[];
  particleSize?: Range;
  bulkDensity?: Range;
  moisture?: Range;
  temperature?: Range;
}

export interface MaterialSKU {
  id: string;
  class?: number;
  subclass?: string;
  sku?: string;

  ewcCode?: string;
  ewcDescription?: string;
  tradeName?: string;
  alternativeNames?: string[];

  wasteTier: WasteTier;
  wasteTierDescription?: string;

  specifications: MaterialSpecifications;

  hazard?: HazardProperties;

  pricing: PricingData;

  qualityTiers: QualityTierRequirement[];

  processing?: ProcessingRequirements;
  recyclingRoutes?: string[];
  recyclingRoute?: string[];
  specialRequirements?: string | string[];
  difficulty?: string;
  processingDifficulty?: string;
  energyRequired?: number;
  equipmentNeeded?: string[];

  marketData: {
    demand: string;
    supply: string;
    volatility: string;
    seasonality?: boolean | string;
  };

  environmental: {
    carbonFootprint: number;
    carbonAvoided: number;
    recyclabilityScore: number;
    maxRecycleLoops?: number;
  };

  typicalSources: string[];
  endMarkets: string[];
  notes?: string;
}

export interface MaterialClass {
  classNumber: number;
  className: string;
  description: string;
  skuCount: number;
  materials: MaterialSKU[];
}

export interface MaterialSearchOptions {
  class?: number;
  wasteTier?: WasteTier;
  ewcCode?: string;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  hazardous?: boolean;
}

export interface MaterialSearchResult {
  material: MaterialSKU;
  relevance: number;
  matchedFields: string[];
}
