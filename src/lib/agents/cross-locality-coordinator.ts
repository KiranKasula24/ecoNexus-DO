/**
 * CROSS-LOCALITY COORDINATOR
 * Enables NexaApex agents to coordinate across localities
 * Gap #5: Cross-Locality Coordination
 */

import { supabase } from "@/lib/database/supabase";

export interface LocalitySurplus {
  locality: string;
  super_agent_id: string;
  material_category: string;
  surplus_volume: number; // tons/month
  average_price: number;
  quality_tier_avg: number;
  supplier_count: number;
}

export interface LocalityDeficit {
  locality: string;
  super_agent_id: string;
  material_category: string;
  deficit_volume: number; // tons/month
  max_price: number;
  quality_tier_max: number;
  buyer_count: number;
}

export interface CrossLocalityDeal {
  id: string;
  source_locality: string;
  source_super_agent_id: string;
  destination_locality: string;
  destination_super_agent_id: string;
  material_category: string;
  volume: number;
  price_per_unit: number;
  transport_cost_per_unit: number;
  total_value: number;
  participating_companies: {
    sellers: string[];
    buyers: string[];
  };
  status: "proposed" | "negotiating" | "agreed" | "active" | "completed";
  coordination_fee_percentage: number;
}

export class CrossLocalityCoordinator {
  /**
   * Analyze surplus/deficit across all localities
   */
  static async analyzeCrossLocalityOpportunities(): Promise<{
    surpluses: LocalitySurplus[];
    deficits: LocalityDeficit[];
    matches: Array<{ surplus: LocalitySurplus; deficit: LocalityDeficit }>;
  }> {
    console.log(" Analyzing cross-locality opportunities...");

    // Get all super agents
    const { data: superAgents } = await supabase
      .from("agents")
      .select("id, locality")
      .eq("agent_type", "super")
      .eq("status", "active");

    if (!superAgents || superAgents.length < 2) {
      console.log(" Need at least 2 active super agents for cross-locality");
      return { surpluses: [], deficits: [], matches: [] };
    }

    const surpluses: LocalitySurplus[] = [];
    const deficits: LocalityDeficit[] = [];

    // Analyze each locality
    for (const superAgent of superAgents) {
      const localitySurplus = await this.detectSurplus(
        superAgent.locality,
        superAgent.id,
      );
      const localityDeficit = await this.detectDeficit(
        superAgent.locality,
        superAgent.id,
      );

      surpluses.push(...localitySurplus);
      deficits.push(...localityDeficit);
    }

    // Match surpluses with deficits
    const matches = this.matchSurplusDeficit(surpluses, deficits);

    console.log(
      ` Found ${surpluses.length} surpluses, ${deficits.length} deficits, ${matches.length} matches`,
    );

    return { surpluses, deficits, matches };
  }

  /**
   * Detect material surplus in a locality
   */
  private static async detectSurplus(
    locality: string,
    superAgentId: string,
  ): Promise<LocalitySurplus[]> {
    // Get all companies in locality
    const { data: companies } = await supabase
      .from("companies")
      .select("id")
      .ilike("locality", `%${locality}%`);

    if (!companies) return [];

    const companyIds = companies.map((c) => c.id);

    // Get all waste streams (supply)
    const { data: wasteStreams } = await supabase
      .from("waste_streams")
      .select("classification, monthly_volume, quality_grade")
      .in("company_id", companyIds);

    // Get all material requirements (demand)
    const { data: requirements } = await supabase
      .from("materials")
      .select("material_category, monthly_volume")
      .in("company_id", companyIds)
      .eq("category", "input");

    if (!wasteStreams) return [];

    // Group by material category
    const supplyByCategory: Record<
      string,
      { volume: number; count: number; quality_sum: number }
    > = {};
    const demandByCategory: Record<string, number> = {};

    for (const waste of wasteStreams) {
      const cat = waste.classification;
      if (!supplyByCategory[cat]) {
        supplyByCategory[cat] = { volume: 0, count: 0, quality_sum: 0 };
      }
      supplyByCategory[cat].volume += waste.monthly_volume;
      supplyByCategory[cat].count += 1;
      supplyByCategory[cat].quality_sum += parseInt(waste.quality_grade || "2");
    }

    if (requirements) {
      for (const req of requirements) {
        const cat = req.material_category || "";
        demandByCategory[cat] =
          (demandByCategory[cat] || 0) + req.monthly_volume;
      }
    }

    // Find surpluses (supply > demand)
    const surpluses: LocalitySurplus[] = [];

    for (const [category, supply] of Object.entries(supplyByCategory)) {
      const demand = demandByCategory[category] || 0;
      const surplus = supply.volume - demand;

      if (surplus > 10) {
        // At least 10 tons surplus
        surpluses.push({
          locality,
          super_agent_id: superAgentId,
          material_category: category,
          surplus_volume: surplus,
          average_price: 100, // TODO: Calculate from market data
          quality_tier_avg: Math.round(supply.quality_sum / supply.count),
          supplier_count: supply.count,
        });
      }
    }

    return surpluses;
  }

