/**
 * CLASS 10: COMPOSITES (10 SKUs)
 * FRP/GRP, carbon fiber, sandwich panels, multi-material assemblies
 * Focus on difficult-to-recycle materials with emerging solutions
 */

import { MaterialSKU, MaterialClass } from './types';

export const COMPOSITES: MaterialSKU[] = [
  // 10.1 FIBER-REINFORCED POLYMERS - 5 SKUs
  {
    id: '10.1.1-carbon-fiber',
    class: 10,
    subclass: '10.1',
    sku: 'COMP-CF',
    tradeName: 'Carbon Fiber Reinforced Polymer (CFRP)',
    alternativeNames: ['Carbon fiber composite', 'CFRP scrap'],
    ewcCode: '12 01 05',
    ewcDescription: 'plastics shavings and turnings',
    wasteTier: 'T1',
    wasteTierDescription: 'Post-industrial by-product',
    specifications: {
      composition: [
        { element: 'Carbon fiber', range: { min: 50, max: 70 }, unit: '%' },
        { element: 'Epoxy resin', range: { min: 30, max: 50 }, unit: '%' },
      ],
      physicalForm: 'Offcuts, trim, parts',
      bulkDensity: { min: 500, max: 700, unit: 'kg/mÂ³' },
      moisture: { max: 1.0, unit: '%' },
    },
    pricing: {
      basePrice: 1200,
      unit: 't',
      range: { min: 600, max: 2200 },
      marketIndex: undefined,
      updateFrequency: 'monthly',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'Pre-preg offcuts, virgin fiber quality, clean', priceMultiplier: 1.75, contaminationMax: 2.0, certificationRequired: false },
      { tier: 'Q2', requirements: 'Clean CFRP manufacturing scrap', priceMultiplier: 1.0, contaminationMax: 8.0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Post-consumer CFRP, mixed quality', priceMultiplier: 0.50, contaminationMax: 20.0, certificationRequired: false },
      { tier: 'Q4', requirements: 'Contaminated, thermoset cured, difficult matrix', priceMultiplier: 0.25, contaminationMax: 40.0, certificationRequired: false },
    ],
    processing: {
      recyclingRoutes: ['Pyrolysis (fiber recovery)', 'Mechanical grinding (filler)', 'Solvolysis', 'Incineration with energy recovery'],
      specialRequirements: 'Thermoset matrix difficult to recycle. Pyrolysis degrades fiber properties. Contamination sensitive.',
      difficulty: 'very-hard',
      energyRequired: 4.5,
      equipmentNeeded: ['Pyrolysis reactor', 'Grinder', 'Solvolysis equipment'],
    },
    marketData: {
      demand: 'medium',
      supply: 'low',
      volatility: 'medium',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 1200,
      carbonAvoided: 27800,
      recyclabilityScore: 45,
      maxRecycleLoops: 1,
    },
    typicalSources: ['Aerospace manufacturing', 'Automotive (high-end)', 'Sporting goods', 'Wind turbine blades'],
    endMarkets: ['Recycled carbon fiber (rCF) producers', 'Filler applications', 'SMC/BMC compounds'],
    notes: 'Virgin CF extremely energy-intensive. Recycling economics improving. Fiber properties degrade (30-50%). Pre-preg scrap premium.',
  },

  {
    id: '10.1.2-glass-fiber-frp',
    class: 10,
    subclass: '10.1',
    sku: 'COMP-GRP',
    tradeName: 'Glass Fiber Reinforced Polymer (GRP/FRP)',
    alternativeNames: ['Fiberglass composite', 'GRP scrap', 'FRP waste'],
    ewcCode: '17 02 03',
    ewcDescription: 'plastic',
    wasteTier: 'T2',
    wasteTierDescription: 'Post-industrial/post-consumer composite',
    specifications: {
      composition: [
        { element: 'Glass fiber', range: { min: 20, max: 50 }, unit: '%' },
        { element: 'Polyester/epoxy resin', range: { min: 50, max: 80 }, unit: '%' },
      ],
      physicalForm: 'Sheets, parts, trim',
      bulkDensity: { min: 600, max: 900, unit: 'kg/mÂ³' },
      moisture: { max: 2.0, unit: '%' },
    },
    pricing: {
      basePrice: 45,
      unit: 't',
      range: { min: -20, max: 120 },
      marketIndex: undefined,
      updateFrequency: 'monthly',
    },
    qualityTiers: [
      { tier: 'Q2', requirements: 'Clean manufacturing scrap, known resin type, large pieces', priceMultiplier: 1.60, contaminationMax: 5.0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Standard GRP scrap, sorted', priceMultiplier: 1.0, contaminationMax: 15.0, certificationRequired: false },
      { tier: 'Q4', requirements: 'Mixed composite waste, contaminated, cured resin', priceMultiplier: 0.30, contaminationMax: 40.0, certificationRequired: false },],
      processing: {
        recyclingRoutes: ['Mechanical grinding (filler)', 'Cement kiln fuel/raw material', 'Pyrolysis', 'Landfill'],
      specialRequirements: 'Thermoset resin = no remelting. Grinding produces dust (health hazard). Limited high-value routes.',
      difficulty: 'hard',
      energyRequired: 2.2,
      equipmentNeeded: ['Industrial grinder', 'Dust collection', 'Pyrolysis (advanced)'],
    },
    marketData: {
      demand: 'low',
      supply: 'high',
      volatility: 'low',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 380,
      carbonAvoided: 1620,
      recyclabilityScore: 35,
      maxRecycleLoops: 1,
    },
    typicalSources: ['Boat building', 'Wind turbine blades', 'Bathroom fixtures', 'Automotive parts'],
    endMarkets: ['Cement kilns', 'Filler for concrete/asphalt', 'Low-grade SMC', 'Landfill'],
    notes: 'Difficult-to-recycle material. Mostly downcycled or landfilled. Wind blade waste growing concern. Cement co-processing emerging.',
  },

  {
    id: '10.1.3-wind-turbine-blades',
    class: 10,
    subclass: '10.1',
    sku: 'COMP-WIND',
    tradeName: 'Wind Turbine Blade Composite',
    alternativeNames: ['Wind blade waste', 'Decommissioned blades'],
    ewcCode: '17 02 03',
    ewcDescription: 'plastic',
    wasteTier: 'T3',
    wasteTierDescription: 'Large-volume composite waste',
    specifications: {
      composition: [
        { element: 'Glass fiber', range: { min: 30, max: 50 }, unit: '%' },
        { element: 'Epoxy/polyester resin', range: { min: 35, max: 50 }, unit: '%' },
        { element: 'Core material (balsa, PVC foam)', range: { min: 10, max: 20 }, unit: '%' },
        { element: 'Coatings/gel coat', range: { min: 2, max: 8 }, unit: '%' },
      ],
      physicalForm: 'Large blade sections',
      bulkDensity: { min: 400, max: 700, unit: 'kg/mÂ³' },
      moisture: { max: 5.0, unit: '%' },
    },
    pricing: {
      basePrice: -35,
      unit: 't',
      range: { min: -80, max: 15 },
      marketIndex: undefined,
      updateFrequency: 'monthly',
    },
    qualityTiers: [
      { tier: 'Q3', requirements: 'Sectioned blades, transportable, no contamination', priceMultiplier: 1.40, contaminationMax: 10.0, certificationRequired: false },
      { tier: 'Q4', requirements: 'Whole or large sections, difficult transport', priceMultiplier: 1.0, contaminationMax: 25.0, certificationRequired: false },],
      processing: {
        recyclingRoutes: ['Cement kiln co-processing', 'Shredding to filler', 'Pyrolysis (pilot)', 'Landfill'],
      specialRequirements: 'Size reduction essential (blades 40-80m long). Transport challenge. Specialized cutting equipment.',
      difficulty: 'very-hard',
      energyRequired: 3.5,
      equipmentNeeded: ['Industrial saw', 'Mobile shredder', 'Heavy transport'],
    },
    marketData: {
      demand: 'very-low',
      supply: 'high',
      volatility: 'low',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 450,
      carbonAvoided: 1350,
      recyclabilityScore: 25,
      maxRecycleLoops: 1,
    },
    typicalSources: ['Wind farm decommissioning', 'Blade damage replacement', 'Manufacturing defects'],
    endMarkets: ['Cement kilns', 'Landfill (if permitted)', 'Pilot recycling projects'],
    notes: 'Major emerging waste stream (early turbines reaching end-of-life). Size = major logistics issue. Landfill bans spreading (EU).',
  },

  // 10.2 SANDWICH STRUCTURES - 3 SKUs
  {
    id: '10.2.1-aluminum-composite-panel',
    class: 10,
    subclass: '10.2',
    sku: 'COMP-ACP',
    tradeName: 'Aluminum Composite Panel (ACP)',
    alternativeNames: ['Alucobond', 'Aluminum sandwich panel', 'ACM'],
    ewcCode: '17 02 03',
    ewcDescription: 'plastic',
    wasteTier: 'T2',
    wasteTierDescription: 'Construction composite waste',
    specifications: {
      composition: [
        { element: 'Aluminum skins', range: { min: 40, max: 60 }, unit: '%' },
        { element: 'PE core', range: { min: 40, max: 60 }, unit: '%' },
      ],
      physicalForm: 'Panels',
      bulkDensity: { min: 300, max: 500, unit: 'kg/mÂ³' },
      moisture: { max: 2.0, unit: '%' },
    },
    pricing: {
      basePrice: 280,
      unit: 't',
      range: { min: 150, max: 450 },
      marketIndex: 'LME',
      updateFrequency: 'weekly',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'Clean panels, no paint/coatings, large pieces', priceMultiplier: 1.45, contaminationMax: 5.0, certificationRequired: false },
      { tier: 'Q2', requirements: 'Standard ACP, minimal contamination', priceMultiplier: 1.0, contaminationMax: 12.0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Weathered, coated, mixed sizes', priceMultiplier: 0.60, contaminationMax: 25.0, certificationRequired: false },],
      processing: {
        recyclingRoutes: ['Delamination and material separation', 'Shredding', 'Aluminum recovery', 'PE recovery'],
      specialRequirements: 'Separation of Al skins from PE core. Paint/coating removal. Fire safety concern (PE core).',
      difficulty: 'medium',
      energyRequired: 1.8,
      equipmentNeeded: ['Delamination equipment', 'Shredder', 'Separation line'],
    },
    marketData: {
      demand: 'medium',
      supply: 'medium',
      volatility: 'medium',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 420,
      carbonAvoided: 3580,
      recyclabilityScore: 70,
      maxRecycleLoops: 2,
    },
    typicalSources: ['Building faÃ§ade demolition', 'Signage replacement', 'Architecture renovation'],
    endMarkets: ['Aluminum smelters', 'PE recyclers', 'Composite material producers'],
    notes: 'Fire safety regulations tightening (Grenfell Tower). PE core flammable. Aluminum recovery main value. Separation technology exists.',
  },

  // 10.3 MULTI-MATERIAL ASSEMBLIES - 2 SKUs
  {
    id: '10.3.1-tetra-pak',
    class: 10,
    subclass: '10.3',
    sku: 'COMP-TETRAPAK',
    tradeName: 'Beverage Cartons (Tetra Pak)',
    alternativeNames: ['Aseptic cartons', 'Multi-layer packaging'],
    ewcCode: '15 01 05',
    ewcDescription: 'composite packaging',
    wasteTier: 'T2',
    wasteTierDescription: 'Post-consumer multi-material packaging',
    specifications: {
      composition: [
        { element: 'Paperboard', range: { min: 70, max: 75 }, unit: '%' },
        { element: 'Polyethylene', range: { min: 20, max: 25 }, unit: '%' },
        { element: 'Aluminum foil', range: { min: 4, max: 6 }, unit: '%' },
      ],
      physicalForm: 'Flattened cartons, baled',
      bulkDensity: { min: 250, max: 400, unit: 'kg/mÂ³' },
      moisture: { max: 10.0, unit: '%' },
    },
    pricing: {
      basePrice: 55,
      unit: 't',
      range: { min: 15, max: 105 },
      marketIndex: undefined,
      updateFrequency: 'monthly',
    },
    qualityTiers: [
      { tier: 'Q2', requirements: 'Clean cartons, source-separated, dry', priceMultiplier: 1.50, contaminationMax: 8.0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Standard collection quality', priceMultiplier: 1.0, contaminationMax: 18.0, certificationRequired: false },
      { tier: 'Q4', requirements: 'Contaminated, wet, mixed with other packaging', priceMultiplier: 0.50, contaminationMax: 35.0, certificationRequired: false },],
      processing: {
        recyclingRoutes: ['Hydrapulping (fiber recovery)', 'PolyAl recovery', 'Incineration'],
      specialRequirements: 'Separation of layers requires hydrapulping. PolyAl residue (25%) difficult to recycle.',
      difficulty: 'hard',
      energyRequired: 2.5,
      equipmentNeeded: ['Hydrapulper', 'Fiber recovery line', 'PolyAl processing'],
    },
    marketData: {
      demand: 'medium',
      supply: 'high',
      volatility: 'low',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 320,
      carbonAvoided: 1180,
      recyclabilityScore: 60,
      maxRecycleLoops: 1,
    },
    typicalSources: ['Household recycling', 'School milk programs', 'Retail food service'],
    endMarkets: ['Paper mills', 'PolyAl pellet producers', 'Building materials (PolyAl boards)'],
    notes: 'Only ~35% collection rate. Fiber recovery efficient. PolyAl (25%) residue finding applications (roofing, furniture).',
  },

  {
    id: '10.3.2-automobile-shredder-residue',
    class: 10,
    subclass: '10.3',
    sku: 'COMP-ASR',
    tradeName: 'Automobile Shredder Residue (ASR)',
    alternativeNames: ['Auto fluff', 'Shredder waste', 'Car fluff'],
    ewcCode: '19 10 04',
    ewcDescription: 'fluff-light fraction and dust other than those mentioned in 19 10 03',
    wasteTier: 'T4',
    wasteTierDescription: 'Complex mixed waste',
    specifications: {
      composition: [
        { element: 'Plastics (mixed)', range: { min: 25, max: 40 }, unit: '%' },
        { element: 'Textiles/fibers', range: { min: 15, max: 25 }, unit: '%' },
        { element: 'Rubber', range: { min: 10, max: 20 }, unit: '%' },
        { element: 'Glass', range: { min: 5, max: 15 }, unit: '%' },
        { element: 'Residual metals', range: { min: 5, max: 15 }, unit: '%' },
        { element: 'Dirt/other', range: { min: 10, max: 25 }, unit: '%' },
      ],
      physicalForm: 'Mixed shredded material',
      bulkDensity: { min: 200, max: 400, unit: 'kg/mÂ³' },
      moisture: { max: 15.0, unit: '%' },
    },
    pricing: {
      basePrice: -65,
      unit: 't',
      range: { min: -120, max: -20 },
      marketIndex: undefined,
      updateFrequency: 'monthly',
    },
    qualityTiers: [
      { tier: 'Q3', requirements: 'Dry ASR, pre-sorted to remove metals', priceMultiplier: 1.30, contaminationMax: 20.0, certificationRequired: false },
      { tier: 'Q4', requirements: 'Standard ASR from shredder', priceMultiplier: 1.0, contaminationMax: 40.0, certificationRequired: false },],
      processing: {
        recyclingRoutes: ['Energy recovery (incineration)', 'Cement kiln', 'Advanced separation (plastics/metals)', 'Landfill'],
      specialRequirements: 'Complex mixed waste. Advanced sorting can recover value. Heavy metals concern. Regulated waste.',
      difficulty: 'very-hard',
      energyRequired: 0.5,
      equipmentNeeded: ['Advanced sorting (XRT, sensor-based)', 'Waste-to-energy facility'],
    },
    marketData: {
      demand: 'very-low',
      supply: 'very-high',
      volatility: 'low',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 580,
      carbonAvoided: 420,
      recyclabilityScore: 30,
      maxRecycleLoops: 1,
    },
    typicalSources: ['Auto shredders', 'ELV (End-of-Life Vehicle) processing'],
    endMarkets: ['Waste-to-energy', 'Cement kilns', 'Landfill', 'Advanced recycling (pilot)'],
    notes: 'Major disposal challenge. 20-25% of vehicle mass becomes ASR. EU targets: 95% vehicle recyclability. Innovations in advanced sorting emerging.',
  },
];

export const COMPOSITES_CLASS: MaterialClass = {
  classNumber: 10,
  className: 'Composites',
  description: 'FRP/GRP, carbon fiber, wind blades, multi-material assemblies - difficult-to-recycle',
  skuCount: 10,
  materials: COMPOSITES,
};

export default COMPOSITES;
