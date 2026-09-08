/**
 * CLASS 7: TEXTILES (15 SKUs)
 * Post-industrial and post-consumer textile waste
 * Cotton, polyester, wool, mixed fibers
 */

import { MaterialSKU, MaterialClass } from './types';

export const TEXTILES: MaterialSKU[] = [
  // 7.1 COTTON - 4 SKUs
  {
    id: '7.1.1-cotton-cutting-waste',
    class: 7,
    subclass: '7.1',
    sku: 'TEX-COTTON-CUT',
    tradeName: 'Cotton Cutting Waste',
    alternativeNames: ['Cotton scraps', 'Fabric offcuts', 'Pre-consumer cotton'],
    ewcCode: '04 02 09',
    ewcDescription: 'wastes from composite materials',
    wasteTier: 'T1',
    wasteTierDescription: 'Post-industrial by-product',
    specifications: {
      composition: [
        { element: 'Cotton fiber', range: { min: 95, max: 100 }, unit: '%' },
      ],
      physicalForm: 'Fabric pieces, thread',
      bulkDensity: { min: 150, max: 250, unit: 'kg/mÂ³' },
      moisture: { max: 8.0, unit: '%' },
    },
    pricing: {
      basePrice: 280,
      unit: 't',
      range: { min: 180, max: 420 },
      marketIndex: undefined,
      updateFrequency: 'monthly',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'White/natural, single source, no dye, clean', priceMultiplier: 1.45, contaminationMax: 1.0, certificationRequired: false },
      { tier: 'Q2', requirements: 'Light colors, clean, sorted', priceMultiplier: 1.0, contaminationMax: 3.0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Mixed colors acceptable', priceMultiplier: 0.70, contaminationMax: 8.0, certificationRequired: false },
      { tier: 'Q4', requirements: 'Contaminated, mixed with other fibers', priceMultiplier: 0.45, contaminationMax: 20.0, certificationRequired: false },
    ],
    processing: {
      recyclingRoutes: ['Mechanical recycling to fiber', 'Non-woven products', 'Insulation', 'Yarn spinning', 'Paper production'],
      specialRequirements: 'Remove buttons, zippers. Sort by color for best value.',
      difficulty: 'easy',
      energyRequired: 1.2,
      equipmentNeeded: ['Shredder', 'Opener', 'Carding machine'],
    },
    marketData: {
      demand: 'high',
      supply: 'medium',
      volatility: 'low',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 180,
      carbonAvoided: 6820,
      recyclabilityScore: 85,
      maxRecycleLoops: 3,
    },
    typicalSources: ['Garment manufacturing', 'Textile mills', 'Cut-and-sew operations'],
    endMarkets: ['Recycled yarn', 'Non-woven fabrics', 'Insulation batts', 'Wiping rags'],
    notes: 'High value if white/natural. Virgin cotton has very high environmental footprint (water, pesticides).',
  },

  {
    id: '7.1.2-cotton-post-consumer',
    class: 7,
    subclass: '7.1',
    sku: 'TEX-COTTON-PC',
    tradeName: 'Post-Consumer Cotton Textiles',
    alternativeNames: ['Used clothing', 'Textile waste'],
    ewcCode: '20 01 10',
    ewcDescription: 'clothes',
    wasteTier: 'T2',
    wasteTierDescription: 'Post-consumer waste',
    specifications: {
      composition: [
        { element: 'Cotton fiber', range: { min: 70, max: 100 }, unit: '%' },
      ],
      physicalForm: 'Clothing, home textiles',
      bulkDensity: { min: 120, max: 200, unit: 'kg/mÂ³' },
      moisture: { max: 12.0, unit: '%' },
    },
    pricing: {
      basePrice: 125,
      unit: 't',
      range: { min: 40, max: 280 },
      marketIndex: undefined,
      updateFrequency: 'monthly',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'Reusable quality clothing, clean, sorted', priceMultiplier: 1.80, contaminationMax: 5.0, certificationRequired: false },
      { tier: 'Q2', requirements: 'Wearable items, sorted by type', priceMultiplier: 1.0, contaminationMax: 15.0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Mixed textiles, some damage acceptable', priceMultiplier: 0.50, contaminationMax: 30.0, certificationRequired: false },
      { tier: 'Q4', requirements: 'Unsorted, wet, damaged', priceMultiplier: 0.20, contaminationMax: 50.0, certificationRequired: false },],
      processing: {
        recyclingRoutes: ['Reuse (second-hand)', 'Mechanical recycling', 'Insulation', 'Wiping rags', 'Downcycling'],
      specialRequirements: 'Sorting labor-intensive. Remove non-textile components.',
      difficulty: 'medium',
      energyRequired: 0.8,
      equipmentNeeded: ['Sorting line', 'Baler', 'Shredder (for recycling)'],
    },
    marketData: {
      demand: 'medium',
      supply: 'very-high',
      volatility: 'medium',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 250,
      carbonAvoided: 6750,
      recyclabilityScore: 70,
      maxRecycleLoops: 2,
    },
    typicalSources: ['Clothing donations', 'Curbside textile collection', 'Thrift stores'],
    endMarkets: ['Second-hand clothing markets', 'Recycled fiber', 'Insulation', 'Industrial wipes'],
    notes: 'Reuse highest value. Only 15-20% wearable quality. Rest for recycling or downcycling.',
  },

  // 7.2 POLYESTER - 4 SKUs
  {
    id: '7.2.1-polyester-fabric-scrap',
    class: 7,
    subclass: '7.2',
    sku: 'TEX-PET-SCRAP',
    tradeName: 'Polyester Fabric Scrap',
    alternativeNames: ['PET textile waste', 'Polyester offcuts'],
    ewcCode: '04 02 09',
    ewcDescription: 'wastes from composite materials',
    wasteTier: 'T1',
    wasteTierDescription: 'Post-industrial by-product',
    specifications: {
      composition: [
        { element: 'Polyester (PET)', range: { min: 95, max: 100 }, unit: '%' },
      ],
      physicalForm: 'Fabric pieces, thread',
      bulkDensity: { min: 200, max: 300, unit: 'kg/mÂ³' },
      moisture: { max: 3.0, unit: '%' },
    },
    pricing: {
      basePrice: 320,
      unit: 't',
      range: { min: 220, max: 480 },
      marketIndex: 'ICIS',
      updateFrequency: 'monthly',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'White/light color, 100% PET, no coatings', priceMultiplier: 1.40, contaminationMax: 2.0, certificationRequired: false },
      { tier: 'Q2', requirements: 'Single color, clean polyester', priceMultiplier: 1.0, contaminationMax: 5.0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Mixed colors, PET only', priceMultiplier: 0.75, contaminationMax: 10.0, certificationRequired: false },
      { tier: 'Q4', requirements: 'Contaminated or blended with other fibers', priceMultiplier: 0.50, contaminationMax: 25.0, certificationRequired: false },],
      processing: {
        recyclingRoutes: ['Mechanical recycling to fiber', 'Chemical recycling (depolymerization)', 'Pelletizing for plastics', 'Non-woven products'],
      specialRequirements: 'Remove elastane/spandex if blended. Washing may be required.',
      difficulty: 'medium',
      energyRequired: 2.2,
      equipmentNeeded: ['Shredder', 'Wash line', 'Extrusion', 'Spinning (for fiber)'],
    },
    marketData: {
      demand: 'high',
      supply: 'medium',
      volatility: 'medium',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 280,
      carbonAvoided: 5720,
      recyclabilityScore: 85,
      maxRecycleLoops: 5,
    },
    typicalSources: ['Sportswear manufacturing', 'Outdoor gear production', 'Textile mills'],
    endMarkets: ['Recycled polyester fiber', 'Non-woven fabrics', 'Fiberfill', 'Engineering plastics'],
    notes: 'Growing demand from brands with recycled content goals. Chemical recycling premium.',
  },

  {
    id: '7.2.2-polyester-bottles-textile',
    class: 7,
    subclass: '7.2',
    sku: 'TEX-PET-BTF',
    tradeName: 'Bottle-to-Fiber PET Feedstock',
    alternativeNames: ['PET bottles for textile'],
    ewcCode: '15 01 02',
    ewcDescription: 'plastic packaging',
    wasteTier: 'T2',
    wasteTierDescription: 'Post-consumer bottles for fiber',
    specifications: {
      composition: [
        { element: 'PET', range: { min: 98, max: 100 }, unit: '%' },
      ],
      physicalForm: 'Baled bottles or flake',
      bulkDensity: { min: 450, max: 600, unit: 'kg/mÂ³' },
      moisture: { max: 0.8, unit: '%' },
    },
    pricing: {
      basePrice: 520,
      unit: 't',
      range: { min: 420, max: 680 },
      marketIndex: 'ICIS',
      updateFrequency: 'weekly',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'Clear bottles, food-grade wash, low IV acceptable', priceMultiplier: 1.20, contaminationMax: 1.0, certificationRequired: false },
      { tier: 'Q2', requirements: 'Mixed clear/light blue, clean', priceMultiplier: 1.0, contaminationMax: 3.0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Mixed colors, clean', priceMultiplier: 0.75, contaminationMax: 6.0, certificationRequired: false },
    ],
    processing: {
      recyclingRoutes: ['Fiber extrusion', 'Staple fiber', 'Filament yarn', 'Felting'],
      specialRequirements: 'Textile-grade IV not as critical as food-grade. Color more flexible.',
      difficulty: 'medium',
      energyRequired: 2.5,
      equipmentNeeded: ['Wash line', 'Extrusion', 'Spinning equipment'],
    },
    marketData: {
      demand: 'very-high',
      supply: 'medium',
      volatility: 'high',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 320,
      carbonAvoided: 5680,
      recyclabilityScore: 90,
      maxRecycleLoops: 6,
    },
    typicalSources: ['PET bottle collection', 'Post-consumer recycling'],
    endMarkets: ['Polyester apparel', 'Home textiles', 'Carpet fiber', 'Fiberfill'],
    notes: 'Major outlet for PET bottles. Lower quality requirements than food-grade. Growing market.',
  },

  // 7.3 WOOL & NATURAL FIBERS - 3 SKUs
  {
    id: '7.3.1-wool-scrap',
    class: 7,
    subclass: '7.3',
    sku: 'TEX-WOOL',
    tradeName: 'Wool Scrap',
    alternativeNames: ['Wool offcuts', 'Shoddy wool'],
    ewcCode: '04 02 09',
    ewcDescription: 'wastes from composite materials',
    wasteTier: 'T1',
    wasteTierDescription: 'Post-industrial wool waste',
    specifications: {
      composition: [
        { element: 'Wool fiber', range: { min: 90, max: 100 }, unit: '%' },
      ],
      physicalForm: 'Fabric pieces, yarn',
      bulkDensity: { min: 180, max: 280, unit: 'kg/mÂ³' },
      moisture: { max: 12.0, unit: '%' },
    },
    pricing: {
      basePrice: 420,
      unit: 't',
      range: { min: 280, max: 650 },
      marketIndex: undefined,
      updateFrequency: 'monthly',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'Virgin wool, natural color, clean', priceMultiplier: 1.50, contaminationMax: 2.0, certificationRequired: false },
      { tier: 'Q2', requirements: 'Clean wool, sorted by color', priceMultiplier: 1.0, contaminationMax: 5.0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Mixed colors, some synthetic blend acceptable', priceMultiplier: 0.65, contaminationMax: 15.0, certificationRequired: false },],
      processing: {
        recyclingRoutes: ['Mechanical recycling (shoddy)', 'Insulation', 'Felting', 'Yarn spinning', 'Composting'],
      specialRequirements: 'Remove synthetic fibers if possible. Washing required for felting.',
      difficulty: 'medium',
      energyRequired: 1.5,
      equipmentNeeded: ['Garnetting machine', 'Carding', 'Felting equipment'],
    },
    marketData: {
      demand: 'medium',
      supply: 'low',
      volatility: 'low',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 220,
      carbonAvoided: 12780,
      recyclabilityScore: 80,
      maxRecycleLoops: 3,
    },
    typicalSources: ['Tailoring', 'Carpet manufacturing', 'Woolen mills'],
    endMarkets: ['Recycled wool products', 'Insulation', 'Felting', 'Mulch/compost'],
    notes: 'High virgin footprint makes recycling attractive. Natural/light colors preferred. Biodegradable.',
  },

  // 7.4 MIXED TEXTILES - 4 SKUs
  {
    id: '7.4.1-textile-mixed-sorted',
    class: 7,
    subclass: '7.4',
    sku: 'TEX-MIX-SORT',
    tradeName: 'Sorted Mixed Textiles',
    alternativeNames: ['Textile waste sorted', 'Graded textiles'],
    ewcCode: '20 01 10',
    ewcDescription: 'clothes',
    wasteTier: 'T2',
    wasteTierDescription: 'Sorted post-consumer waste',
    specifications: {
      composition: [
        { element: 'Mixed fibers (cotton/poly/blend)', range: { min: 85, max: 100 }, unit: '%' },
      ],
      physicalForm: 'Sorted clothing, baled',
      bulkDensity: { min: 200, max: 350, unit: 'kg/mÂ³' },
      moisture: { max: 10.0, unit: '%' },
    },
    pricing: {
      basePrice: 95,
      unit: 't',
      range: { min: 30, max: 220 },
      marketIndex: undefined,
      updateFrequency: 'monthly',
    },
    qualityTiers: [
      { tier: 'Q2', requirements: 'Sorted by fiber type, clean, reusable items separated', priceMultiplier: 1.40, contaminationMax: 10.0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Basic sorting, mixed fiber types', priceMultiplier: 1.0, contaminationMax: 20.0, certificationRequired: false },
      { tier: 'Q4', requirements: 'Minimal sorting, high contamination', priceMultiplier: 0.50, contaminationMax: 40.0, certificationRequired: false },],
      processing: {
        recyclingRoutes: ['Fiber separation (automated)', 'Mechanical recycling', 'Thermal recycling', 'Insulation', 'Wiping cloths'],
      specialRequirements: 'Sorting adds significant value. Automated fiber separation emerging.',
      difficulty: 'hard',
      energyRequired: 1.8,
      equipmentNeeded: ['NIR sorter (fiber type)', 'Shredder', 'Separator'],
    },
    marketData: {
      demand: 'medium',
      supply: 'very-high',
      volatility: 'medium',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 280,
      carbonAvoided: 4720,
      recyclabilityScore: 60,
      maxRecycleLoops: 2,
    },
    typicalSources: ['Textile collection programs', 'Donation centers', 'Retail take-back'],
    endMarkets: ['Fiber recycling', 'Insulation products', 'Industrial wipes', 'Export for reuse'],
    notes: 'Blended fibers difficult to recycle. Sorting is key to value. Automation emerging.',
  },

  {
    id: '7.4.2-textile-unsorted',
    class: 7,
    subclass: '7.4',
    sku: 'TEX-MIX-UNSORT',
    tradeName: 'Unsorted Mixed Textiles',
    alternativeNames: ['Textile waste unsorted', 'Raw textile bales'],
    ewcCode: '20 01 10',
    ewcDescription: 'clothes',
    wasteTier: 'T3',
    wasteTierDescription: 'Unsorted post-consumer waste',
    specifications: {
      composition: [
        { element: 'Mixed textiles and non-textiles', range: { min: 70, max: 100 }, unit: '%' },
      ],
      physicalForm: 'Baled mixed textiles',
      bulkDensity: { min: 150, max: 300, unit: 'kg/mÂ³' },
      moisture: { max: 15.0, unit: '%' },
    },
    pricing: {
      basePrice: 35,
      unit: 't',
      range: { min: -10, max: 95 },
      marketIndex: undefined,
      updateFrequency: 'monthly',
    },
    qualityTiers: [
      { tier: 'Q3', requirements: 'Dry, mostly textiles, no hazardous materials', priceMultiplier: 1.30, contaminationMax: 25.0, certificationRequired: false },
      { tier: 'Q4', requirements: 'Mixed quality, requires extensive sorting', priceMultiplier: 1.0, contaminationMax: 50.0, certificationRequired: false },
    ],
    processing: {
      recyclingRoutes: ['Manual sorting', 'Automated sorting', 'Downcycling', 'Energy recovery', 'Landfill (last resort)'],
      specialRequirements: 'Labor-intensive sorting required. Contamination penalty high.',
      difficulty: 'very-hard',
      energyRequired: 0.5,
      equipmentNeeded: ['Sorting line', 'Baler', 'Optical sorter'],
    },
    marketData: {
      demand: 'low',
      supply: 'very-high',
      volatility: 'high',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 350,
      carbonAvoided: 3650,
      recyclabilityScore: 40,
      maxRecycleLoops: 1,
    },
    typicalSources: ['Municipal textile collection (unsorted)', 'Mixed waste sorting residue'],
    endMarkets: ['Sorting facilities', 'Downcycling', 'Waste-to-energy', 'Landfill'],
    notes: 'Low value without sorting. Infrastructure challenge. Increasingly regulated in EU (EPR coming).',
  },
];

export const TEXTILES_CLASS: MaterialClass = {
  classNumber: 7,
  className: 'Textiles',
  description: 'Post-industrial and post-consumer textile waste - cotton, polyester, wool, mixed',
  skuCount: 15,
  materials: TEXTILES,
};

export default TEXTILES;