  /**
   * Detect material deficit in a locality
   */
  private static async detectDeficit(
    locality: string,
    superAgentId: string,
  ): Promise<LocalityDeficit[]> {
    // Get all companies in locality
    const { data: companies } = await supabase
      .from("companies")
      .select("id")
      .ilike("locality", `%${locality}%`);

    if (!companies) return [];

    const companyIds = companies.map((c) => c.id);

    // Get all material requirements (demand)
    const { data: requirements } = await supabase
      .from("materials")
      .select("material_category, monthly_volume, cost_per_unit")
      .in("company_id", companyIds)
      .eq("category", "input");

    // Get all waste streams (local supply)
    const { data: wasteStreams } = await supabase
      .from("waste_streams")
      .select("classification, monthly_volume")
      .in("company_id", companyIds);

    if (!requirements) return [];

    // Group by material category
    const demandByCategory: Record<
      string,
      { volume: number; count: number; max_price: number }
    > = {};
    const supplyByCategory: Record<string, number> = {};

    for (const req of requirements) {
      const cat = req.material_category || "";
      if (!demandByCategory[cat]) {
        demandByCategory[cat] = { volume: 0, count: 0, max_price: 0 };
      }
      demandByCategory[cat].volume += req.monthly_volume;
      demandByCategory[cat].count += 1;
      demandByCategory[cat].max_price = Math.max(
        demandByCategory[cat].max_price,
        req.cost_per_unit || 0,
      );
    }

    if (wasteStreams) {
      for (const waste of wasteStreams) {
        const cat = waste.classification;
        supplyByCategory[cat] =
          (supplyByCategory[cat] || 0) + waste.monthly_volume;
      }
    }

    // Find deficits (demand > supply)
    const deficits: LocalityDeficit[] = [];

    for (const [category, demand] of Object.entries(demandByCategory)) {
      const supply = supplyByCategory[category] || 0;
      const deficit = demand.volume - supply;

      if (deficit > 10) {
        // At least 10 tons deficit
        deficits.push({
          locality,
          super_agent_id: superAgentId,
          material_category: category,
          deficit_volume: deficit,
          max_price: demand.max_price,
          quality_tier_max: 3,
          buyer_count: demand.count,
        });
      }
    }

    return deficits;
  }

  /**
   * Match surpluses with deficits
   */
  private static matchSurplusDeficit(
    surpluses: LocalitySurplus[],
    deficits: LocalityDeficit[],
  ): Array<{ surplus: LocalitySurplus; deficit: LocalityDeficit }> {
    const matches: Array<{
      surplus: LocalitySurplus;
      deficit: LocalityDeficit;
    }> = [];

    for (const surplus of surpluses) {
      for (const deficit of deficits) {
        // Don't match same locality
        if (surplus.locality === deficit.locality) continue;

        // Must be same material
        if (surplus.material_category !== deficit.material_category) continue;

        // Quality must be acceptable
        if (surplus.quality_tier_avg > deficit.quality_tier_max) continue;

        // Volume must be significant
        const matchVolume = Math.min(
          surplus.surplus_volume,
          deficit.deficit_volume,
        );
        if (matchVolume < 10) continue;

        // Price must work (with transport)
        const estimatedDistance = this.estimateDistance(
          surplus.locality,
          deficit.locality,
        );
        const transportCost = estimatedDistance * 0.15; // 0.15/ton-km
        const totalCost = surplus.average_price + transportCost;

        if (totalCost < deficit.max_price) {
          matches.push({ surplus, deficit });
        }
      }
    }

    return matches;
  }

  /**
   * Estimate distance between localities (placeholder)
   */
  private static estimateDistance(
    locality1: string,
    locality2: string,
  ): number {
    // TODO: Implement real distance calculation
    // For now, assume 200km between different localities
    return 200;
  }

