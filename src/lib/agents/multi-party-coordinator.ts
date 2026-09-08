/**
 * MULTI-PARTY DEAL COORDINATOR
 * Structures and executes complex 3+ party symbiosis deals
 * Gap #1: Multi-Party Deal Structuring
 */

import { supabase } from "@/lib/database/supabase";
import { getMaterialProperties } from "@/lib/constants/material-database";

export interface SymbiosisOpportunity {
  companies: string[];
  company_ids: string[];
  flow: string;
  annual_volume: number;
  estimated_value: number;
  carbon_saved: number;
  score: number;
  flows: Array<{
    from_company_id: string;
    to_company_id: string;
    material_category: string;
    volume: number;
    price: number;
  }>;
}

export interface MultiPartyDeal {
  id: string;
  symbiosis_id: string;
  participating_companies: string[];
  flows: Array<{
    seller_company_id: string;
    buyer_company_id: string;
    material_category: string;
    material_subtype: string;
    volume: number;
    price_per_unit: number;
    passport_id?: string;
  }>;
  value_distribution: Record<string, number>;
  total_value: number;
  carbon_savings: number;
  status:
    | "proposed"
    | "partial_approval"
    | "all_approved"
    | "active"
    | "completed"
    | "cancelled";
  approvals: Record<string, { approved: boolean; approved_at?: string }>;
  coordination_fee_percentage: number;
  coordinator_agent_id: string;
}

