/**
 * INDUSTRY BENCHMARKS DATABASE
 * Contains typical performance metrics by industry
 */

export interface IndustryBenchmark {
  industry: string;
  display_name: string;

  // Circularity Metrics
  typical_mci_score: {
    low: number;
    median: number;
    high: number;
  };

  typical_waste_percentage: number;

  // Financial Metrics
  typical_material_cost_percentage: number;
  typical_waste_cost_percentage: number;

  // Environmental Metrics
  carbon_per_revenue: {
    low: number;
    median: number;
    high: number;
  };

  energy_per_revenue: {
    low: number;
    median: number;
    high: number;
  };

  // Common Materials
  common_inputs: string[];
  common_outputs: string[];
  common_waste: string[];

  // Best Practices
  circular_economy_potential: "high" | "medium" | "low";
  typical_interventions: string[];
}

export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmark> = {
  "metal-fabrication": {
    industry: "metal-fabrication",
    display_name: "Metal Fabrication",

    typical_mci_score: { low: 30, median: 45, high: 65 },
    typical_waste_percentage: 15,
    typical_material_cost_percentage: 40,
    typical_waste_cost_percentage: 3,

    carbon_per_revenue: { low: 200, median: 400, high: 800 },
    energy_per_revenue: { low: 300, median: 600, high: 1200 },

    common_inputs: ["steel", "aluminum", "copper", "stainless-steel"],
    common_outputs: ["metal parts", "components", "assemblies"],
    common_waste: [
      "steel-scrap",
      "aluminum-scrap",
      "copper-scrap",
      "cutting oil",
    ],

    circular_economy_potential: "high",
    typical_interventions: [
      "Sell scrap metal instead of disposal",
      "Source recycled metal feedstock",
      "Optimize cutting patterns to reduce waste",
      "Implement closed-loop cooling systems",
    ],
  },

  "plastic-manufacturing": {
    industry: "plastic-manufacturing",
    display_name: "Plastic Manufacturing",

    typical_mci_score: { low: 20, median: 35, high: 55 },
    typical_waste_percentage: 20,
    typical_material_cost_percentage: 35,
    typical_waste_cost_percentage: 4,

    carbon_per_revenue: { low: 300, median: 600, high: 1000 },
    energy_per_revenue: { low: 400, median: 800, high: 1500 },

    common_inputs: ["PET", "HDPE", "PP", "LDPE", "PVC"],
    common_outputs: ["plastic products", "packaging", "components"],
    common_waste: [
      "pet-plastic",
      "hdpe-plastic",
      "pp-plastic",
      "mixed-plastic",
    ],

    circular_economy_potential: "high",
    typical_interventions: [
      "Use recycled plastic feedstock",
      "Sell production scrap",
      "Implement in-process recycling",
      "Design for recyclability",
    ],
  },

  "food-processing": {
    industry: "food-processing",
    display_name: "Food Processing",

    typical_mci_score: { low: 10, median: 25, high: 40 },
    typical_waste_percentage: 30,
    typical_material_cost_percentage: 50,
    typical_waste_cost_percentage: 5,

    carbon_per_revenue: { low: 400, median: 700, high: 1200 },
    energy_per_revenue: { low: 500, median: 900, high: 1600 },

    common_inputs: ["raw food materials", "packaging"],
    common_outputs: ["processed food", "packaged products"],
    common_waste: ["organic-food-waste", "cardboard", "plastic-film"],

    circular_economy_potential: "medium",
    typical_interventions: [
      "Anaerobic digestion of organic waste",
      "Animal feed from by-products",
      "Composting programs",
      "Packaging material recycling",
    ],
  },

  automotive: {
    industry: "automotive",
    display_name: "Automotive Manufacturing",

    typical_mci_score: { low: 25, median: 40, high: 60 },
    typical_waste_percentage: 12,
    typical_material_cost_percentage: 45,
    typical_waste_cost_percentage: 2.5,

    carbon_per_revenue: { low: 250, median: 500, high: 900 },
    energy_per_revenue: { low: 350, median: 700, high: 1300 },

    common_inputs: ["steel", "aluminum", "plastic", "rubber", "glass"],
    common_outputs: ["vehicles", "components"],
    common_waste: [
      "steel-scrap",
      "aluminum-scrap",
      "plastic-scrap",
      "rubber-tire",
    ],

    circular_economy_potential: "high",
    typical_interventions: [
      "Remanufacturing programs",
      "Closed-loop metal recycling",
      "Plastic recycling partnerships",
      "Battery recycling systems",
    ],
  },

  electronics: {
    industry: "electronics",
    display_name: "Electronics Manufacturing",

    typical_mci_score: { low: 15, median: 30, high: 50 },
    typical_waste_percentage: 18,
    typical_material_cost_percentage: 55,
    typical_waste_cost_percentage: 3,

    carbon_per_revenue: { low: 350, median: 650, high: 1100 },
    energy_per_revenue: { low: 450, median: 850, high: 1500 },

    common_inputs: [
      "copper",
      "aluminum",
      "plastic",
      "precious metals",
      "rare earths",
    ],
    common_outputs: ["electronic devices", "circuit boards", "components"],
    common_waste: ["copper-scrap", "plastic-scrap", "e-waste"],

    circular_economy_potential: "high",
    typical_interventions: [
      "E-waste recovery programs",
      "Precious metal extraction",
      "Component reuse",
      "Design for disassembly",
    ],
  },

  "textile-apparel": {
    industry: "textile-apparel",
    display_name: "Textile & Apparel",

    typical_mci_score: { low: 10, median: 20, high: 35 },
    typical_waste_percentage: 25,
    typical_material_cost_percentage: 40,
    typical_waste_cost_percentage: 4,

    carbon_per_revenue: { low: 500, median: 900, high: 1500 },
    energy_per_revenue: { low: 600, median: 1000, high: 1800 },

    common_inputs: ["cotton", "polyester", "nylon", "dyes"],
    common_outputs: ["garments", "fabrics", "textiles"],
    common_waste: ["textile-cotton", "textile-polyester", "fabric scraps"],

    circular_economy_potential: "medium",
    typical_interventions: [
      "Fabric scrap recycling",
      "Take-back programs",
      "Upcycling initiatives",
      "Fiber-to-fiber recycling",
    ],
  },

  construction: {
    industry: "construction",
    display_name: "Construction",

    typical_mci_score: { low: 20, median: 35, high: 55 },
    typical_waste_percentage: 15,
    typical_material_cost_percentage: 30,
    typical_waste_cost_percentage: 3.5,

    carbon_per_revenue: { low: 300, median: 550, high: 950 },
    energy_per_revenue: { low: 250, median: 500, high: 900 },

    common_inputs: ["concrete", "steel", "wood", "plastic", "glass"],
    common_outputs: ["buildings", "infrastructure"],
    common_waste: ["wood-waste", "steel-scrap", "concrete", "mixed-waste"],

    circular_economy_potential: "high",
    typical_interventions: [
      "Demolition material recovery",
      "Concrete recycling",
      "Wood waste recycling",
      "Design for deconstruction",
    ],
  },

  packaging: {
    industry: "packaging",
    display_name: "Packaging Manufacturing",

    typical_mci_score: { low: 25, median: 40, high: 60 },
    typical_waste_percentage: 12,
    typical_material_cost_percentage: 45,
    typical_waste_cost_percentage: 3,

    carbon_per_revenue: { low: 350, median: 600, high: 1000 },
    energy_per_revenue: { low: 400, median: 750, high: 1300 },

    common_inputs: ["cardboard", "plastic", "glass", "aluminum"],
    common_outputs: ["packaging materials", "containers"],
    common_waste: ["cardboard", "plastic-film", "aluminum-scrap"],

    circular_economy_potential: "high",
    typical_interventions: [
      "Post-consumer recycled content",
      "Packaging take-back systems",
      "Lightweighting programs",
      "Biodegradable alternatives",
    ],
  },

  furniture: {
    industry: "furniture",
    display_name: "Furniture Manufacturing",

    typical_mci_score: { low: 20, median: 35, high: 50 },
    typical_waste_percentage: 18,
    typical_material_cost_percentage: 35,
    typical_waste_cost_percentage: 3,

    carbon_per_revenue: { low: 300, median: 550, high: 900 },
    energy_per_revenue: { low: 350, median: 650, high: 1100 },

    common_inputs: ["wood", "steel", "plastic", "fabric"],
    common_outputs: ["furniture", "fixtures"],
    common_waste: ["wood-waste", "textile-scraps", "foam", "metal-scrap"],

    circular_economy_potential: "medium",
    typical_interventions: [
      "Wood waste recycling",
      "Furniture take-back programs",
      "Refurbishment services",
      "Design for disassembly",
    ],
  },

  chemical: {
    industry: "chemical",
    display_name: "Chemical Manufacturing",

    typical_mci_score: { low: 15, median: 30, high: 45 },
    typical_waste_percentage: 20,
    typical_material_cost_percentage: 50,
    typical_waste_cost_percentage: 5,

    carbon_per_revenue: { low: 600, median: 1000, high: 1800 },
    energy_per_revenue: { low: 700, median: 1200, high: 2000 },

    common_inputs: ["petrochemicals", "minerals", "water"],
    common_outputs: ["chemicals", "compounds", "materials"],
    common_waste: ["solvents", "process waste", "contaminated water"],

    circular_economy_potential: "medium",
    typical_interventions: [
      "Solvent recovery systems",
      "Process optimization",
      "Waste-to-energy",
      "Closed-loop water systems",
    ],
  },
};

