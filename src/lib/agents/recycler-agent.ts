/**
 * NEXAPRIME - RECYCLER AGENT
 * Global sourcing with strategic bidding and dynamic pricing
 */

import { supabase } from "@/lib/database/supabase";
import { getMaterialProperties } from "@/lib/constants/material-database";

export class RecyclerAgent {
  private agentId: string;
  private companyId: string;
  private constraints: any;
  private profile: any;

  constructor(agent: any, profile: any) {
    this.agentId = agent.id;
    this.companyId = agent.company_id;
    this.constraints = agent.constraints || {};
    this.profile = profile;
  }

  async runCycle(): Promise<{ actions: number; errors: string[] }> {
    const actions: string[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Post/update standing buy requests
      const requestsPosted = await this.postStandingBuyRequests();
      actions.push(`Posted/updated ${requestsPosted} buy requests`);

      // Step 2: Scan ALL localities for waste offers
      const opportunities = await this.scanGlobalOffers();
      actions.push(`Scanned ${opportunities.length} global opportunities`);

      // Step 3: Make strategic bids
      const bids = await this.makeStrategicBids(opportunities);
      actions.push(`Made ${bids} bids`);

      // Step 4: Post processed materials for sale
      const offersPosted = await this.postProcessedMaterials();
      actions.push(`Posted ${offersPosted} sale offers`);
    } catch (error: any) {
      errors.push(error.message);
    }

    return { actions: actions.length, errors };
  }

