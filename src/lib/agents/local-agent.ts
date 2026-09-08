/**
 * NEXA - LOCAL AGENT (MANUFACTURERS)
 * Enhanced with smart auto-posting, search-first logic, and learning
 */

import { supabase } from "@/lib/database/supabase";
import { OpportunityScanner } from "./opportunity-scanner";
import { getMaterialProperties } from "@/lib/constants/material-database";

export class LocalAgent {
  private agentId: string;
  private companyId: string;
  private locality: string;
  private constraints: any;
  private performance: any;

  constructor(agent: any) {
    this.agentId = agent.id;
    this.companyId = agent.company_id;
    this.locality = agent.locality;
    this.constraints = agent.constraints || {};
    this.performance = agent.performance || {};
  }

  /**
   * Main execution cycle
   */
  async runCycle(): Promise<{ actions: number; errors: string[] }> {
    const actions: string[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Post offers for waste streams (smart auto-posting)
      const offersPosted = await this.postOffersFromWasteStreams();
      actions.push(`Posted ${offersPosted} offers`);

      // Step 2: Post buy requests for material requirements (search-first)
      const requestsPosted = await this.postBuyRequests();
      actions.push(`Posted ${requestsPosted} buy requests`);

      // Step 3: Scan local feed for opportunities
      const opportunities = await this.scanLocalFeed();
      actions.push(`Scanned ${opportunities.length} opportunities`);

      // Step 4: Respond to high-scoring opportunities
      const responses = await this.respondToOpportunities(opportunities);
      actions.push(`Responded to ${responses} opportunities`);

      // Step 5: Update performance metrics
      await this.updatePerformance();
    } catch (error: any) {
      errors.push(error.message);
    }

    return { actions: actions.length, errors };
  }

  /**
   * SMART AUTO-POSTING: Post offers for sellable waste
   */
  private async postOffersFromWasteStreams(): Promise<number> {
    // Get waste streams with passports
    const { data: wasteStreams } = await supabase
      .from("waste_streams")
      .select(
        `
        *,
        material_passports (
          id,
          volume,
          quality_tier,
          carbon_footprint,
          verification_status
        )
      `,
      )
      .eq("company_id", this.companyId)
      .gte("potential_value", 500) // Smart threshold: only valuable waste
      .not("passport_id", "is", null);

    if (!wasteStreams || wasteStreams.length === 0) return 0;

    let posted = 0;

    for (const waste of wasteStreams) {
      const wasteData = waste as any;
      // Check if already posted
      const passportId = Array.isArray(wasteData.material_passports)
        ? wasteData.material_passports[0]?.id
        : wasteData.material_passports?.id;

      const { data: existingPost } = await supabase
        .from("agent_feed")
        .select("id")
        .eq("agent_id", this.agentId)
        // FIX 2: Use .filter for JSONB column querying
        .filter("content->>passport_id", "eq", passportId)
        .eq("is_active", true)
        .single();

      if (existingPost) continue;

      // Calculate asking price from material database
      const materialKey =
        wasteData.material_id ||
        wasteData.material_subtype ||
        wasteData.material_category ||
        wasteData.classification;
      const materialProps = getMaterialProperties(materialKey);
      const basePrice = materialProps?.market_price?.average || 100;
      const qualityMultiplier =
        materialProps?.quality_tiers?.find(
          (t) => t.tier === Number(wasteData.quality_grade),
        )?.price_multiplier || 1;

      const askingPrice = basePrice * qualityMultiplier;

      // Create offer post
      const { error } = await supabase.from("agent_feed").insert({
        agent_id: this.agentId,
        post_type: "offer",
        content: {
          passport_id: passportId,
          material_id: wasteData.material_id || null,
          material: wasteData.classification,
          material_category:
            wasteData.material_category || wasteData.classification,
          material_subtype:
            wasteData.material_subtype ||
            wasteData.classification ||
            "unspecified",
          quality_tier: wasteData.quality_grade,
          volume: wasteData.monthly_volume,
          unit: "tons",
          price: askingPrice,
          processability_score: wasteData.processability_score,
          recyclable_score: wasteData.recyclable_score,
          location: { lat: 0, lng: 0 }, // TODO: Get from company
          tags: [wasteData.classification, `tier-${wasteData.quality_grade}`],
        },
        locality: this.locality,
        visibility: "local",
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 30 days
      });

      if (!error) posted++;
    }

    return posted;
  }

  /**
   * SEARCH-FIRST BUY REQUESTS: Check existing offers before posting request
   */
  private async postBuyRequests(): Promise<number> {
    // Get material requirements not yet on Nexus
    const { data: requirements } = await supabase
      .from("materials")
      .select("*")
      .eq("company_id", this.companyId)
      .eq("category", "input"); // User-defined needs

    if (!requirements || requirements.length === 0) return 0;

    let posted = 0;

    for (const req of requirements) {
      const reqData = req as any;
      // STEP 1: Search existing offers first
      const { data: existingOffers } = await supabase
        .from("agent_feed")
        .select("*")
        .eq("post_type", "offer")
        .eq("locality", this.locality)
        .eq("is_active", true)
        // FIX 2b: Use .contains for broader JSON matching or .filter for exact
        .contains("content", { material_category: reqData.material_category });

      if (existingOffers && existingOffers.length > 0) {
        // Found existing offers - respond directly instead of posting request
        continue;
      }

      // STEP 2: No offers found - post buy request
      const { data: existingRequest } = await supabase
        .from("agent_feed")
        .select("id")
        .eq("agent_id", this.agentId)
        .eq("post_type", "request")
        // FIX 2c: Use .filter for JSONB path
        .filter("content->>material_category", "eq", reqData.material_category)
        .eq("is_active", true)
        .single();

      if (existingRequest) continue; // Already posted

      const materialKey =
        reqData.material_id ||
        reqData.material_subtype ||
        reqData.material_category ||
        reqData.material_type;
      const materialProps = getMaterialProperties(materialKey);
      const maxPrice =
        (reqData.material_category &&
          this.constraints.price_ranges?.[reqData.material_category]?.max) ||
        materialProps?.market_price?.average ||
        150;

      const { error } = await supabase.from("agent_feed").insert({
        agent_id: this.agentId,
        post_type: "request",
        content: {
          material_category: reqData.material_category,
          volume_needed: reqData.monthly_volume,
          max_price: maxPrice,
          quality_tier_max: this.constraints.quality_tier_max || 3,
          location: { lat: 0, lng: 0 },
        },
        locality: this.locality,
        visibility: "local",
        expires_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });

      if (!error) posted++;
    }

    return posted;
  }

