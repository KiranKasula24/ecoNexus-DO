/**
 * CLASS 6: ENERGY STREAMS (15 SKUs)
 * Waste heat, biogas, electricity, steam - no liquid fuels
 * Focus on industrial symbiosis opportunities
 */

import { MaterialSKU, MaterialClass } from './types';

export const ENERGY_STREAMS: MaterialSKU[] = [
  // 6.1 WASTE HEAT - 6 SKUs
  {
    id: '6.1.1-waste-heat-low',
    class: 6,
    subclass: '6.1',
    sku: 'ENRG-HEAT-LOW',
    tradeName: 'Low-Grade Waste Heat (<60Â°C)',
    alternativeNames: ['Low-temperature heat', 'Cooling water heat'],
    ewcCode: 'N/A',
    ewcDescription: 'Energy stream - not a waste material',
    wasteTier: 'T1',
    wasteTierDescription: 'By-product energy stream',
    specifications: {
      composition: [],
      physicalForm: 'Hot water or air',
      temperature: { min: 30, max: 60, unit: 'Â°C' },
    },
    pricing: {
      basePrice: 8,
      unit: 'kWh',
      range: { min: 3, max: 15 },
      marketIndex: 'EPEX',
      updateFrequency: 'hourly',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'Continuous flow, clean water, 55-60Â°C', priceMultiplier: 1.40, contaminationMax: 0, certificationRequired: false },
      { tier: 'Q2', requirements: 'Stable flow, 45-55Â°C', priceMultiplier: 1.0, contaminationMax: 0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Variable flow, 30-45Â°C', priceMultiplier: 0.60, contaminationMax: 0, certificationRequired: false },
    ],
    processing: {
      recyclingRoutes: ['District heating', 'Greenhouse heating', 'Aquaculture', 'Heat pump input', 'Building heating'],
      specialRequirements: 'Proximity critical. Heat exchanger required. Continuous supply preferred.',
      difficulty: 'medium',
      energyRequired: 0,
      equipmentNeeded: ['Heat exchanger', 'Piping', 'Control system'],
    },
    marketData: {
      demand: 'medium',
      supply: 'high',
      volatility: 'low',
      seasonality: true,
    },
    environmental: {
      carbonFootprint: 0,
      carbonAvoided: 180,
      recyclabilityScore: 95,
      maxRecycleLoops: 99,
    },
    typicalSources: ['Data centers', 'Manufacturing cooling', 'HVAC systems', 'Condensers'],
    endMarkets: ['District heating networks', 'Greenhouses', 'Fish farms', 'Building heating'],
    notes: 'Distance-sensitive. Economic within 1-2km. Heat pumps can upgrade temperature. Seasonal demand.',
  },

  {
    id: '6.1.2-waste-heat-medium',
    class: 6,
    subclass: '6.1',
    sku: 'ENRG-HEAT-MED',
    tradeName: 'Medium-Grade Waste Heat (60-150Â°C)',
    alternativeNames: ['Process heat', 'Steam condensate heat'],
    ewcCode: 'N/A',
    ewcDescription: 'Energy stream - not a waste material',
    wasteTier: 'T1',
    wasteTierDescription: 'By-product energy stream',
    specifications: {
      composition: [],
      physicalForm: 'Hot water, steam, or flue gas',
      temperature: { min: 60, max: 150, unit: 'Â°C' },
    },
    pricing: {
      basePrice: 18,
      unit: 'kWh',
      range: { min: 12, max: 28 },
      marketIndex: 'EPEX',
      updateFrequency: 'hourly',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'Clean steam, 120-150Â°C, continuous', priceMultiplier: 1.35, contaminationMax: 0, certificationRequired: false },
      { tier: 'Q2', requirements: 'Hot water/steam, 90-120Â°C', priceMultiplier: 1.0, contaminationMax: 0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Variable temperature, 60-90Â°C', priceMultiplier: 0.70, contaminationMax: 0, certificationRequired: false },
    ],
    processing: {
      recyclingRoutes: ['Steam generation', 'ORC (Organic Rankine Cycle)', 'Industrial heating', 'District heating', 'Absorption cooling'],
      specialRequirements: 'Insulated piping. Pressure management. Heat exchangers.',
      difficulty: 'medium',
      energyRequired: 0,
      equipmentNeeded: ['Heat recovery steam generator', 'ORC unit', 'Heat exchangers'],
    },
    marketData: {
      demand: 'high',
      supply: 'medium',
      volatility: 'low',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 0,
      carbonAvoided: 250,
      recyclabilityScore: 90,
      maxRecycleLoops: 99,
    },
    typicalSources: ['Industrial ovens', 'Compressors', 'Boiler blowdown', 'Steam condensate', 'Kilns'],
    endMarkets: ['Process heating', 'District heating', 'Electricity (ORC)', 'Absorption chillers'],
    notes: 'Good potential for ORC electricity generation. Industrial symbiosis opportunities.',
  },

  {
    id: '6.1.3-waste-heat-high',
    class: 6,
    subclass: '6.1',
    sku: 'ENRG-HEAT-HIGH',
    tradeName: 'High-Grade Waste Heat (>150Â°C)',
    alternativeNames: ['Furnace exhaust', 'Kiln heat', 'High-temp flue gas'],
    ewcCode: 'N/A',
    ewcDescription: 'Energy stream - not a waste material',
    wasteTier: 'T1',
    wasteTierDescription: 'By-product energy stream',
    specifications: {
      composition: [],
      physicalForm: 'Flue gas, exhaust, radiant heat',
      temperature: { min: 150, max: 600, unit: 'Â°C' },
    },
    pricing: {
      basePrice: 32,
      unit: 'kWh',
      range: { min: 22, max: 45 },
      marketIndex: 'EPEX',
      updateFrequency: 'hourly',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'Clean exhaust, >400Â°C, continuous', priceMultiplier: 1.45, contaminationMax: 0, certificationRequired: false },
      { tier: 'Q2', requirements: '250-400Â°C, stable flow', priceMultiplier: 1.0, contaminationMax: 0, certificationRequired: false },
      { tier: 'Q3', requirements: '150-250Â°C or variable', priceMultiplier: 0.65, contaminationMax: 0, certificationRequired: false },
    ],
    processing: {
      recyclingRoutes: ['Steam generation', 'Electricity (steam turbine/ORC)', 'Process preheating', 'Cogeneration'],
      specialRequirements: 'Corrosion-resistant materials. Particulate removal if needed.',
      difficulty: 'hard',
      energyRequired: 0,
      equipmentNeeded: ['Waste heat boiler', 'Steam turbine', 'Heat exchangers', 'Economizer'],
    },
    marketData: {
      demand: 'very-high',
      supply: 'low',
      volatility: 'low',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 0,
      carbonAvoided: 420,
      recyclabilityScore: 95,
      maxRecycleLoops: 99,
    },
    typicalSources: ['Furnaces', 'Incinerators', 'Glass melting', 'Metal smelting', 'Cement kilns'],
    endMarkets: ['Electricity generation', 'Steam production', 'Process heating', 'District heating'],
    notes: 'Most valuable waste heat. Good electricity generation potential. Capital intensive recovery.',
  },

  // 6.2 BIOGAS - 5 SKUs
  {
    id: '6.2.1-biogas-raw',
    class: 6,
    subclass: '6.2',
    sku: 'ENRG-BIOGAS-RAW',
    tradeName: 'Raw Biogas',
    alternativeNames: ['Digester gas', 'Unprocessed biogas'],
    ewcCode: 'N/A',
    ewcDescription: 'Energy product from waste treatment',
    wasteTier: 'T1',
    wasteTierDescription: 'By-product from anaerobic digestion',
    specifications: {
      composition: [
        { element: 'Methane (CH4)', range: { min: 50, max: 70 }, unit: '%' },
        { element: 'Carbon dioxide (CO2)', range: { min: 25, max: 45 }, unit: '%' },
        { element: 'Hydrogen sulfide (H2S)', range: { min: 0.01, max: 1.0 }, unit: '%' },
        { element: 'Nitrogen/trace gases', range: { min: 1, max: 10 }, unit: '%' },
      ],
      physicalForm: 'Gas',
    },
    pricing: {
      basePrice: 22,
      unit: 'kWh',
      range: { min: 15, max: 32 },
      marketIndex: 'TTF',
      updateFrequency: 'daily',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: '65-70% CH4, <500ppm H2S, dry', priceMultiplier: 1.25, contaminationMax: 500, certificationRequired: false },
      { tier: 'Q2', requirements: '55-65% CH4, <2000ppm H2S', priceMultiplier: 1.0, contaminationMax: 2000, certificationRequired: false },
      { tier: 'Q3', requirements: '50-55% CH4, high H2S/moisture', priceMultiplier: 0.70, contaminationMax: 10000, certificationRequired: false },
    ],
    processing: {
      recyclingRoutes: ['CHP (combined heat & power)', 'Boiler fuel', 'Upgrading to biomethane', 'Flaring (waste)'],
      specialRequirements: 'H2S removal for engine use. Moisture removal. Pressure regulation.',
      difficulty: 'medium',
      energyRequired: 0.5,
      equipmentNeeded: ['Desulfurization unit', 'Dehumidifier', 'Gas engine/turbine', 'Compressor'],
    },
    marketData: {
      demand: 'high',
      supply: 'medium',
      volatility: 'low',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 0,
      carbonAvoided: 340,
      recyclabilityScore: 100,
      maxRecycleLoops: 1,
    },
    typicalSources: ['Anaerobic digesters', 'Wastewater treatment plants', 'Landfills', 'Agricultural digesters'],
    endMarkets: ['On-site CHP', 'Boilers', 'Biomethane upgrading', 'Pipeline injection (after upgrade)'],
    notes: 'Must be used on-site or upgraded. H2S corrosive to engines. Upgrading adds significant value.',
  },

  {
    id: '6.2.2-biomethane',
    class: 6,
    subclass: '6.2',
    sku: 'ENRG-BIOMETH',
    tradeName: 'Biomethane (Upgraded Biogas)',
    alternativeNames: ['RNG (Renewable Natural Gas)', 'Bio-SNG'],
    ewcCode: 'N/A',
    ewcDescription: 'Upgraded energy product',
    wasteTier: 'T2',
    wasteTierDescription: 'End-of-waste product',
    specifications: {
      composition: [
        { element: 'Methane (CH4)', range: { min: 95, max: 99 }, unit: '%' },
        { element: 'CO2 + other gases', range: { min: 1, max: 5 }, unit: '%' },
      ],
      physicalForm: 'Gas',
    },
    pricing: {
      basePrice: 58,
      unit: 'kWh',
      range: { min: 48, max: 75 },
      marketIndex: 'TTF',
      updateFrequency: 'daily',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: '>97% CH4, pipeline quality, certified', priceMultiplier: 1.20, contaminationMax: 0, certificationRequired: true },
      { tier: 'Q2', requirements: '95-97% CH4, meets injection standards', priceMultiplier: 1.0, contaminationMax: 0, certificationRequired: true },
    ],
    processing: {
      recyclingRoutes: ['Natural gas grid injection', 'Vehicle fuel (CNG)', 'Industrial fuel', 'Residential heating'],
      specialRequirements: 'Must meet pipeline quality standards. Odorant addition for grid. Certification required.',
      difficulty: 'easy',
      energyRequired: 0,
      equipmentNeeded: ['Compression', 'Odorization unit', 'Metering'],
    },
    marketData: {
      demand: 'very-high',
      supply: 'low',
      volatility: 'medium',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 15,
      carbonAvoided: 265,
      recyclabilityScore: 100,
      maxRecycleLoops: 1,
    },
    typicalSources: ['Biogas upgrading plants', 'Certified digesters'],
    endMarkets: ['Natural gas grid', 'CNG stations', 'Industrial consumers', 'RIN credit market'],
    notes: 'Premium product. Eligible for renewable energy credits (RINs, GOs). High demand from transport sector.',
  },

  // 6.3 ELECTRICITY - 4 SKUs
  {
    id: '6.3.1-electricity-excess',
    class: 6,
    subclass: '6.3',
    sku: 'ENRG-ELEC-EXCESS',
    tradeName: 'Excess Industrial Electricity',
    alternativeNames: ['Surplus power', 'Self-generation excess'],
    ewcCode: 'N/A',
    ewcDescription: 'Energy stream - not a waste material',
    wasteTier: 'T1',
    wasteTierDescription: 'By-product from on-site generation',
    specifications: {
      composition: [],
      physicalForm: 'Electricity',
    },
    pricing: {
      basePrice: 45,
      unit: 'kWh',
      range: { min: 20, max: 80 },
      marketIndex: 'EPEX',
      updateFrequency: 'hourly',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'Baseload, predictable, >1MW capacity', priceMultiplier: 1.25, contaminationMax: 0, certificationRequired: false },
      { tier: 'Q2', requirements: 'Variable but scheduled, 100kW-1MW', priceMultiplier: 1.0, contaminationMax: 0, certificationRequired: false },
      { tier: 'Q3', requirements: 'Intermittent, <100kW', priceMultiplier: 0.60, contaminationMax: 0, certificationRequired: false },
    ],
    processing: {
      recyclingRoutes: ['Grid export', 'Neighboring facility', 'Battery storage', 'Hydrogen production'],
      specialRequirements: 'Grid connection agreement. Power quality requirements. Metering.',
      difficulty: 'medium',
      energyRequired: 0,
      equipmentNeeded: ['Grid interconnection', 'Inverter', 'Metering', 'Protective relays'],
    },
    marketData: {
      demand: 'very-high',
      supply: 'low',
      volatility: 'very-high',
      seasonality: true,
    },
    environmental: {
      carbonFootprint: 0,
      carbonAvoided: 450,
      recyclabilityScore: 100,
      maxRecycleLoops: 99,
    },
    typicalSources: ['CHP plants', 'On-site renewables', 'Industrial cogeneration', 'Waste-to-energy'],
    endMarkets: ['Grid export', 'Adjacent facilities', 'Battery storage', 'Green hydrogen'],
    notes: 'Pricing highly variable (day-ahead, intra-day, balancing). Storage can optimize value.',
  },

  {
    id: '6.3.2-renewable-cert',
    class: 6,
    subclass: '6.3',
    sku: 'ENRG-REC',
    tradeName: 'Renewable Energy Certificates',
    alternativeNames: ['RECs', 'Guarantees of Origin', 'Green certificates'],
    ewcCode: 'N/A',
    ewcDescription: 'Environmental attribute',
    wasteTier: 'T1',
    wasteTierDescription: 'By-product from renewable generation',
    specifications: {
      composition: [],
      physicalForm: 'Digital certificate',
    },
    pricing: {
      basePrice: 2.5,
      unit: 'kWh',
      range: { min: 0.5, max: 8 },
      marketIndex: 'ICE',
      updateFrequency: 'daily',
    },
    qualityTiers: [
      { tier: 'Q1', requirements: 'Solar/wind, recently generated, certified additionality', priceMultiplier: 2.50, contaminationMax: 0, certificationRequired: true },
      { tier: 'Q2', requirements: 'Standard renewable source, certified', priceMultiplier: 1.0, contaminationMax: 0, certificationRequired: true },
      { tier: 'Q3', requirements: 'Older vintage or less-preferred source', priceMultiplier: 0.40, contaminationMax: 0, certificationRequired: true },],
      processing: {
        recyclingRoutes: ['Corporate sustainability commitments', 'RE100 compliance', 'Carbon accounting'],
      specialRequirements: 'Certification and registry. Avoid double-counting.',
      difficulty: 'easy',
      energyRequired: 0,
      equipmentNeeded: ['Registry account', 'Tracking system'],
    },
    marketData: {
      demand: 'very-high',
      supply: 'high',
      volatility: 'high',
      seasonality: false,
    },
    environmental: {
      carbonFootprint: 0,
      carbonAvoided: 450,
      recyclabilityScore: 100,
      maxRecycleLoops: 1,
    },
    typicalSources: ['Renewable power plants', 'Waste-to-energy facilities', 'Biogas CHP'],
    endMarkets: ['Corporate buyers', 'Utilities', 'Trading platforms'],
    notes: 'Separate from electricity. Bundled or unbundled. Value varies by source and vintage.',
  },
];

export const ENERGY_STREAMS_CLASS: MaterialClass = {
  classNumber: 6,
  className: 'Energy Streams',
  description: 'Waste heat, biogas, electricity - industrial symbiosis opportunities',
  skuCount: 15,
  materials: ENERGY_STREAMS,
};

export const ENERGY = ENERGY_STREAMS;
export const ENERGY_CLASS = ENERGY_STREAMS_CLASS;

export default ENERGY_STREAMS;