/**
 * Get industry benchmark by key
 */
export function getIndustryBenchmark(
  industry: string,
): IndustryBenchmark | null {
  const normalized = industry.toLowerCase().replace(/\s+/g, "-");
  return INDUSTRY_BENCHMARKS[normalized] || null;
}

/**
 * Get all industries
 */
export function getAllIndustries(): string[] {
  return Object.keys(INDUSTRY_BENCHMARKS);
}

/**
 * Compare company performance to industry
 */
// Add this function at the end of the file

export function compareToIndustry(
  industry: string,
  companyMetrics: {
    mci_score: number;
    waste_percentage: number;
    carbon_per_revenue: number;
  }
): {
  mci_percentile: number;
  carbon_percentile: number;
  waste_percentile: number;
} {
  const benchmark = Object.values(INDUSTRY_BENCHMARKS).find(b => 
    b.industry.toLowerCase() === industry.toLowerCase()
  );

  if (!benchmark) {
    // Default percentiles if industry not found
    return {
      mci_percentile: 50,
      carbon_percentile: 50,
      waste_percentile: 50
    };
  }

  // Calculate MCI percentile
  const mci_range = benchmark.typical_mci_score.high - benchmark.typical_mci_score.low;
  const mci_position = (companyMetrics.mci_score - benchmark.typical_mci_score.low) / mci_range;
  const mci_percentile = Math.max(0, Math.min(100, Math.round(mci_position * 100)));

  // Calculate carbon percentile (lower is better, so invert)
  const carbon_range = benchmark.carbon_per_revenue.high - benchmark.carbon_per_revenue.low;
  const carbon_position = (benchmark.carbon_per_revenue.high - companyMetrics.carbon_per_revenue) / carbon_range;
  const carbon_percentile = Math.max(0, Math.min(100, Math.round(carbon_position * 100)));

  // Calculate waste percentile (lower is better, so invert)
  const waste_position = (benchmark.typical_waste_percentage - companyMetrics.waste_percentage) / benchmark.typical_waste_percentage;
  const waste_percentile = Math.max(0, Math.min(100, Math.round((waste_position + 1) * 50)));

  return {
    mci_percentile,
    carbon_percentile,
    waste_percentile
  };
}