type PrimaryMaterialInput = {
  name: string;
  category: string;
  subtype: string;
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
  classification:
    | "reusable"
    | "processable"
    | "recyclable"
    | "energy_recovery"
    | "landfill";
  generationFrequency: string;
  storageLocation: string;
  isHazardous: boolean;
  wasteCode: string;
  regulatoryClassification: string;
};

type OpportunityItem = {
  id: string;
  title: string;
  description: string;
  expectedImpact: string;
  feasibility: "high" | "medium" | "low";
};

export type MaterialFlowOpportunities = {
  focus: "ferrous-metals" | "general";
  selfReuseOpportunities: OpportunityItem[];
  alternateInputRoutes: OpportunityItem[];
};

function isFerrousStream(waste: WasteGeneratedInput): boolean {
  const haystack = `${waste.materialCategory} ${waste.materialSubtype} ${waste.materialName}`.toLowerCase();
  return (
    haystack.includes("ferrous") ||
    haystack.includes("steel") ||
    haystack.includes("iron") ||
    haystack.includes("cast iron") ||
    haystack.includes("stainless")
  );
}

function buildFerrousOpportunities(
  waste: WasteGeneratedInput,
): MaterialFlowOpportunities {
  return {
    focus: "ferrous-metals",
    selfReuseOpportunities: [
      {
        id: "ferrous-self-1",
        title: "Closed-Loop Internal Scrap Remelting",
        description:
          "Route clean ferrous offcuts/returns back into internal EAF or remelting batches after sorting and sizing.",
        expectedImpact:
          "Reduces virgin feed demand and disposal dependency for recurring ferrous waste lots.",
        feasibility: "high",
      },
      {
        id: "ferrous-self-2",
        title: "Turnings/Chips Recovery via Briquetting",
        description:
          "Briquette turnings and remove oils/moisture before reinjection to melting operations to improve yield.",
        expectedImpact:
          "Improves material recovery yield and lowers oxidation/loss in melt.",
        feasibility: "high",
      },
      {
        id: "ferrous-self-3",
        title: "Grade-Cascade Reuse for Secondary Components",
        description:
          "Use lower-grade internal ferrous scrap for non-critical parts or downstream lower-spec product lines.",
        expectedImpact:
          "Increases internal utilization of mixed-grade streams.",
        feasibility: "medium",
      },
    ],
    alternateInputRoutes: [
      {
        id: "ferrous-alt-1",
        title: "Scrap-Dominant EAF Route",
        description:
          "Target output can be produced using shredded ferrous scrap as primary input with DRI/HBI top-up for chemistry control.",
        expectedImpact:
          "High circularity route with lower virgin dependency and strong flexibility.",
        feasibility: "high",
      },
      {
        id: "ferrous-alt-2",
        title: "DRI/HBI + Scrap Hybrid Route",
        description:
          "Blend DRI/HBI with available scrap to produce the same steel grade when scrap purity varies.",
        expectedImpact:
          "Enables stable output quality while preserving circular feed share.",
        feasibility: "medium",
      },
      {
        id: "ferrous-alt-3",
        title: "BOF Blend Optimization Route",
        description:
          "For integrated lines, use hot metal + calibrated scrap ratios to reach the same output specs.",
        expectedImpact:
          "Maintains grade consistency with broader input mix options.",
        feasibility: "medium",
      },
    ],
  };
}

function buildGeneralOpportunities(): MaterialFlowOpportunities {
  return {
    focus: "general",
    selfReuseOpportunities: [
      {
        id: "gen-self-1",
        title: "Internal Segregation and Reuse Loop",
        description:
          "Improve source segregation and route the cleanest fraction back into internal operations.",
        expectedImpact:
          "Improves internal reuse share and reduces disposal cost exposure.",
        feasibility: "medium",
      },
      {
        id: "gen-self-2",
        title: "Quality-Based Reprocessing",
        description:
          "Define quality tiers and reprocess higher-tier output for internal replacement of virgin inputs.",
        expectedImpact: "Creates repeatable reuse pathways with controllable quality.",
        feasibility: "medium",
      },
    ],
    alternateInputRoutes: [
      {
        id: "gen-alt-1",
        title: "Multi-Input Blend Strategy",
        description:
          "Use a blended circular + virgin input recipe to maintain output consistency while increasing circular share.",
        expectedImpact:
          "Lowers procurement risk while enabling gradual circular transition.",
        feasibility: "medium",
      },
      {
        id: "gen-alt-2",
        title: "Substitute Feedstock Qualification",
        description:
          "Qualify at least one alternate secondary feedstock route for the same output.",
        expectedImpact:
          "Adds resilience and optionality for output continuity.",
        feasibility: "low",
      },
    ],
  };
}

export function generateMaterialFlowOpportunities(params: {
  primaryMaterials: PrimaryMaterialInput[];
  wasteGenerated: WasteGeneratedInput;
}): MaterialFlowOpportunities {
  const { wasteGenerated } = params;
  if (isFerrousStream(wasteGenerated)) {
    return buildFerrousOpportunities(wasteGenerated);
  }
  return buildGeneralOpportunities();
}

export function generateMaterialFlowOpportunitiesFromTypes(params: {
  materialTypes: string[];
}): MaterialFlowOpportunities {
  const haystack = params.materialTypes.join(" ").toLowerCase();
  const looksFerrous =
    haystack.includes("ferrous") ||
    haystack.includes("steel") ||
    haystack.includes("iron");

  if (looksFerrous) {
    return buildFerrousOpportunities({
      materialName: "Ferrous stream",
      materialCategory: "ferrous",
      materialSubtype: "steel",
      physicalForm: "mixed",
      monthlyVolume: 0,
      unit: "tons",
      qualityGrade: "C",
      contaminationLevel: 0,
      moistureContent: 0,
      carbonFootprint: 0,
      waterUsage: 0,
      energyConsumption: 0,
      currentDisposalCost: 0,
      potentialValue: 0,
      classification: "recyclable",
      generationFrequency: "monthly",
      storageLocation: "",
      isHazardous: false,
      wasteCode: "",
      regulatoryClassification: "",
    });
  }

  return buildGeneralOpportunities();
}
