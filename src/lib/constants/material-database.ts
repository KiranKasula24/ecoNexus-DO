/**
 * COMPREHENSIVE MATERIAL DATABASE
 * Contains reference data for all common materials in circular economy
 */
import {
  ALL_MATERIALS,
  CLASS_METADATA,
  type MaterialSKU,
} from "@/lib/constants/materials";

export interface MaterialProperties {
  name: string;
  material_id: string;
  category: string;
  subtype: string;

  // Physical Properties
  density: number; // kg/m³
  typical_forms: string[];

  // Economic Data
  market_price: {
    min: number;
    max: number;
    average: number;
    currency: "EUR" | "USD";
    last_updated: string;
  };

  disposal_cost: {
    landfill: number;
    incineration: number;
    recycling: number; // negative = revenue
  };

  // Environmental Data
  carbon_footprint: {
    virgin_production: number; // kg CO₂/ton
    recycling: number;
    disposal: number;
    transport_per_km: number;
  };

  energy_content: number; // MJ/kg

  // Recyclability
  recyclability_score: number; // 0-100
  max_recycling_loops: number;
  quality_degradation_per_cycle: number;

  // Processing
  processing_difficulty: "easy" | "medium" | "hard";
  contamination_tolerance: number;
  sorting_requirements: string[];

  // Market Data
  demand_level: "high" | "medium" | "low";
  supply_level: "high" | "medium" | "low";
  market_volatility: number; // 0-100

  // Quality Tiers
  quality_tiers: {
    tier: number;
    description: string;
    typical_contamination: number;
    price_multiplier: number;
  }[];
}