  /**
   * Negotiate cross-locality deal between super agents
   */
  static async negotiateCrossLocalityDeal(
    surplus: LocalitySurplus,
    deficit: LocalityDeficit,
  ): Promise<CrossLocalityDeal | null> {
    try {
      console.log(
        ` Negotiating cross-locality deal: ${surplus.locality}  ${deficit.locality}`,
      );

      // Calculate deal terms
      const volume = Math.min(surplus.surplus_volume, deficit.deficit_volume);
      const distance = this.estimateDistance(
        surplus.locality,
        deficit.locality,
      );
      const transportCost = distance * 0.15; // 0.15/ton-km
      const basePrice = surplus.average_price;
      const pricePerUnit = basePrice + transportCost;
      const totalValue = volume * pricePerUnit * 12; // Annual

      // Coordination fee (3% for cross-locality coordination)
      const coordinationFee = 3;

      // Get participating companies
      const sellers = await this.getSellersInLocality(
        surplus.locality,
        surplus.material_category,
      );
      const buyers = await this.getBuyersInLocality(
        deficit.locality,
        deficit.material_category,
      );

      // Create cross-locality deal
      const { data: deal, error } = await supabase
        .from("cross_locality_deals")
        .insert({
          source_locality: surplus.locality,
          source_super_agent_id: surplus.super_agent_id,
          destination_locality: deficit.locality,
          destination_super_agent_id: deficit.super_agent_id,
          material_category: surplus.material_category,
          volume: volume,
          price_per_unit: pricePerUnit,
          transport_cost_per_unit: transportCost,
          total_value: totalValue,
          participating_companies: {
            sellers: sellers.map((s) => s.id),
            buyers: buyers.map((b) => b.id),
          },
          status: "proposed",
          coordination_fee_percentage: coordinationFee,
        } as any)
        .select()
        .single();

      if (error) {
        console.error("Failed to create cross-locality deal:", error);
        return null;
      }

      // Post announcement on both locality feeds
      await this.announceToLocalities(deal, surplus, deficit);

      console.log(` Cross-locality deal proposed: ${deal.id}`);

      return deal as unknown as CrossLocalityDeal;
    } catch (error) {
      console.error("Error negotiating cross-locality deal:", error);
      return null;
    }
  }

  /**
   * Get sellers in locality for material
   */
  private static async getSellersInLocality(
    locality: string,
    materialCategory: string,
  ): Promise<any[]> {
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name")
      .ilike("locality", `%${locality}%`);

    if (!companies) return [];

    const { data: sellers } = await supabase
      .from("waste_streams")
      .select("company_id")
      .eq("classification", materialCategory)
      .in(
        "company_id",
        companies.map((c) => c.id),
      );

    if (!sellers) return [];

    const sellerIds = [...new Set(sellers.map((s) => s.company_id))];
    return companies.filter((c) => sellerIds.includes(c.id));
  }

  /**
   * Get buyers in locality for material
   */
  private static async getBuyersInLocality(
    locality: string,
    materialCategory: string,
  ): Promise<any[]> {
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name")
      .ilike("locality", `%${locality}%`);

    if (!companies) return [];

    const { data: buyers } = await supabase
      .from("materials")
      .select("company_id")
      .eq("material_category", materialCategory)
      .eq("category", "input")
      .in(
        "company_id",
        companies.map((c) => c.id),
      );

    if (!buyers) return [];

    const buyerIds = [...new Set(buyers.map((b) => b.company_id))];
    return companies.filter((c) => buyerIds.includes(c.id));
  }

  /**
   * Announce deal to both localities
   */
  private static async announceToLocalities(
    deal: any,
    surplus: LocalitySurplus,
    deficit: LocalityDeficit,
  ): Promise<void> {
    // Announcement to source locality
    await supabase.from("agent_feed").insert({
      agent_id: surplus.super_agent_id,
      post_type: "announcement",
      content: {
        type: "cross_locality_opportunity",
        title: `Export Opportunity: ${deal.material_category}`,
        description: `${deficit.locality} needs ${deal.volume} tons/month of ${deal.material_category}. NexaApex negotiated deal at ${deal.price_per_unit}/ton.`,
        destination_locality: deficit.locality,
        volume: deal.volume,
        price: deal.price_per_unit,
        annual_value: deal.total_value,
        role: "supplier",
      },
      locality: surplus.locality,
      visibility: "local",
    });

    // Announcement to destination locality
    await supabase.from("agent_feed").insert({
      agent_id: deficit.super_agent_id,
      post_type: "announcement",
      content: {
        type: "cross_locality_opportunity",
        title: `Import Opportunity: ${deal.material_category}`,
        description: `${surplus.locality} has ${deal.volume} tons/month surplus ${deal.material_category}. NexaApex negotiated supply at ${deal.price_per_unit}/ton (including transport).`,
        source_locality: surplus.locality,
        volume: deal.volume,
        price: deal.price_per_unit,
        annual_value: deal.total_value,
        role: "buyer",
      },
      locality: deficit.locality,
      visibility: "local",
    });
  }
}

