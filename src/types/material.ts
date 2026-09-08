// ============================================
// MATERIAL FLOW TYPES
// ============================================

export type MaterialCategory = "input" | "output" | "waste" | "byproduct";
export type WasteClassification =
  | "reusable"
  | "processable"
  | "recyclable"
  | "energy_recovery"
  | "landfill";
export type QualityGrade = "A" | "B" | "C" | "D";
export type InvoiceStatus = "uploaded" | "processing" | "completed" | "failed";

export interface Location {
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: Location;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  company_id: string;
  material_type: string;
  category: MaterialCategory;
  monthly_volume: number;
  unit: string;
  cost_per_unit?: number;
  carbon_footprint?: number;
  date_recorded: string;
  created_at: string;
}

export interface WasteStream {
  id: string;
  company_id: string;
  material_id: string;
  classification: WasteClassification;
  monthly_volume: number;
  current_disposal_cost: number;
  contamination_level?: number;
  quality_grade?: QualityGrade;
  potential_value?: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  company_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  status: InvoiceStatus;
  extracted_text?: string;
  parsed_data?: ParsedInvoiceData;
  materials_identified?: IdentifiedMaterial[];
  confidence_score?: number;
  processing_errors?: any;
  processed_at?: string;
  created_at: string;
}

export interface ParsedInvoiceData {
  invoice_number?: string;
  date?: string;
  supplier?: string;
  customer?: string;
  total_amount?: number;
  currency?: string;
  line_items: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  total_price?: number;
  material_type?: string;
  confidence: number; // 0-1
}

export interface IdentifiedMaterial {
  material_type: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  cost?: number;
  confidence: number; // 0-1
  source: string; // e.g., "Invoice #12345"
}

export interface CompanyKPI {
  id: string;
  company_id: string;
  period: string; // date

  // Circularity
  mci_score: number;
  waste_to_value_ratio: number;
  landfill_diversion_percentage: number;

  // Volumes
  total_input_volume: number;
  total_output_volume: number;
  total_waste_volume: number;

  // Economics
  total_waste_cost: number;
  potential_circular_revenue: number;
  net_circular_value: number;

  // Environment
  carbon_emissions: number;
  carbon_saved_potential: number;
  emission_intensity: number;

  // Benchmark
  industry_percentile: number;

  created_at: string;
}

// ============================================
// MATERIAL FLOW ANALYSIS TYPES
// ============================================

export interface MaterialFlowData {
  inputs: Material[];
  outputs: Material[];
  waste: WasteStream[];

  // Calculated totals
  total_input: number;
  total_output: number;
  total_waste: number;
  efficiency_rate: number; // output/input percentage
}

export interface MaterialFlowNode {
  id: string;
  label: string;
  value: number;
  type: "input" | "process" | "output" | "waste";
  color: string;
}

export interface MaterialFlowEdge {
  source: string;
  target: string;
  value: number;
  label?: string;
}

export interface MaterialFlowDiagram {
  nodes: MaterialFlowNode[];
  edges: MaterialFlowEdge[];
}

// ============================================
// WASTE CLASSIFICATION TYPES
// ============================================

export interface WasteClassificationResult {
  classification: WasteClassification;
  confidence: number;
  reasoning: string;
  potential_value: number;
  recommended_action: string;
}