  /**
   * Post standing buy requests for all accepted materials
   */
  private async postStandingBuyRequests(): Promise<number> {
    if (!this.profile.accepted_material_categories) return 0;

    let posted = 0;

    for (const category of this.profile.accepted_material_categories) {
      // Check capacity availability
      const utilizationPercent =
        this.profile.current_utilization_percentage || 0;
      const capacityAvailable = utilizationPercent < 80;

      if (!capacityAvailable) continue; // Skip if capacity full

      // Dynamic pricing based on capacity
      const materialProps = getMaterialProperties(category);
      const basePrice = materialProps?.market_price?.average || 100;

      // If capacity is low, offer higher price to attract supply
      const capacityFactor = 1 + ((100 - utilizationPercent) / 100) * 0.2; // Up to 20% premium
      const offerPrice = basePrice * capacityFactor;

      // Check if standing request exists
      const { data: existingRequest } = await supabase
        .from("agent_feed")
        .select("id")
        .eq("agent_id", this.agentId)
        .eq("post_type", "request")
        .eq("content->material_category", category)
        .eq("is_active", true)
        .single();

      if (existingRequest) {
        // Update existing request with new price
        await supabase
          .from("agent_feed")
          .update({
            content: {
              material_category: category,
              volume_needed: 999999, // Unlimited
              max_price: offerPrice,
              quality_tier_max: 3,
              location: { lat: 0, lng: 0 },
              min_volume: this.profile.min_pickup_volume_tons,
              service_area: this.profile.geographic_service_area,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRequest.id);

        posted++;
      } else {
        // Create new standing request
        const { error } = await supabase.from("agent_feed").insert({
          agent_id: this.agentId,
          post_type: "request",
          content: {
            material_category: category,
            volume_needed: 999999,
            max_price: offerPrice,
            quality_tier_max: 3,
            location: { lat: 0, lng: 0 },
            min_volume: this.profile.min_pickup_volume_tons,
            service_area: this.profile.geographic_service_area,
          },
          locality: "global", // Recyclers see all localities
          visibility: "public",
          expires_at: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 90 days
        });

        if (!error) posted++;
      }
    }

    return posted;
  }

  /**
   * Scan ALL localities for matching waste offers
   */
  private async scanGlobalOffers(): Promise<any[]> {
    const { data: offers } = await supabase
      .from("agent_feed")
      .select("*")
      .eq("post_type", "offer")
      .eq("is_active", true)
      .in(
        "content->material_category",
        this.profile.accepted_material_categories,
      );

    if (!offers) return [];

    // Score each offer strategically
    return offers
      .map((offer: { content: any }) => {
        const content = offer.content;
        let score = 0;

        // Material match (base score)
        score += 30;

        // Volume (prefer larger volumes)
        const volume = content.volume || 0;
        if (volume >= this.profile.min_pickup_volume_tons) score += 20;
        if (volume >= 50) score += 10;

        // Quality (prefer higher quality)
        const qualityTier = content.quality_tier || 4;
        score += (5 - qualityTier) * 10; // Tier 1 = +40, Tier 4 = +10

        // Contamination
        const contamination = content.contamination_level || 0;
        if (contamination <= this.profile.max_contamination_tolerance)
          score += 15;

        // Distance factor (prefer closer, but willing to go far for good deals)
        // TODO: Calculate actual distance from offer.location
        const distance = 100; // Placeholder
        if (distance < 100) score += 15;
        else if (distance < 500) score += 5;

        // Price value (compare to market)
        const materialProps = getMaterialProperties(
          content.material_id ||
            content.sku ||
            content.material_subtype ||
            content.material_category,
        );
        const marketPrice = materialProps?.market_price?.average || 100;
        const askingPrice = content.price || marketPrice;

        if (askingPrice < marketPrice * 0.8)
          score += 20; // Great deal
        else if (askingPrice < marketPrice) score += 10;

        return {
          ...offer,
          score,
          distance,
          askingPrice,
        };
      })
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score);
  }

  /**
   * Make strategic bids on opportunities
   */
  private async makeStrategicBids(opportunities: any[]): Promise<number> {
    let bids = 0;

    for (const opp of opportunities) {
      // Strategic bidding based on distance
      const distance = opp.distance || 0;
      let shouldBid = false;

      if (distance < 100) {
        // Local: Bid aggressively on everything with score > 60
        shouldBid = opp.score > 60;
      } else if (distance < 500) {
        // Regional: Bid selectively on score > 75
        shouldBid = opp.score > 75;
      } else {
        // National: Only bid on exceptional opportunities (score > 85)
        shouldBid = opp.score > 85;
      }

      if (!shouldBid) continue;

      // Check if already bid
      const { data: existingBid } = await supabase
        .from("agent_feed")
        .select("id")
        .eq("agent_id", this.agentId)
        .eq("parent_id", opp.id)
        .single();

      if (existingBid) continue;

      // Calculate competitive bid
      const content = opp.content;
      const materialProps = getMaterialProperties(
        content.material_id ||
          content.sku ||
          content.material_subtype ||
          content.material_category,
      );
      const marketPrice = materialProps?.market_price?.average || 100;

      // Offer above asking price to win bid
      const competitiveBid = (content.price || marketPrice) * 1.1; // 10% above ask

      // But don't exceed our max buy price
      const maxBuyPrice =
        this.profile.buy_prices_per_ton?.[content.material_category] ||
        marketPrice * 1.2;
      const finalBid = Math.min(competitiveBid, maxBuyPrice);

      // Create bid (reply)
      const { error } = await supabase.from("agent_feed").insert({
        agent_id: this.agentId,
        post_type: "reply",
        parent_id: opp.id,
        thread_root_id: opp.thread_root_id || opp.id,
        content: {
          message: `We can process your ${content.material_category}. Competitive offer attached.`,
          counter_offer: {
            price: Math.round(finalBid * 100) / 100,
            volume: content.volume,
            terms: "Pickup included, payment on delivery",
          },
          interest_level: opp.score > 85 ? "high" : "medium",
        },
        locality: opp.locality,
        visibility: opp.visibility,
      });

      if (!error) bids++;
    }

    return bids;
  }

  /**
   * Post processed materials for sale
   */
  private async postProcessedMaterials(): Promise<number> {
    // TODO: Query inventory of processed materials
    // For now, return 0 (will implement with inventory management)
    return 0;
  }
}