export const MATERIAL_DATABASE: Record<string, MaterialProperties> = {
  // ============================================
  // METALS
  // ============================================

  "steel-scrap": {
    name: "Steel Scrap",
    material_id: "steel-scrap",
    category: "metal",
    subtype: "steel",
    density: 7850,
    typical_forms: ["scrap", "sheet", "beam", "wire", "turnings"],
    market_price: {
      min: 100,
      max: 200,
      average: 150,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 80, incineration: 120, recycling: -150 },
    carbon_footprint: {
      virgin_production: 2500,
      recycling: 500,
      disposal: 50,
      transport_per_km: 0.15,
    },
    energy_content: 0,
    recyclability_score: 95,
    max_recycling_loops: 100,
    quality_degradation_per_cycle: 1,
    processing_difficulty: "easy",
    contamination_tolerance: 10,
    sorting_requirements: ["magnetic separation", "manual sorting"],
    demand_level: "high",
    supply_level: "high",
    market_volatility: 30,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean scrap, no contamination",
        typical_contamination: 0,
        price_multiplier: 1.3,
      },
      {
        tier: 2,
        description: "Minor rust, <5% contamination",
        typical_contamination: 5,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed scrap, <10% contamination",
        typical_contamination: 10,
        price_multiplier: 0.8,
      },
      {
        tier: 4,
        description: "Heavily contaminated, >10%",
        typical_contamination: 15,
        price_multiplier: 0.5,
      },
    ],
  },

  "aluminum-scrap": {
    name: "Aluminum Scrap",
    material_id: "aluminum-scrap",
    category: "metal",
    subtype: "aluminum",
    density: 2700,
    typical_forms: ["scrap", "sheet", "extrusion", "casting", "cans"],
    market_price: {
      min: 800,
      max: 1500,
      average: 1100,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 100, incineration: 150, recycling: -1100 },
    carbon_footprint: {
      virgin_production: 12000,
      recycling: 600,
      disposal: 30,
      transport_per_km: 0.08,
    },
    energy_content: 0,
    recyclability_score: 98,
    max_recycling_loops: 50,
    quality_degradation_per_cycle: 2,
    processing_difficulty: "medium",
    contamination_tolerance: 5,
    sorting_requirements: ["eddy current separation", "density separation"],
    demand_level: "high",
    supply_level: "medium",
    market_volatility: 45,
    quality_tiers: [
      {
        tier: 1,
        description: "Pure aluminum, single alloy",
        typical_contamination: 0,
        price_multiplier: 1.4,
      },
      {
        tier: 2,
        description: "Clean scrap, minimal contamination",
        typical_contamination: 3,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed alloys, <8% contamination",
        typical_contamination: 8,
        price_multiplier: 0.7,
      },
      {
        tier: 4,
        description: "Heavily oxidized or contaminated",
        typical_contamination: 15,
        price_multiplier: 0.4,
      },
    ],
  },

  "copper-scrap": {
    name: "Copper Scrap",
    material_id: "copper-scrap",
    category: "metal",
    subtype: "copper",
    density: 8960,
    typical_forms: ["wire", "pipe", "sheet", "turnings"],
    market_price: {
      min: 4000,
      max: 7000,
      average: 5500,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 150, incineration: 200, recycling: -5500 },
    carbon_footprint: {
      virgin_production: 4500,
      recycling: 800,
      disposal: 20,
      transport_per_km: 0.18,
    },
    energy_content: 0,
    recyclability_score: 99,
    max_recycling_loops: 100,
    quality_degradation_per_cycle: 0.5,
    processing_difficulty: "easy",
    contamination_tolerance: 3,
    sorting_requirements: ["manual sorting", "wire stripping"],
    demand_level: "high",
    supply_level: "medium",
    market_volatility: 60,
    quality_tiers: [
      {
        tier: 1,
        description: "Bare bright copper wire",
        typical_contamination: 0,
        price_multiplier: 1.5,
      },
      {
        tier: 2,
        description: "Clean copper scrap",
        typical_contamination: 2,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Insulated wire/mixed copper",
        typical_contamination: 5,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Heavily contaminated",
        typical_contamination: 10,
        price_multiplier: 0.3,
      },
    ],
  },

  "brass-scrap": {
    name: "Brass Scrap",
    material_id: "brass-scrap",
    category: "metal",
    subtype: "brass",
    density: 8500,
    typical_forms: ["fittings", "valves", "turnings", "mixed"],
    market_price: {
      min: 2000,
      max: 4000,
      average: 3000,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 120, incineration: 180, recycling: -3000 },
    carbon_footprint: {
      virgin_production: 3500,
      recycling: 700,
      disposal: 25,
      transport_per_km: 0.17,
    },
    energy_content: 0,
    recyclability_score: 95,
    max_recycling_loops: 80,
    quality_degradation_per_cycle: 1.5,
    processing_difficulty: "medium",
    contamination_tolerance: 5,
    sorting_requirements: ["density separation", "manual sorting"],
    demand_level: "medium",
    supply_level: "medium",
    market_volatility: 50,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean brass, uniform composition",
        typical_contamination: 0,
        price_multiplier: 1.3,
      },
      {
        tier: 2,
        description: "Mixed brass, minimal contamination",
        typical_contamination: 3,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Brass with steel/other metals",
        typical_contamination: 8,
        price_multiplier: 0.7,
      },
      {
        tier: 4,
        description: "Heavily mixed/contaminated",
        typical_contamination: 15,
        price_multiplier: 0.4,
      },
    ],
  },

  "stainless-steel-scrap": {
    name: "Stainless Steel Scrap",
    material_id: "stainless-steel-scrap",
    category: "metal",
    subtype: "stainless-steel",
    density: 7900,
    typical_forms: ["scrap", "sheet", "pipe", "turnings"],
    market_price: {
      min: 800,
      max: 1500,
      average: 1100,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 100, incineration: 150, recycling: -1100 },
    carbon_footprint: {
      virgin_production: 6000,
      recycling: 1200,
      disposal: 40,
      transport_per_km: 0.16,
    },
    energy_content: 0,
    recyclability_score: 97,
    max_recycling_loops: 100,
    quality_degradation_per_cycle: 0.8,
    processing_difficulty: "medium",
    contamination_tolerance: 5,
    sorting_requirements: ["magnetic testing", "grade sorting"],
    demand_level: "high",
    supply_level: "medium",
    market_volatility: 35,
    quality_tiers: [
      {
        tier: 1,
        description: "Grade 304/316, clean",
        typical_contamination: 0,
        price_multiplier: 1.4,
      },
      {
        tier: 2,
        description: "Mixed grades, clean",
        typical_contamination: 3,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed with carbon steel",
        typical_contamination: 10,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Heavily contaminated",
        typical_contamination: 20,
        price_multiplier: 0.3,
      },
    ],
  },

  // ============================================
  // PLASTICS
  // ============================================

  "pet-plastic": {
    name: "PET Plastic",
    material_id: "pet-plastic",
    category: "plastic",
    subtype: "PET",
    density: 1380,
    typical_forms: ["pellets", "flakes", "bottles", "film"],
    market_price: {
      min: 300,
      max: 600,
      average: 450,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 150, incineration: 200, recycling: -200 },
    carbon_footprint: {
      virgin_production: 3200,
      recycling: 1200,
      disposal: 2000,
      transport_per_km: 0.05,
    },
    energy_content: 23,
    recyclability_score: 80,
    max_recycling_loops: 7,
    quality_degradation_per_cycle: 10,
    processing_difficulty: "medium",
    contamination_tolerance: 2,
    sorting_requirements: ["optical sorting", "washing", "pelletizing"],
    demand_level: "high",
    supply_level: "medium",
    market_volatility: 50,
    quality_tiers: [
      {
        tier: 1,
        description: "Food-grade rPET",
        typical_contamination: 0,
        price_multiplier: 1.5,
      },
      {
        tier: 2,
        description: "Clean post-consumer",
        typical_contamination: 2,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed colors, <5% contamination",
        typical_contamination: 5,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Multi-layer or contaminated",
        typical_contamination: 10,
        price_multiplier: 0.3,
      },
    ],
  },

  "hdpe-plastic": {
    name: "HDPE Plastic",
    material_id: "hdpe-plastic",
    category: "plastic",
    subtype: "HDPE",
    density: 960,
    typical_forms: ["pellets", "flakes", "containers", "film"],
    market_price: {
      min: 250,
      max: 500,
      average: 375,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 150, incineration: 180, recycling: -150 },
    carbon_footprint: {
      virgin_production: 2900,
      recycling: 800,
      disposal: 1800,
      transport_per_km: 0.04,
    },
    energy_content: 43,
    recyclability_score: 85,
    max_recycling_loops: 10,
    quality_degradation_per_cycle: 8,
    processing_difficulty: "easy",
    contamination_tolerance: 5,
    sorting_requirements: ["density separation", "washing"],
    demand_level: "high",
    supply_level: "high",
    market_volatility: 35,
    quality_tiers: [
      {
        tier: 1,
        description: "Virgin-equivalent quality",
        typical_contamination: 0,
        price_multiplier: 1.3,
      },
      {
        tier: 2,
        description: "Clean industrial scrap",
        typical_contamination: 3,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Post-consumer, sorted",
        typical_contamination: 7,
        price_multiplier: 0.7,
      },
      {
        tier: 4,
        description: "Mixed or contaminated",
        typical_contamination: 12,
        price_multiplier: 0.4,
      },
    ],
  },

  "pp-plastic": {
    name: "PP Plastic",
    material_id: "pp-plastic",
    category: "plastic",
    subtype: "PP",
    density: 905,
    typical_forms: ["pellets", "flakes", "containers", "film"],
    market_price: {
      min: 200,
      max: 450,
      average: 325,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 150, incineration: 180, recycling: -120 },
    carbon_footprint: {
      virgin_production: 2800,
      recycling: 750,
      disposal: 1700,
      transport_per_km: 0.04,
    },
    energy_content: 46,
    recyclability_score: 75,
    max_recycling_loops: 8,
    quality_degradation_per_cycle: 12,
    processing_difficulty: "medium",
    contamination_tolerance: 5,
    sorting_requirements: ["density separation", "washing", "pelletizing"],
    demand_level: "high",
    supply_level: "medium",
    market_volatility: 40,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean industrial scrap",
        typical_contamination: 0,
        price_multiplier: 1.3,
      },
      {
        tier: 2,
        description: "Post-consumer, single source",
        typical_contamination: 4,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed PP, sorted",
        typical_contamination: 8,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Heavily contaminated",
        typical_contamination: 15,
        price_multiplier: 0.3,
      },
    ],
  },

  "ldpe-plastic": {
    name: "LDPE Plastic",
    material_id: "ldpe-plastic",
    category: "plastic",
    subtype: "LDPE",
    density: 925,
    typical_forms: ["film", "bags", "pellets"],
    market_price: {
      min: 150,
      max: 350,
      average: 250,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 150, incineration: 180, recycling: -100 },
    carbon_footprint: {
      virgin_production: 2700,
      recycling: 700,
      disposal: 1650,
      transport_per_km: 0.03,
    },
    energy_content: 43,
    recyclability_score: 70,
    max_recycling_loops: 6,
    quality_degradation_per_cycle: 15,
    processing_difficulty: "medium",
    contamination_tolerance: 8,
    sorting_requirements: ["washing", "pelletizing"],
    demand_level: "medium",
    supply_level: "high",
    market_volatility: 45,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean industrial film",
        typical_contamination: 0,
        price_multiplier: 1.2,
      },
      {
        tier: 2,
        description: "Post-consumer, clean",
        typical_contamination: 5,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed film, sorted",
        typical_contamination: 10,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Contaminated film",
        typical_contamination: 20,
        price_multiplier: 0.2,
      },
    ],
  },

  "pvc-plastic": {
    name: "PVC Plastic",
    material_id: "pvc-plastic",
    category: "plastic",
    subtype: "PVC",
    density: 1400,
    typical_forms: ["pipe", "sheet", "pellets", "profile"],
    market_price: {
      min: 200,
      max: 500,
      average: 350,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 180, incineration: 250, recycling: -150 },
    carbon_footprint: {
      virgin_production: 2400,
      recycling: 900,
      disposal: 2200,
      transport_per_km: 0.06,
    },
    energy_content: 18,
    recyclability_score: 60,
    max_recycling_loops: 5,
    quality_degradation_per_cycle: 18,
    processing_difficulty: "hard",
    contamination_tolerance: 3,
    sorting_requirements: ["chlorine detection", "grinding", "compounding"],
    demand_level: "medium",
    supply_level: "medium",
    market_volatility: 30,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean single-source PVC",
        typical_contamination: 0,
        price_multiplier: 1.3,
      },
      {
        tier: 2,
        description: "Industrial scrap, sorted",
        typical_contamination: 2,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed PVC types",
        typical_contamination: 5,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Contaminated or mixed polymers",
        typical_contamination: 10,
        price_multiplier: 0.3,
      },
    ],
  },

  "mixed-plastic": {
    name: "Mixed Plastic",
    material_id: "mixed-plastic",
    category: "plastic",
    subtype: "mixed",
    density: 1100,
    typical_forms: ["bales", "mixed"],
    market_price: {
      min: 50,
      max: 150,
      average: 100,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 150, incineration: 180, recycling: 50 },
    carbon_footprint: {
      virgin_production: 2800,
      recycling: 1500,
      disposal: 1800,
      transport_per_km: 0.04,
    },
    energy_content: 35,
    recyclability_score: 40,
    max_recycling_loops: 2,
    quality_degradation_per_cycle: 30,
    processing_difficulty: "hard",
    contamination_tolerance: 15,
    sorting_requirements: ["optical sorting", "washing", "separation"],
    demand_level: "low",
    supply_level: "high",
    market_volatility: 60,
    quality_tiers: [
      {
        tier: 1,
        description: "Mostly single polymer",
        typical_contamination: 10,
        price_multiplier: 1.2,
      },
      {
        tier: 2,
        description: "Mixed but clean",
        typical_contamination: 20,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Contaminated mix",
        typical_contamination: 30,
        price_multiplier: 0.5,
      },
      {
        tier: 4,
        description: "Heavily contaminated",
        typical_contamination: 50,
        price_multiplier: 0.2,
      },
    ],
  },

  // ============================================
  // PAPER & CARDBOARD
  // ============================================

  cardboard: {
    name: "Cardboard",
    material_id: "cardboard",
    category: "paper",
    subtype: "cardboard",
    density: 700,
    typical_forms: ["bales", "loose", "shredded"],
    market_price: {
      min: 50,
      max: 150,
      average: 90,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 80, incineration: 100, recycling: -40 },
    carbon_footprint: {
      virgin_production: 1200,
      recycling: 400,
      disposal: 300,
      transport_per_km: 0.03,
    },
    energy_content: 16,
    recyclability_score: 75,
    max_recycling_loops: 7,
    quality_degradation_per_cycle: 12,
    processing_difficulty: "easy",
    contamination_tolerance: 8,
    sorting_requirements: ["manual sorting", "baling"],
    demand_level: "high",
    supply_level: "high",
    market_volatility: 40,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean corrugated",
        typical_contamination: 0,
        price_multiplier: 1.2,
      },
      {
        tier: 2,
        description: "Industrial boxes",
        typical_contamination: 5,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed paper/cardboard",
        typical_contamination: 10,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Wet or heavily soiled",
        typical_contamination: 20,
        price_multiplier: 0.2,
      },
    ],
  },

  "office-paper": {
    name: "Office Paper",
    material_id: "office-paper",
    category: "paper",
    subtype: "office-paper",
    density: 650,
    typical_forms: ["bales", "shredded", "loose"],
    market_price: {
      min: 80,
      max: 200,
      average: 140,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 80, incineration: 100, recycling: -60 },
    carbon_footprint: {
      virgin_production: 1100,
      recycling: 350,
      disposal: 280,
      transport_per_km: 0.03,
    },
    energy_content: 16,
    recyclability_score: 85,
    max_recycling_loops: 8,
    quality_degradation_per_cycle: 10,
    processing_difficulty: "easy",
    contamination_tolerance: 5,
    sorting_requirements: ["manual sorting", "baling"],
    demand_level: "high",
    supply_level: "high",
    market_volatility: 30,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean white office paper",
        typical_contamination: 0,
        price_multiplier: 1.3,
      },
      {
        tier: 2,
        description: "Mixed office paper",
        typical_contamination: 3,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Color mixed paper",
        typical_contamination: 8,
        price_multiplier: 0.7,
      },
      {
        tier: 4,
        description: "Contaminated or wet",
        typical_contamination: 15,
        price_multiplier: 0.3,
      },
    ],
  },

  newspaper: {
    name: "Newspaper",
    material_id: "newspaper",
    category: "paper",
    subtype: "newspaper",
    density: 680,
    typical_forms: ["bales", "loose"],
    market_price: {
      min: 30,
      max: 100,
      average: 60,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 80, incineration: 100, recycling: -30 },
    carbon_footprint: {
      virgin_production: 1000,
      recycling: 380,
      disposal: 270,
      transport_per_km: 0.03,
    },
    energy_content: 16,
    recyclability_score: 80,
    max_recycling_loops: 6,
    quality_degradation_per_cycle: 14,
    processing_difficulty: "easy",
    contamination_tolerance: 10,
    sorting_requirements: ["manual sorting", "baling"],
    demand_level: "medium",
    supply_level: "high",
    market_volatility: 35,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean newspaper",
        typical_contamination: 0,
        price_multiplier: 1.2,
      },
      {
        tier: 2,
        description: "Mixed news/magazines",
        typical_contamination: 5,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Wet or stained",
        typical_contamination: 12,
        price_multiplier: 0.5,
      },
      {
        tier: 4,
        description: "Heavily contaminated",
        typical_contamination: 20,
        price_multiplier: 0.2,
      },
    ],
  },

  // ============================================
  // GLASS
  // ============================================

  "glass-mixed": {
    name: "Glass Mixed",
    material_id: "glass-mixed",
    category: "glass",
    subtype: "mixed",
    density: 2500,
    typical_forms: ["cullet", "bottles", "containers"],
    market_price: {
      min: 20,
      max: 80,
      average: 40,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 50, incineration: 0, recycling: -30 },
    carbon_footprint: {
      virgin_production: 800,
      recycling: 250,
      disposal: 10,
      transport_per_km: 0.2,
    },
    energy_content: 0,
    recyclability_score: 100,
    max_recycling_loops: 999,
    quality_degradation_per_cycle: 0,
    processing_difficulty: "medium",
    contamination_tolerance: 3,
    sorting_requirements: ["color sorting", "crushing", "metal removal"],
    demand_level: "medium",
    supply_level: "high",
    market_volatility: 20,
    quality_tiers: [
      {
        tier: 1,
        description: "Single color, clean",
        typical_contamination: 0,
        price_multiplier: 1.4,
      },
      {
        tier: 2,
        description: "Clear or mixed colors",
        typical_contamination: 2,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed with ceramics",
        typical_contamination: 5,
        price_multiplier: 0.5,
      },
      {
        tier: 4,
        description: "Heavily contaminated",
        typical_contamination: 10,
        price_multiplier: 0.2,
      },
    ],
  },

  "glass-clear": {
    name: "Glass Clear",
    material_id: "glass-clear",
    category: "glass",
    subtype: "clear",
    density: 2500,
    typical_forms: ["cullet", "bottles"],
    market_price: {
      min: 40,
      max: 120,
      average: 70,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 50, incineration: 0, recycling: -50 },
    carbon_footprint: {
      virgin_production: 800,
      recycling: 230,
      disposal: 10,
      transport_per_km: 0.2,
    },
    energy_content: 0,
    recyclability_score: 100,
    max_recycling_loops: 999,
    quality_degradation_per_cycle: 0,
    processing_difficulty: "medium",
    contamination_tolerance: 2,
    sorting_requirements: ["optical sorting", "crushing", "metal removal"],
    demand_level: "high",
    supply_level: "medium",
    market_volatility: 25,
    quality_tiers: [
      {
        tier: 1,
        description: "Pure clear glass",
        typical_contamination: 0,
        price_multiplier: 1.5,
      },
      {
        tier: 2,
        description: "Clean clear glass",
        typical_contamination: 1,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Minor color contamination",
        typical_contamination: 3,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Mixed or contaminated",
        typical_contamination: 8,
        price_multiplier: 0.3,
      },
    ],
  },

  // ============================================
  // ORGANIC WASTE
  // ============================================

  "organic-food-waste": {
    name: "Organic Food Waste",
    material_id: "organic-food-waste",
    category: "organic",
    subtype: "food-waste",
    density: 800,
    typical_forms: ["mixed", "separated"],
    market_price: {
      min: 0,
      max: 30,
      average: 10,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 120, incineration: 150, recycling: 20 },
    carbon_footprint: {
      virgin_production: 0,
      recycling: -100,
      disposal: 500,
      transport_per_km: 0.03,
    },
    energy_content: 4,
    recyclability_score: 60,
    max_recycling_loops: 1,
    quality_degradation_per_cycle: 100,
    processing_difficulty: "easy",
    contamination_tolerance: 20,
    sorting_requirements: ["screening", "composting"],
    demand_level: "low",
    supply_level: "high",
    market_volatility: 15,
    quality_tiers: [
      {
        tier: 1,
        description: "Source-separated, clean",
        typical_contamination: 0,
        price_multiplier: 1.5,
      },
      {
        tier: 2,
        description: "Minimal plastic contamination",
        typical_contamination: 5,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed waste stream",
        typical_contamination: 15,
        price_multiplier: 0.5,
      },
      {
        tier: 4,
        description: "Heavily contaminated",
        typical_contamination: 30,
        price_multiplier: 0.1,
      },
    ],
  },

  "wood-waste": {
    name: "Wood Waste",
    material_id: "wood-waste",
    category: "organic",
    subtype: "wood",
    density: 600,
    typical_forms: ["pallets", "chips", "sawdust", "offcuts"],
    market_price: {
      min: 10,
      max: 80,
      average: 40,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 60, incineration: 80, recycling: -20 },
    carbon_footprint: {
      virgin_production: 0,
      recycling: 50,
      disposal: 400,
      transport_per_km: 0.02,
    },
    energy_content: 16,
    recyclability_score: 70,
    max_recycling_loops: 3,
    quality_degradation_per_cycle: 25,
    processing_difficulty: "easy",
    contamination_tolerance: 10,
    sorting_requirements: ["metal removal", "chipping"],
    demand_level: "medium",
    supply_level: "high",
    market_volatility: 25,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean untreated wood",
        typical_contamination: 0,
        price_multiplier: 1.3,
      },
      {
        tier: 2,
        description: "Pallets, minimal nails",
        typical_contamination: 5,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Painted or treated wood",
        typical_contamination: 10,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Contaminated or composite",
        typical_contamination: 20,
        price_multiplier: 0.3,
      },
    ],
  },

  // ============================================
  // TEXTILES
  // ============================================

  "textile-cotton": {
    name: "Textile Cotton",
    material_id: "textile-cotton",
    category: "textile",
    subtype: "cotton",
    density: 400,
    typical_forms: ["garments", "fabric scraps", "rags"],
    market_price: {
      min: 100,
      max: 400,
      average: 250,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 100, incineration: 120, recycling: -100 },
    carbon_footprint: {
      virgin_production: 5000,
      recycling: 1000,
      disposal: 800,
      transport_per_km: 0.01,
    },
    energy_content: 18,
    recyclability_score: 65,
    max_recycling_loops: 4,
    quality_degradation_per_cycle: 20,
    processing_difficulty: "medium",
    contamination_tolerance: 5,
    sorting_requirements: ["manual sorting", "fiber separation"],
    demand_level: "medium",
    supply_level: "medium",
    market_volatility: 40,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean industrial offcuts",
        typical_contamination: 0,
        price_multiplier: 1.4,
      },
      {
        tier: 2,
        description: "Clean post-consumer",
        typical_contamination: 3,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed textiles",
        typical_contamination: 10,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Stained or damaged",
        typical_contamination: 20,
        price_multiplier: 0.3,
      },
    ],
  },

  "textile-polyester": {
    name: "Textile Polyester",
    material_id: "textile-polyester",
    category: "textile",
    subtype: "polyester",
    density: 450,
    typical_forms: ["garments", "fabric scraps"],
    market_price: {
      min: 150,
      max: 500,
      average: 300,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 100, incineration: 120, recycling: -120 },
    carbon_footprint: {
      virgin_production: 6200,
      recycling: 1500,
      disposal: 2000,
      transport_per_km: 0.01,
    },
    energy_content: 25,
    recyclability_score: 75,
    max_recycling_loops: 6,
    quality_degradation_per_cycle: 15,
    processing_difficulty: "medium",
    contamination_tolerance: 5,
    sorting_requirements: ["manual sorting", "chemical recycling"],
    demand_level: "medium",
    supply_level: "medium",
    market_volatility: 45,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean single-source polyester",
        typical_contamination: 0,
        price_multiplier: 1.5,
      },
      {
        tier: 2,
        description: "Post-consumer, clean",
        typical_contamination: 3,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed synthetics",
        typical_contamination: 10,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Blended or contaminated",
        typical_contamination: 20,
        price_multiplier: 0.3,
      },
    ],
  },

  // ============================================
  // RUBBER & ELASTOMERS
  // ============================================

  "rubber-tire": {
    name: "Rubber Tire",
    material_id: "rubber-tire",
    category: "rubber",
    subtype: "tire",
    density: 1200,
    typical_forms: ["whole tires", "shredded", "crumb"],
    market_price: {
      min: 50,
      max: 200,
      average: 120,
      currency: "EUR",
      last_updated: "2024-02-01",
    },
    disposal_cost: { landfill: 180, incineration: 150, recycling: -80 },
    carbon_footprint: {
      virgin_production: 4500,
      recycling: 800,
      disposal: 1200,
      transport_per_km: 0.05,
    },
    energy_content: 32,
    recyclability_score: 55,
    max_recycling_loops: 2,
    quality_degradation_per_cycle: 40,
    processing_difficulty: "hard",
    contamination_tolerance: 10,
    sorting_requirements: ["wire removal", "shredding", "devulcanization"],
    demand_level: "medium",
    supply_level: "high",
    market_volatility: 35,
    quality_tiers: [
      {
        tier: 1,
        description: "Clean truck tires",
        typical_contamination: 0,
        price_multiplier: 1.3,
      },
      {
        tier: 2,
        description: "Passenger tires, minimal contamination",
        typical_contamination: 5,
        price_multiplier: 1.0,
      },
      {
        tier: 3,
        description: "Mixed tires",
        typical_contamination: 15,
        price_multiplier: 0.6,
      },
      {
        tier: 4,
        description: "Contaminated or damaged",
        typical_contamination: 25,
        price_multiplier: 0.3,
      },
    ],
  },
};

