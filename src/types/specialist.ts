/**
 * SPECIALIST ENTITY TYPES
 * Recyclers, Processors, Logistics
 */

import { FeedPost } from "./agent";

// ============================================
// RECYCLER TYPES
// ============================================

export interface RecyclerProfile {
  id: string;
  company_id: string;

  // Processing Capabilities
  accepted_material_categories: string[];
  processing_capacity_tons_month: number;
  processing_methods: string[];

  // Quality & Standards
  output_quality_tiers: number[];
  certifications: string[];

  // Operational Details
  min_pickup_volume_tons: number;
  max_contamination_tolerance: number;
  geographic_service_area: "local" | "regional" | "national";

  // Pricing
  base_processing_fee_per_ton: Record<string, number>;
  buy_prices_per_ton: Record<string, number>;

  // Metadata
  is_setup_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecyclerDashboardData {
  profile: RecyclerProfile;
  current_inventory: {
    material_type: string;
    volume: number;
    quality_tier: number;
    available_for_sale: boolean;
  }[];
  processing_capacity: {
    total: number;
    used: number;
    available: number;
  };
  active_buy_requests: number;
  active_sell_offers: number;
  pending_deals: number;
}

// ============================================
// PROCESSOR TYPES
// ============================================

export interface ProcessorProfile {
  id: string;
  company_id: string;

  // Processing Capabilities
  input_materials: string[];
  output_materials: string[];
  processing_services: string[];

  // Capacity
  processing_capacity_tons_month: number;
  current_utilization_percentage: number;

  // Quality & Standards
  input_quality_requirements: Record<string, any>;
  output_quality_guarantee: Record<string, any>;
  certifications: string[];

  // Pricing
  processing_fee_per_ton: Record<string, number>;
  value_share_model: "fee_based" | "output_split" | "hybrid";

  // Geographic
  geographic_service_area: "local" | "regional" | "national";

  // Metadata
  is_setup_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcessorDashboardData {
  profile: ProcessorProfile;
  current_jobs: {
    input_material: string;
    output_material: string;
    volume: number;
    status: "pending" | "processing" | "completed";
    expected_completion: string;
  }[];
  capacity_utilization: {
    total: number;
    in_use: number;
    available: number;
    upcoming_capacity: number;
  };
  service_requests: number;
  active_transformations: number;
}

// ============================================
// LOGISTICS TYPES
// ============================================

export interface LogisticsProfile {
  id: string;
  company_id: string;

  // Fleet Details
  fleet_capacity: Record<string, any>;
  vehicle_types: string[];

  // Service Area
  service_regions: string[];
  max_distance_km: number;

  // Specialization
  material_specializations: string[];
  special_requirements: string[];

  // Capacity & Availability
  available_capacity_tons_week: number;
  current_routes: any[];

  // Pricing
  base_rate_per_ton_km: number;
  minimum_load_tons: number;
  consolidation_discount_percentage: number;

  // Optimization Preferences
  optimization_priority: "cost" | "speed" | "carbon" | "balanced";
  accepts_backhaul: boolean;

  // Metadata
  is_setup_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface LogisticsDashboardData {
  profile: LogisticsProfile;
  active_routes: {
    route_id: string;
    origin: string;
    destination: string;
    material: string;
    volume: number;
    status: "scheduled" | "in_transit" | "completed";
    departure: string;
    arrival: string;
  }[];
  consolidation_opportunities: {
    similar_routes: number;
    potential_savings: number;
    carbon_reduction: number;
  };
  available_capacity: {
    this_week: number;
    next_week: number;
    region_demand: Record<string, number>;
  };
  route_optimization_score: number;
}

// ============================================
// CONSOLIDATED NEXUS FEED TYPES
// ============================================

export interface NexusFeedPost extends FeedPost {
  // Extend base FeedPost with specialist-specific content
  specialistContent?: {
    // For processors
    processing_service?: {
      input_required: string;
      output_promised: string;
      processing_fee: number;
      turnaround_days: number;
    };

    // For logistics
    route_offer?: {
      origin: string;
      destination: string;
      available_capacity: number;
      rate_per_ton: number;
      departure_window: string;
      consolidation_available: boolean;
    };

    // For recyclers
    buy_request?: {
      material_categories: string[];
      min_volume: number;
      max_price: number;
      pickup_available: boolean;
      payment_terms: string;
    };
  };
}