export class MultiPartyCoordinator {
  /**
   * Structure a multi-party deal from symbiosis opportunity
   */
  static async structureDeal(
    opportunity: SymbiosisOpportunity,
    coordinatorAgentId: string,
  ): Promise<MultiPartyDeal | null> {
    try {
      console.log(
        ` Structuring ${opportunity.companies.length}-party deal...`,
      );

      // Step 1: Build individual flows
      const flows = await this.buildFlows(opportunity);

      if (flows.length === 0) {
        console.log(" Could not build flows for opportunity");
        return null;
      }

      // Step 2: Calculate value distribution (who saves what)
      const valueDistribution = this.calculateValueDistribution(
        flows,
        opportunity,
      );

      // Step 3: Calculate coordination fee (5% of total value)
      const coordinationFee = 5; // percentage
      const totalValue =
        opportunity.estimated_value * (1 - coordinationFee / 100);

      // Step 4: Create multi-party deal record
      const { data: multiPartyDeal, error } = await supabase
        .from("multi_party_deals")
        .insert({
          participating_company_ids: opportunity.company_ids,
          flows: flows,
          value_distribution: valueDistribution,
          total_annual_value: totalValue,
          carbon_savings_tons_year: opportunity.carbon_saved,
          status: "proposed",
          approvals: this.initializeApprovals(opportunity.company_ids),
          coordination_fee_percentage: coordinationFee,
          coordinator_agent_id: coordinatorAgentId,
          proposal_expires_at: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 14 days
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to create multi-party deal:", error);
        return null;
      }

      console.log(` Multi-party deal structured: ${multiPartyDeal.id}`);

      // Step 5: Create individual bilateral deals for each flow
      await this.createBilateralDeals(multiPartyDeal.id, flows);

      // Step 6: Notify all participating companies
      await this.notifyParticipants(multiPartyDeal);

      return multiPartyDeal as unknown as MultiPartyDeal;
    } catch (error) {
      console.error("Error structuring multi-party deal:", error);
      return null;
    }
  }

  /**
   * Build individual flows from symbiosis opportunity
   */
  private static async buildFlows(
    opportunity: SymbiosisOpportunity,
  ): Promise<MultiPartyDeal["flows"]> {
    const flows: MultiPartyDeal["flows"] = [];

    // Get waste streams and requirements for all companies
    for (let i = 0; i < opportunity.company_ids.length; i++) {
      const currentCompanyId = opportunity.company_ids[i];
      const nextCompanyId =
        opportunity.company_ids[(i + 1) % opportunity.company_ids.length];

      // Get waste stream from current company
      const { data: wasteStreams } = await supabase
        .from("waste_streams")
        .select("*, material_passports(*)")
        .eq("company_id", currentCompanyId);

      // Get material requirements from next company
      const { data: requirements } = await supabase
        .from("materials")
        .select("*")
        .eq("company_id", nextCompanyId)
        .eq("category", "input");

      if (!wasteStreams || !requirements) continue;

      // Find matching material
      for (const waste of wasteStreams) {
        const wasteData = waste as any;
        const matchingReq = requirements.find(
          (req) =>
            this.materialsCompatible(
              wasteData.material_id ||
                wasteData.material_subtype ||
                wasteData.material_category ||
                wasteData.classification,
              (req as any).material_id ||
                (req as any).material_subtype ||
                req.material_category ||
                req.material_type,
            ),
        );

        if (matchingReq) {
          // Get passport if exists
          const passport = Array.isArray(wasteData.material_passports)
            ? wasteData.material_passports[0]
            : wasteData.material_passports;

          // Calculate fair price (midpoint between disposal cost savings and virgin material cost)
          const disposalSavings = wasteData.current_disposal_cost || 0;
          const virginCost = matchingReq.cost_per_unit || 100;
          const fairPrice = (disposalSavings + virginCost * 0.8) / 2; // 80% of virgin cost

          flows.push({
            seller_company_id: currentCompanyId,
            buyer_company_id: nextCompanyId,
            material_category:
              wasteData.material_category || wasteData.classification,
            material_subtype:
              wasteData.material_subtype || wasteData.classification,
            volume: Math.min(
              wasteData.monthly_volume,
              matchingReq.monthly_volume,
            ),
            price_per_unit: fairPrice,
            passport_id: passport?.id,
          });

          break; // One flow per company pair
        }
      }
    }

    return flows;
  }

  /**
   * Calculate value distribution across participants
   */
  private static calculateValueDistribution(
    flows: MultiPartyDeal["flows"],
    opportunity: SymbiosisOpportunity,
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    // Initialize all companies with 0
    for (const companyId of opportunity.company_ids) {
      distribution[companyId] = 0;
    }

    // Calculate savings for each flow
    for (const flow of flows) {
      // Seller saves disposal cost
      const monthlyVolume = flow.volume;
      const disposalSavings = monthlyVolume * 50; // 50/ton disposal cost
      const sellingRevenue = monthlyVolume * flow.price_per_unit;
      const sellerValue = disposalSavings + sellingRevenue;

      // Buyer saves vs virgin material cost
      const virginCost = monthlyVolume * 150; // 150/ton virgin cost
      const purchaseCost = monthlyVolume * flow.price_per_unit;
      const buyerValue = virginCost - purchaseCost;

      distribution[flow.seller_company_id] =
        (distribution[flow.seller_company_id] || 0) + sellerValue * 12; // Annual
      distribution[flow.buyer_company_id] =
        (distribution[flow.buyer_company_id] || 0) + buyerValue * 12; // Annual
    }

    return distribution;
  }

  /**
   * Initialize approval tracking
   */
  private static initializeApprovals(
    companyIds: string[],
  ): Record<string, { approved: boolean; approved_at?: string }> {
    const approvals: Record<
      string,
      { approved: boolean; approved_at?: string }
    > = {};

    for (const companyId of companyIds) {
      approvals[companyId] = { approved: false };
    }

    return approvals;
  }

  /**
   * Create bilateral deals for each flow in the multi-party deal
   */
  private static async createBilateralDeals(
    multiPartyDealId: string,
    flows: MultiPartyDeal["flows"],
  ): Promise<void> {
    for (const flow of flows) {
      // Get agents for both companies
      const { data: sellerAgent } = await supabase
        .from("agents")
        .select("id")
        .eq("company_id", flow.seller_company_id)
        .eq("agent_type", "local")
        .single();

      const { data: buyerAgent } = await supabase
        .from("agents")
        .select("id")
        .eq("company_id", flow.buyer_company_id)
        .eq("agent_type", "local")
        .single();

      if (!sellerAgent || !buyerAgent) continue;

      // Create bilateral deal
      await supabase.from("deals").insert({
        seller_agent_id: sellerAgent.id,
        buyer_agent_id: buyerAgent.id,
        seller_company_id: flow.seller_company_id,
        buyer_company_id: flow.buyer_company_id,
        passport_id: flow.passport_id || "",
        material_category: flow.material_category,
        material_subtype: flow.material_subtype,
        volume: flow.volume,
        unit: "tons",
        price_per_unit: flow.price_per_unit,
        total_value: flow.volume * flow.price_per_unit,
        duration_months: 12,
        payment_terms: "30 days",
        delivery_terms: "Ex-works",
        quality_tier: 2,
        status: "pending_multi_party_approval",
        multi_party_deal_id: multiPartyDealId,
        agent_recommendation: "approved",
        agent_reasoning: "Part of NexaApex coordinated symbiosis opportunity",
      });
    }
  }

  /**
   * Notify all participating companies
   */
  private static async notifyParticipants(deal: any): Promise<void> {
    for (const companyId of deal.participating_company_ids) {
      // Get user for company
      const { data: company } = await supabase
        .from("companies")
        .select("user_id, name")
        .eq("id", companyId)
        .single();

      if (!company?.user_id) continue;

      // Calculate their value
      const theirValue = deal.value_distribution[companyId] || 0;

      await supabase.from("notifications").insert({
        user_id: company.user_id,
        company_id: companyId,
        type: "multi_party_deal_proposed",
        title: "Multi-Party Symbiosis Opportunity",
        message: `NexaApex discovered a ${deal.participating_company_ids.length}-way circular opportunity. Your estimated annual value: ${Math.round(theirValue).toLocaleString()}. Carbon savings: ${Math.round(deal.carbon_savings_tons_year / deal.participating_company_ids.length)} tons CO/year.`,
        action_url: `/deals/multi-party/${deal.id}`,
      });
    }
  }

  /**
   * Process approval from one company
   */
  static async processApproval(
    dealId: string,
    companyId: string,
    approved: boolean,
  ): Promise<{ success: boolean; all_approved?: boolean }> {
    try {
      // Get current deal
      const { data: deal, error } = await supabase
        .from("multi_party_deals")
        .select("*")
        .eq("id", dealId)
        .single<MultiPartyDeal>();

      if (error || !deal) {
        return { success: false };
      }

      // Update approvals
      const approvals = deal.approvals as Record<
        string,
        { approved: boolean; approved_at?: string }
      >;
      approvals[companyId] = {
        approved,
        approved_at: approved ? new Date().toISOString() : undefined,
      };

      // Check if all approved
      const allApproved = Object.values(approvals).every((a) => a.approved);

      // Update deal status
      const newStatus = allApproved
        ? "all_approved"
        : approved
          ? "partial_approval"
          : "cancelled";

      await supabase
        .from("multi_party_deals")
        .update({
          approvals,
          status: newStatus,
          activated_at: allApproved ? new Date().toISOString() : null,
        })
        .eq("id", dealId);

      // If all approved, activate bilateral deals
      if (allApproved) {
        await supabase
          .from("deals")
          .update({ status: "active", start_date: new Date().toISOString() })
          .eq("multi_party_deal_id", dealId);

        console.log(
          ` Multi-party deal ${dealId} fully approved and activated`,
        );
      }

      return { success: true, all_approved: allApproved };
    } catch (error) {
      console.error("Error processing approval:", error);
      return { success: false };
    }
  }

  /**
   * Get pending multi-party deals for a company
   */
  static async getPendingDealsForCompany(
    companyId: string,
  ): Promise<MultiPartyDeal[]> {
    const { data: deals } = await supabase
      .from("multi_party_deals")
      .select("*")
      .contains("participating_company_ids", [companyId])
      .in("status", ["proposed", "partial_approval"]);

    return (deals || []) as unknown as MultiPartyDeal[];
  }

  private static materialsCompatible(a: string, b: string): boolean {
    const left = (a || "").toLowerCase();
    const right = (b || "").toLowerCase();
    if (!left || !right) return false;
    if (left === right || left.includes(right) || right.includes(left))
      return true;

    const aProps = getMaterialProperties(left);
    const bProps = getMaterialProperties(right);
    if (!aProps || !bProps) return false;

    return (
      aProps.category === bProps.category ||
      aProps.subtype === bProps.subtype ||
      aProps.material_id === bProps.material_id
    );
  }
}


