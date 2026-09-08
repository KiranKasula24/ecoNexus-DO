/**
 * NEXAPRIME - LOGISTICS AGENT
 * Pattern matching for consolidation + backhaul optimization
 */

import { supabase } from "@/lib/database/supabase";
export class LogisticsAgent {
  private agentId: string;
  private companyId: string;
  private profile: any;

  constructor(agent: any, profile: any) {
    this.agentId = agent.id;
    this.companyId = agent.company_id;
    this.profile = profile;
  }

  async runCycle(): Promise<{ actions: number; errors: string[] }> {
    const actions: string[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Detect consolidation opportunities (many-to-one, one-to-many)
      const consolidations = await this.detectConsolidationOpportunities();
      actions.push(
        `Detected ${consolidations.length} consolidation opportunities`,
      );

      // Step 2: Post consolidation offers
      const consolidationsPosted =
        await this.postConsolidationOffers(consolidations);
      actions.push(`Posted ${consolidationsPosted} consolidation offers`);

      // Step 3: Search for backhaul opportunities
      const backhauls = await this.findBackhaulOpportunities();
      actions.push(`Found ${backhauls.length} backhaul opportunities`);

      // Step 4: Post backhaul offers
      const backhaulsPosted = await this.postBackhaulOffers(backhauls);
      actions.push(`Posted ${backhaulsPosted} backhaul offers`);
    } catch (error: any) {
      errors.push(error.message);
    }

    return { actions: actions.length, errors };
  }

  /**
   * PATTERN MATCHING: Detect consolidation opportunities
   */
  private async detectConsolidationOpportunities(): Promise<any[]> {
    // Get pending deals that need logistics
    const { data: pendingDeals } = await supabase
      .from("deals")
      .select(
        `
        *,
        seller_company:companies!seller_company_id (location),
        buyer_company:companies!buyer_company_id (location)
      `,
      )
      .in("status", ["approved_both_parties", "pending_logistics"]);

    if (!pendingDeals) return [];

    // Group by similar routes
    const routeGroups: Record<string, any[]> = {};

    for (const deal of pendingDeals) {
      // Create route key (simplified: city pairs)
      const sellerCity =
        (deal.seller_company?.location as any)?.city || "unknown";
      const buyerCity =
        (deal.buyer_company?.location as any)?.city || "unknown";
      const routeKey = `${sellerCity}-${buyerCity}`;

      if (!routeGroups[routeKey]) {
        routeGroups[routeKey] = [];
      }

      routeGroups[routeKey].push(deal);
    }

    // Find routes with 2+ deals (consolidation opportunity)
    const consolidations = Object.entries(routeGroups)
      .filter(([_, deals]) => deals.length >= 2)
      .map(([route, deals]) => ({
        route,
        deals,
        total_volume: deals.reduce((sum, d) => sum + (d.volume || 0), 0),
        total_value: deals.reduce((sum, d) => sum + (d.total_value || 0), 0),
      }));

    return consolidations;
  }

  /**
   * Post consolidation offers
   */
  private async postConsolidationOffers(
    consolidations: any[],
  ): Promise<number> {
    let posted = 0;

    for (const consol of consolidations) {
      const [origin, destination] = consol.route.split("-");

      // Calculate discounted rate
      const baseRate = this.profile.base_rate_per_ton_km || 0.15;
      const discount =
        (this.profile.consolidation_discount_percentage || 15) / 100;
      const consolidatedRate = baseRate * (1 - discount);

      // Estimate distance (placeholder)
      const estimatedDistance = 200; // km

      const totalCost =
        consol.total_volume * consolidatedRate * estimatedDistance;
      const savings =
        consol.total_volume * baseRate * estimatedDistance - totalCost;

      const { error } = await supabase.from("agent_feed").insert({
        agent_id: this.agentId,
        post_type: "announcement",
        content: {
          type: "consolidation_opportunity",
          route: consol.route,
          origin,
          destination,
          total_volume: consol.total_volume,
          num_shipments: consol.deals.length,
          consolidated_rate: consolidatedRate,
          estimated_savings: savings,
          deal_ids: consol.deals.map((d: any) => d.id),
        },
        locality: origin.toLowerCase(),
        visibility: "regional",
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });

      if (!error) posted++;
    }

    return posted;
  }

  /**
   * Find backhaul opportunities
   */
  private async findBackhaulOpportunities(): Promise<any[]> {
    // Get active routes
    const activeRoutes = this.profile.current_routes || [];

    if (activeRoutes.length === 0) return [];

    const backhauls: any[] = [];

    for (const route of activeRoutes) {
      // For return trip, search for requests in opposite direction
      const { data: returnRequests } = await supabase
        .from("agent_feed")
        .select("*")
        .eq("post_type", "request")
        .eq("is_active", true);
      // TODO: Filter by actual route geography

      if (returnRequests && returnRequests.length > 0) {
        backhauls.push({
          outbound_route: route,
          return_requests: returnRequests,
        });
      }
    }

    return backhauls;
  }

  /**
   * Post backhaul offers
   */
  private async postBackhaulOffers(backhauls: any[]): Promise<number> {
    let posted = 0;

    for (const backhaul of backhauls) {
      const baseRate = this.profile.base_rate_per_ton_km || 0.15;
      const backhaulRate = baseRate * 0.5; // 50% discount for backhaul

      const { error } = await supabase.from("agent_feed").insert({
        agent_id: this.agentId,
        post_type: "offer",
        content: {
          type: "backhaul_offer",
          route: "return trip", // TODO: Actual route
          available_capacity: 20, // tons
          rate: backhaulRate,
          departure_window: "next week",
          discount_reason: "backhaul optimization",
        },
        locality: "regional",
        visibility: "public",
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });

      if (!error) posted++;
    }

    return posted;
  }
}
