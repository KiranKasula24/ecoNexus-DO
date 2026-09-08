export type AgentType =
  | "local" // Nexa (manufacturers)
  | "super" // NexaApex (locality coordinators)
  | "specialist_recycler" // NexaPrime Recycler
  | "specialist_processor" // NexaPrime Processor
  | "specialist_logistics" // NexaPrime Logistics
  | "specialist_energy"; // NexaPrime Energy (future)

export type AgentStatus = "active" | "paused" | "stopped";

export type PostType =
  | "offer"
  | "request"
  | "reply"
  | "announcement"
  | "deal_proposal";

export type Visibility = "local" | "regional" | "public";

export type DealStatus =
  | "negotiating"
  | "pending_seller_approval"
  | "pending_buyer_approval"
  | "approved_both_parties"
  | "active"
  | "completed"
  | "cancelled"
  | "disputed";

// ============================================
// AGENT CONSTRAINTS
// ============================================

export interface AgentConstraints {
  price_ranges: Record<string, { min: number; max: number }>;
  min_volume: number;
  max_volume: number;
  quality_tier_max: number;
  auto_approve_threshold_eur: number;
  payment_terms_preferred: string;
  blacklisted_companies: string[];
  material_categories: string[];
}

export interface SpecialistRecyclerConstraints {
  accepted_material_categories: string[];
  min_volume: number;
  max_volume: number;
  max_contamination_tolerance: number;
  geographic_scope: "local" | "regional" | "national";
  processing_capacity_available: boolean;
  auto_respond_threshold: number;
}

export interface SpecialistProcessorConstraints {
  input_materials: string[];
  output_materials: string[];
  min_volume: number;
  max_volume: number;
  processing_fee_range: { min: number; max: number };
  geographic_scope: "local" | "regional";
  auto_respond_threshold: number;
}

export interface SpecialistLogisticsConstraints {
  service_regions: string[];
  min_load_tons: number;
  max_distance_km: number;
  vehicle_types: string[];
  consolidation_enabled: boolean;
  auto_respond_threshold: number;
}

// ============================================
// CORE INTERFACES
// ============================================

export interface AgentPerformance {
  opportunities_scanned: number;
  negotiations_started: number;
  deals_proposed: number;
  deals_approved: number;
  deals_rejected: number;
  total_value_generated_eur: number;
}

export interface Agent {
  id: string;
  company_id: string | null; // null for NexaApex
  name: string;
  agent_type: AgentType;
  locality: string;
  geographic_range_km: number;
  status: AgentStatus;
  constraints:
    | AgentConstraints
    | SpecialistRecyclerConstraints
    | SpecialistProcessorConstraints
    | SpecialistLogisticsConstraints;
  performance: AgentPerformance;
  created_at: string;
  last_active_at: string;
}

export interface FeedPost {
  id: string;
  agent_id: string;
  post_type: PostType;
  parent_id?: string;
  thread_root_id?: string;
  content:
    | OfferContent
    | RequestContent
    | ReplyContent
    | AnnouncementContent
    | DealProposalContent;
  locality: string;
  visibility: Visibility;
  view_count: number;
  reply_count: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  agent?: Agent;
  replies?: FeedPost[];
}

// ============================================
// CONTENT SCHEMAS
// ============================================

export interface OfferContent {
  passport_id: string;
  material: string;
  material_category: string;
  material_subtype: string;
  quality_tier: number;
  volume: number;
  unit: string;
  price: number;
  processability_score: number;
  recyclable_score: number;
  location: { lat: number; lng: number };
  tags?: string[];
}

export interface RequestContent {
  material_category: string;
  material_subtype?: string;
  volume_needed: number;
  max_price: number;
  quality_tier_max: number;
  location: { lat: number; lng: number };
}

export interface ReplyContent {
  message: string;
  counter_offer?: {
    price?: number;
    volume?: number;
    terms?: string;
  };
  interest_level: "low" | "medium" | "high";
}

export interface AnnouncementContent {
  type: "symbiosis_detected" | "locality_update" | "network_milestone";
  title: string;
  description: string;
  companies_involved?: string[];
  estimated_value?: number;
  carbon_saved?: number;
}

export interface DealProposalContent {
  deal_id: string;
  summary: string;
}

// ============================================
// TRANSACTIONS & SCORING
// ============================================

export interface Deal {
  id: string;
  seller_agent_id: string;
  buyer_agent_id: string;
  seller_company_id: string;
  buyer_company_id: string;
  passport_id: string;
  material_category: string;
  material_subtype: string;
  volume: number;
  unit: string;
  price_per_unit: number;
  total_value: number;
  duration_months?: number;
  payment_terms: string;
  delivery_terms: string;
  quality_tier: number;
  status: DealStatus;
  negotiation_thread_id?: string;
  negotiation_rounds: number;
  agent_recommendation: string;
  agent_reasoning: string;
  seller_approved_at?: string;
  buyer_approved_at?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  seller_agent?: Agent;
  buyer_agent?: Agent;
  passport?: any;
}

export interface OpportunityScore {
  post: FeedPost;
  score: number;
  breakdown: {
    material_match: number;
    price_score: number;
    quality_score: number;
    distance_score: number;
    volume_score: number;
  };
  reasoning: string;
}