/**
 * Get material properties by ID or fuzzy match
 */
export function getMaterialProperties(
  materialType: string,
): MaterialProperties | null {
  if (!materialType) return null;

  const normalized = materialType.toLowerCase().replace(/\s+/g, "-");

  // Exact match
  if (MATERIAL_DATABASE[normalized]) {
    return MATERIAL_DATABASE[normalized];
  }

  // Fuzzy match by subtype
  for (const props of Object.values(MATERIAL_DATABASE)) {
    if (props.subtype.toLowerCase().replace(/\s+/g, "-") === normalized) {
      return props;
    }
  }

  // Fuzzy match by category
  const categoryMatches = Object.values(MATERIAL_DATABASE).filter(
    (p) => p.category.toLowerCase() === normalized,
  );

  if (categoryMatches.length > 0) {
    return categoryMatches[0];
  }

  // SKU catalog fallback (Phase 1: 180 SKUs)
  const skuMatch = resolveSkuMaterial(materialType);
  if (skuMatch) {
    return toMaterialProperties(skuMatch);
  }

  return null;
}

/**
 * Backward-compatible lookup used by legacy material flow calculations.
 */
export function findMaterial(materialType: string): {
  category: string;
  average_cost_per_ton: number | null;
  carbon_factor: number | null;
} | null {
  const material = getMaterialProperties(materialType);
  if (!material) return null;

  return {
    category: material.category,
    average_cost_per_ton: material.market_price?.average ?? null,
    carbon_factor: material.carbon_footprint?.virgin_production
      ? material.carbon_footprint.virgin_production / 1000
      : null,
  };
}