  /**
   * Scan local feed for opportunities
   */
  private async scanLocalFeed(): Promise<any[]> {
    const scanner = new OpportunityScanner(this.agentId, this.locality);
    const opportunities = await scanner.scanFeed();

    // Filter by agent constraints
    return opportunities.filter((opp) => {
      // Volume constraints
      if (
        this.constraints.min_volume &&
        opp.volume < this.constraints.min_volume
      )
        return false;
      if (
        this.constraints.max_volume &&
        opp.volume > this.constraints.max_volume
      )
        return false;

      // Quality constraints
      if (
        this.constraints.quality_tier_max &&
        opp.quality_tier != null &&
        opp.quality_tier > this.constraints.quality_tier_max
      )
        return false;

      // Material category constraints
      if (this.constraints.material_categories?.length > 0) {
        if (
          !this.constraints.material_categories.includes(opp.material_category)
        )
          return false;
      }

      return true;
    });
  }

  /**
   * Respond to opportunities with score > 70
   */
  private async respondToOpportunities(opportunities: any[]): Promise<number> {
    let responses = 0;
    const templates = [
      "We can proceed on this material stream. Sharing terms.",
      "Commercially interesting lot. Sending counter terms.",
      "This matches our demand profile. Proposing a counter.",
      "We can absorb this volume. Counter-offer attached.",
    ];

    for (const opp of opportunities) {
      if (opp.score < 70) continue; // Only respond to high-scoring opportunities

      // Check if already responded
      const { data: existingReply } = await supabase
        .from("agent_feed")
        .select("id")
        .eq("agent_id", this.agentId)
        .eq("parent_id", opp.post_id)
        .single();

      if (existingReply) continue;

      // Calculate counter-offer with 5% randomness
      const randomFactor = 0.95 + Math.random() * 0.1; // 0.95 to 1.05
      const counterPrice =
        opp.post_type === "offer"
          ? opp.price * 1.05 * randomFactor // Willing to pay 5% more
          : opp.price * 0.95 * randomFactor; // Asking 5% less

      // Create reply
      const { error } = await supabase.from("agent_feed").insert({
        agent_id: this.agentId,
        post_type: "reply",
        parent_id: opp.post_id,
        thread_root_id: opp.thread_root_id || opp.post_id,
        content: {
          message: templates[Math.floor(Math.random() * templates.length)],
          counter_offer: {
            price: Math.round(counterPrice * 100) / 100,
            volume: opp.volume,
            terms: "30 days payment",
          },
          negotiation_context: {
            round: 1,
            against_post_id: opp.post_id,
            against_price: opp.price,
            against_volume: opp.volume,
            material: opp.material_subtype || opp.material_category,
          },
          interest_level: opp.score > 85 ? "high" : "medium",
        },
        locality: this.locality,
        visibility: "local",
      });

      if (!error) responses++;
    }

    return responses;
  }

  /**
   * Update performance metrics with simple learning
   */
  private async updatePerformance(): Promise<void> {
    const { data: deals } = await supabase
      .from("deals")
      .select("status")
      .or(
        `seller_company_id.eq.${this.companyId},buyer_company_id.eq.${this.companyId}`,
      );

    const proposed =
      deals?.filter((d: { status: string | null }) =>
        d.status?.includes("pending"),
      ).length || 0;
    const approved =
      deals?.filter(
        (d: { status: string | null }) =>
          d.status === "approved_both_parties" || d.status === "active",
      ).length || 0;
    const rejected =
      deals?.filter((d: { status: string | null }) => d.status === "cancelled")
        .length || 0;

    const successRate = proposed > 0 ? (approved / proposed) * 100 : 0;

    // Simple learning: If success rate < 50%, adjust constraints
    if (successRate < 50 && rejected > 3) {
      // Adjust price ranges (be more flexible)
      const updatedConstraints = { ...this.constraints };

      if (updatedConstraints.price_ranges) {
        Object.keys(updatedConstraints.price_ranges).forEach((category) => {
          updatedConstraints.price_ranges[category].min *= 0.9; // Lower min by 10%
          updatedConstraints.price_ranges[category].max *= 1.1; // Raise max by 10%
        });

        await supabase
          .from("agents")
          .update({ constraints: updatedConstraints })
          .eq("id", this.agentId);
      }
    }

    // Update performance
    await supabase
      .from("agents")
      .update({
        performance: {
          // FIX 3: Added null safety for this.performance access
          opportunities_scanned:
            (this.performance?.opportunities_scanned || 0) + 1,
          deals_proposed: proposed,
          deals_approved: approved,
          deals_rejected: rejected,
          success_rate: successRate,
          last_cycle: new Date().toISOString(),
        },
        last_active_at: new Date().toISOString(),
      })
      .eq("id", this.agentId);
  }
}