function resolveSkuMaterial(materialType: string): MaterialSKU | null {
  const normalized = materialType.toLowerCase().trim();
  const compact = normalized.replace(/[\s_-]+/g, "");

  const match = ALL_MATERIALS.find((m) => {
    const id = m.id.toLowerCase();
    const sku = (m.sku ?? "").toLowerCase();
    const tradeName = (m.tradeName ?? "").toLowerCase();
    const ewc = (m.ewcCode ?? "").toLowerCase();

    if (id === normalized || sku === normalized || ewc === normalized)
      return true;
    if (id.includes(normalized) || sku.includes(normalized)) return true;
    if (tradeName.includes(normalized)) return true;
    if (id.replace(/[.\s_-]+/g, "") === compact) return true;
    if (sku.replace(/[.\s_-]+/g, "") === compact) return true;

    const altNames = m.alternativeNames || [];
    return altNames.some((name) => name.toLowerCase().includes(normalized));
  });

  return match ?? null;
}

function toMaterialProperties(m: MaterialSKU): MaterialProperties {
  const classMeta = CLASS_METADATA[m.class as keyof typeof CLASS_METADATA];
  const basePrice = m.pricing.basePrice;
  const range = m.pricing.range ?? { min: basePrice, max: basePrice };
  const marketPrice = {
    min: range.min ?? basePrice,
    max: range.max ?? basePrice,
    average: basePrice,
    currency: "EUR" as const,
    last_updated: new Date().toISOString().slice(0, 10),
  };

  const qualityTiers = (m.qualityTiers || []).map((tier) => ({
    tier:
      tier.tier === "Q1"
        ? 1
        : tier.tier === "Q2"
          ? 2
          : tier.tier === "Q3"
            ? 3
            : 4,
    description: Array.isArray(tier.requirements)
      ? tier.requirements.join(", ")
      : String(tier.requirements ?? ""),
    typical_contamination: tier.contaminationMax ?? 0,
    price_multiplier: tier.priceMultiplier ?? 1,
  }));

  const processingDifficulty = (() => {
    const d = (m.processing?.difficulty || "").toLowerCase();
    if (d === "easy" || d === "medium" || d === "hard") return d;
    return "hard";
  })();

  const mapLevel = (v: string | undefined): "high" | "medium" | "low" => {
    const x = (v || "").toLowerCase();
    if (x.includes("very-high") || x === "high") return "high";
    if (x.includes("very-low") || x === "low") return "low";
    return "medium";
  };

  return {
    name: m.tradeName ?? m.id,
    material_id: m.id,
    category: classMeta?.name?.toLowerCase().replace(/\s+/g, "-") || "unknown",
    subtype: m.subclass || m.id,
    density: m.specifications?.bulkDensity?.max ?? 1000,
    typical_forms: Array.isArray(m.specifications?.physicalForm)
      ? m.specifications.physicalForm
      : [String(m.specifications?.physicalForm ?? "mixed")],
    market_price: marketPrice,
    disposal_cost: {
      landfill: m.wasteTier === "T4" ? 250 : 100,
      incineration: m.wasteTier === "T4" ? 200 : 120,
      recycling: m.wasteTier === "T1" ? -basePrice : -basePrice * 0.5,
    },
    carbon_footprint: {
      virgin_production: m.environmental?.carbonAvoided
        ? m.environmental.carbonFootprint + m.environmental.carbonAvoided
        : m.environmental?.carbonFootprint ?? 0,
      recycling: m.environmental?.carbonFootprint ?? 0,
      disposal: Math.max(10, (m.environmental?.carbonFootprint ?? 0) * 0.15),
      transport_per_km: 0.08,
    },
    energy_content: 0,
    recyclability_score: m.environmental?.recyclabilityScore ?? 50,
    max_recycling_loops: m.environmental?.maxRecycleLoops ?? 1,
    quality_degradation_per_cycle: 5,
    processing_difficulty: processingDifficulty,
    contamination_tolerance: Math.max(
      ...((m.qualityTiers || []).map((q) => q.contaminationMax || 0).concat(0)),
    ),
    sorting_requirements: [],
    demand_level: mapLevel(m.marketData?.demand),
    supply_level: mapLevel(m.marketData?.supply),
    market_volatility:
      m.marketData?.volatility === "very-high"
        ? 85
        : m.marketData?.volatility === "high"
          ? 70
          : m.marketData?.volatility === "low"
            ? 30
            : m.marketData?.volatility === "very-low"
              ? 15
              : 50,
    quality_tiers:
      qualityTiers.length > 0
        ? qualityTiers
        : [
            {
              tier: 2,
              description: "Standard quality",
              typical_contamination: 5,
              price_multiplier: 1,
            },
          ],
  };
}

/**
 * Get all materials in a category
 */
export function getMaterialsByCategory(category: string): MaterialProperties[] {
  return Object.values(MATERIAL_DATABASE).filter(
    (m) => m.category.toLowerCase() === category.toLowerCase(),
  );
}

/**
 * Search materials by keyword
 */
export function searchMaterials(keyword: string): MaterialProperties[] {
  const search = keyword.toLowerCase();
  return Object.values(MATERIAL_DATABASE).filter(
    (m) =>
      m.material_id.includes(search) ||
      m.category.includes(search) ||
      m.subtype.toLowerCase().includes(search),
  );
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  return [...new Set(Object.values(MATERIAL_DATABASE).map((m) => m.category))];
}
