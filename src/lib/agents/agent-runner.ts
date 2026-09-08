/**
 * AGENT RUNNER - ORCHESTRATES ALL AGENT TYPES
 * Runs Nexa, NexaPrime (Recycler/Processor/Logistics), and NexaApex
 */

import { supabase } from "@/lib/database/supabase";
import { LocalAgent } from "./local-agent";
import { RecyclerAgent } from "./recycler-agent";
import { ProcessorAgent } from "./processor-agent";
import { LogisticsAgent } from "./logistics-agent";
import { SuperAgent } from "./super-agent";
import { ScoringEngine } from "./scoring-engine";
type FeedContent = {
  price?: number;
  volume?: number;
  material_category?: string;
  material_subtype?: string;
  material?: string;
  quality_tier?: number;
  passport_id?: string;

  counter_offer?: {
    price: number;
    volume: number;
    terms?: string;
  };
  negotiation_context?: {
    round: number;
    against_post_id?: string;
    against_price?: number;
    against_volume?: number;
    material?: string;
  };
};

export class AgentRunner {
  private static pick<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private static formatMaterialLabel(content: any): string {
    return (
      content?.material_subtype ||
      content?.material_category ||
      content?.material ||
      "material"
    );
  }

  private static openingMessage(material: string): string {
    const templates = [
      `We can buy ${material} if quality checks out.`,
      `We have demand for ${material}; sharing a first counter.`,
      `Interested in ${material}. Sending commercial terms.`,
      `We can take this ${material} lot. Please review this offer.`,
    ];
    return this.pick(templates);
  }

  private static counterMessage(round: number, material: string): string {
    const templates = [
      `Round ${round}: revising price for ${material}.`,
      `Counter ${round}: updated commercial terms for ${material}.`,
      `Round ${round}: aligning on ${material} economics.`,
      `Counter ${round}: proposing adjusted terms for ${material}.`,
    ];
    return this.pick(templates);
  }

  /**
   * Run all active agents
   */
  static async runAllAgents(): Promise<{
    success: boolean;
    stats: {
      total_agents: number;
      agents_run: number;
      nexa_run: number;
      nexaprime_run: number;
      nexaapex_run: number;
      total_actions: number;
      errors: string[];
    };
  }> {
    console.log(" Starting agent execution cycle...");

    const stats = {
      total_agents: 0,
      agents_run: 0,
      nexa_run: 0,
      nexaprime_run: 0,
      nexaapex_run: 0,
      total_actions: 0,
      errors: [] as string[],
    };

    try {
      // Get all active agents
      const { data: agents, error: agentsError } = await supabase
        .from("agents")
        .select("*")
        .eq("status", "active");

      if (agentsError) {
        throw new Error(`Failed to fetch agents: ${agentsError.message}`);
      }

      if (!agents || agents.length === 0) {
        console.log(" No active agents found");
        return {
          success: true,
          stats: { ...stats, total_agents: 0 },
        };
      }

      stats.total_agents = agents.length;
      console.log(` Found ${agents.length} active agents`);

      // Run each agent based on type
      for (const agent of agents) {
        try {
          console.log(` Running ${agent.agent_type} agent: ${agent.name}`);

          let result: { actions: number; errors: string[] };

          switch (agent.agent_type) {
            case "local":
              // NEXA (Manufacturer)
              const localAgent = new LocalAgent(agent);
              result = await localAgent.runCycle();
              stats.nexa_run++;
              break;

            case "specialist_recycler":
              // NEXAPRIME RECYCLER
              const { data: recyclerProfile } = await supabase
                .from("recycler_profiles")
                .select("*")
                .eq("company_id", agent.company_id)
                .single();

              const recyclerAgent = new RecyclerAgent(agent, recyclerProfile);
              result = await recyclerAgent.runCycle();
              stats.nexaprime_run++;
              break;

            case "specialist_processor":
              // NEXAPRIME PROCESSOR
              const { data: processorProfile } = await supabase
                .from("processor_profiles")
                .select("*")
                .eq("company_id", agent.company_id)
                .single();

              const processorAgent = new ProcessorAgent(
                agent,
                processorProfile,
              );
              result = await processorAgent.runCycle();
              stats.nexaprime_run++;
              break;

            case "specialist_logistics":
              // NEXAPRIME LOGISTICS
              const { data: logisticsProfile } = await supabase
                .from("logistics_profiles")
                .select("*")
                .eq("company_id", agent.company_id)
                .single();

              const logisticsAgent = new LogisticsAgent(
                agent,
                logisticsProfile,
              );
              result = await logisticsAgent.runCycle();
              stats.nexaprime_run++;
              break;

            case "super":
              // NEXAAPEX (Locality Coordinator)
              const superAgent = new SuperAgent(agent);
              result = await superAgent.runCycle();
              stats.nexaapex_run++;
              break;

            default:
              console.log(` Unknown agent type: ${agent.agent_type}`);
              continue;
          }

          stats.agents_run++;
          stats.total_actions += result.actions;

          if (result.errors.length > 0) {
            stats.errors.push(
              ...result.errors.map((e) => `${agent.name}: ${e}`),
            );
          }

          console.log(` ${agent.name} completed: ${result.actions} actions`);
        } catch (agentError: any) {
          console.error(` Error running ${agent.name}:`, agentError);
          stats.errors.push(`${agent.name}: ${agentError.message}`);
        }
      }

      // Run negotiation engine to process ongoing threads
      console.log(" Processing negotiations...");
      await this.processNegotiations();

      console.log(" Agent cycle complete");
      console.log(
        ` Stats: ${stats.agents_run}/${stats.total_agents} agents run, ${stats.total_actions} total actions`,
      );

      return {
        success: true,
        stats,
      };
    } catch (error: any) {
      console.error(" Agent runner failed:", error);
      return {
        success: false,
        stats: {
          ...stats,
          errors: [...stats.errors, error.message],
        },
      };
    }
  }

  /**
   * Process ongoing negotiations
   */
  /**
   * Process ongoing negotiations + start new ones
   */
  private static async processNegotiations(): Promise<void> {
    // 1 Get active offers from last 24h
    const { data: offers } = await supabase
      .from("agent_feed")
      .select("*")
      .eq("post_type", "offer")
      .eq("is_active", true)
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      );

    if (!offers || offers.length === 0) return;

    for (const offer of offers) {
      try {
        // Check if already has replies
        const { count: replyCount } = await supabase
          .from("agent_feed")
          .select("*", { count: "exact", head: true })
          .eq("thread_root_id", offer.id);

        // If no replies  start negotiation
        if (!replyCount || replyCount === 0) {
          await this.startNegotiation(offer);
          continue;
        }

        // Otherwise continue negotiation
        await this.continueNegotiation(offer.id);
      } catch (error) {
        console.error("Error processing offer:", error);
      }
    }
  }
  /**
   * Start negotiation by responding to offer
   */
  private static async startNegotiation(offer: any): Promise<void> {
    const materialCategory =
      offer.content.material_category || offer.content.material || "";

    const interestedAgents = await this.findInterestedAgentsForMaterial(
      materialCategory,
      offer.agent_id,
    );

    if (!interestedAgents || interestedAgents.length === 0) return;

    const respondingAgent = interestedAgents[0];

    const askingPrice = Number(offer.content.price || 0);
    if (!askingPrice) return;
    const counterPrice = ScoringEngine.calculateCounterOffer({
      original_price: askingPrice,
      target_price: askingPrice * 1.08,
      round: 1,
      max_rounds: 3,
    });

    const materialLabel = this.formatMaterialLabel(offer.content);

    await supabase.from("agent_feed").insert({
      agent_id: respondingAgent.id,
      post_type: "reply",
      parent_id: offer.id,
      thread_root_id: offer.id,
      content: {
        message: this.openingMessage(materialLabel),
        counter_offer: {
          price: Math.round(counterPrice * 100) / 100,
          volume: offer.content.volume,
          terms: "Pickup included",
        },
        negotiation_context: {
          round: 1,
          against_post_id: offer.id,
          against_price: askingPrice,
          against_volume: offer.content.volume,
          material: materialLabel,
        },
        interest_level: "medium",
      },
      locality: offer.locality,
      visibility: offer.visibility,
    });

    console.log(` Started negotiation on offer ${offer.id}`);
  }
  /**
   * Continue negotiation rounds
   */
  /**
   * Continue negotiation rounds safely
   */
  private static async continueNegotiation(
    threadRootId: string,
  ): Promise<void> {
    const { data: messages, error } = await supabase
      .from("agent_feed")
      .select("*")
      .eq("thread_root_id", threadRootId)
      .order("created_at", { ascending: true });

    if (error || !messages || messages.length < 2) return;

    const originalPost = messages[0];
    const lastMessage = messages[messages.length - 1];

    // Prevent infinite loops if thread already inactive
    if (!originalPost.is_active) return;

    const replyCount = messages.filter((m) => m.post_type === "reply").length;
    if (replyCount >= 3) {
      await this.proposeDealFromThread(messages);
      await supabase
        .from("agent_feed")
        .update({ is_active: false })
        .eq("thread_root_id", threadRootId);
      return;
    }

    // Extract prices safely
    const originalContent = originalPost.content as FeedContent;
    const lastContent = lastMessage.content as FeedContent;

    const originalPrice =
      originalContent?.price || originalContent?.counter_offer?.price;

    const lastPrice = lastContent?.counter_offer?.price || lastContent?.price;

    if (!originalPrice || !lastPrice) return;

    // Determine who should respond
    const nextAgentId =
      lastMessage.agent_id === originalPost.agent_id
        ? messages[1]?.agent_id // reply agent
        : originalPost.agent_id;

    if (!nextAgentId) return;

    const newPrice = ScoringEngine.calculateCounterOffer({
      original_price: lastPrice,
      target_price: originalPrice,
      round: replyCount + 1,
      max_rounds: 3,
    });

    const materialLabel = this.formatMaterialLabel(originalContent);

    await supabase.from("agent_feed").insert({
      agent_id: nextAgentId,
      post_type: "reply",
      parent_id: lastMessage.id,
      thread_root_id: threadRootId,
      content: {
        message: this.counterMessage(replyCount + 1, materialLabel),
        counter_offer: {
          price: Math.round(newPrice * 100) / 100,
          volume: lastContent?.counter_offer?.volume,
          terms: "30 days payment",
        },
        negotiation_context: {
          round: replyCount + 1,
          against_post_id: lastMessage.id,
          against_price: lastPrice,
          against_volume: lastContent?.counter_offer?.volume || lastContent?.volume,
          material: materialLabel,
        },
        interest_level: replyCount >= 2 ? "high" : "medium",
      },
      locality: originalPost.locality,
      visibility: originalPost.visibility,
      is_active: true,
    });
  }

  private static async findInterestedAgentsForMaterial(
    materialCategory: string,
    excludeAgentId: string,
  ): Promise<any[]> {
    const { data: demandPosts } = await supabase
      .from("agent_feed")
      .select("agent_id, content")
      .eq("post_type", "request")
      .eq("is_active", true);

    const demandAgentIds = new Set(
      (demandPosts || [])
        .filter((p: any) => {
          const c = p.content || {};
          const key =
            c.material_id || c.sku || c.material_subtype || c.material_category || "";
          return key.toLowerCase().includes((materialCategory || "").toLowerCase());
        })
        .map((p: any) => p.agent_id),
    );

    if (demandAgentIds.size === 0) return [];

    const { data: activeAgents } = await supabase
      .from("agents")
      .select("*")
      .eq("status", "active")
      .neq("id", excludeAgentId);

    if (!activeAgents || activeAgents.length === 0) return [];

    const needle = (materialCategory || "").toLowerCase();

    return activeAgents.filter((agent) => {
      if (!demandAgentIds.has(agent.id)) return false;

      const constraints = (agent.constraints || {}) as Record<string, any>;

      // Recycler
      if (agent.agent_type === "specialist_recycler") {
        const accepted = constraints.accepted_material_categories || [];
        return (
          accepted.length === 0 ||
          accepted.some((c: string) => c.toLowerCase().includes(needle))
        );
      }

      // Processor
      if (agent.agent_type === "specialist_processor") {
        const inputMaterials = constraints.input_materials || [];
        return (
          inputMaterials.length === 0 ||
          inputMaterials.some((c: string) => c.toLowerCase().includes(needle))
        );
      }

      // Local and logistics can still participate
      if (agent.agent_type === "local" || agent.agent_type === "specialist_logistics") {
        const categories = constraints.material_categories || [];
        return (
          categories.length === 0 ||
          categories.some((c: string) => c.toLowerCase().includes(needle))
        );
      }

      return false;
    });
  }

  /**
   * Create deal from full negotiation thread
   */
  private static async proposeDealFromThread(messages: any[]): Promise<void> {
    const originalPost = messages[0];
    const finalMessage = messages[messages.length - 1];

    const finalPrice = finalMessage.content?.counter_offer?.price;

    const volume =
      finalMessage.content?.counter_offer?.volume ||
      originalPost.content?.volume;

    if (!finalPrice || !volume) return;

    const negotiation = {
      ...finalMessage,
      parent: originalPost,
    };

    await this.proposeDeal(negotiation);
  }

  /**
   * Propose deal from negotiation
   */
  private static async proposeDeal(negotiation: any): Promise<void> {
    const parentPost = negotiation?.parent;
    if (!parentPost) return;

    const content = negotiation.content as FeedContent | null;
    const parentContent = parentPost.content as FeedContent | null;

    if (!content?.counter_offer || !parentContent) return;

    const { price, volume, terms } = content.counter_offer;

    if (!price || !volume) return;

    // Ensure required DB fields exist
    if (!parentContent.material_category) {
      console.error("Missing material_category for deal creation");
      return;
    }

    const materialSubtype =
      parentContent.material_subtype ?? parentContent.material;

    if (!materialSubtype) {
      console.error("Missing material_subtype/material for deal creation");
      return;
    }

    const isBuyerInitiated = parentPost.post_type === "offer";

    const sellerAgentId = isBuyerInitiated
      ? parentPost.agent_id
      : negotiation.agent_id;

    const buyerAgentId = isBuyerInitiated
      ? negotiation.agent_id
      : parentPost.agent_id;

    const { data: sellerAgent } = await supabase
      .from("agents")
      .select("company_id")
      .eq("id", sellerAgentId)
      .single();

    const { data: buyerAgent } = await supabase
      .from("agents")
      .select("company_id")
      .eq("id", buyerAgentId)
      .single();

    if (!sellerAgent?.company_id || !buyerAgent?.company_id) return;

    const { data: existingThreadDeal } = await supabase
      .from("deals")
      .select("id")
      .eq("negotiation_thread_id", negotiation.thread_root_id)
      .maybeSingle();

    if (existingThreadDeal?.id) return;

    const roundFromContext = Number(content.negotiation_context?.round || 3);
    const normalizedRounds = Math.max(1, Math.min(3, roundFromContext));

    const dealData = {
      seller_agent_id: sellerAgentId,
      buyer_agent_id: buyerAgentId,
      seller_company_id: sellerAgent.company_id,
      buyer_company_id: buyerAgent.company_id,
      ...(parentContent.passport_id && {
        passport_id: parentContent.passport_id,
      }),
      material_category: parentContent.material_category,
      material_subtype: materialSubtype,
      volume: volume,
      unit: "tons",
      price_per_unit: price,
      total_value: volume * price,
      duration_months: 1,
      payment_terms: terms ?? "30 days",
      delivery_terms: "Pickup by buyer",
      quality_tier: parentContent.quality_tier ?? 2,
      status: "pending_seller_approval",
      negotiation_thread_id: negotiation.thread_root_id,
      negotiation_rounds: normalizedRounds,
      agent_recommendation: "approved",
      agent_reasoning: `[AUTO_3_ROUNDS] Negotiated through structured rounds with explicit price anchoring and auto-proposed for human approval.`,
    };

    const { data: deal, error } = await supabase
      .from("deals")
      .insert(dealData as any)
      .select()
      .single();

    if (error || !deal) {
      console.error("Failed to create deal:", error);
      return;
    }

    await supabase.from("agent_feed").insert({
      agent_id: negotiation.agent_id,
      post_type: "deal_proposal",
      parent_id: negotiation.id,
      thread_root_id: negotiation.thread_root_id,
      content: {
        deal_id: deal.id,
        summary: `Deal proposed after ${normalizedRounds} rounds: ${volume} tons ${parentContent.material_category} @ EUR ${price}/ton`,
      },
      locality: parentPost.locality,
      visibility: parentPost.visibility,
    });

    const sellerUserId = await this.getUserFromCompany(sellerAgent.company_id);
    const buyerUserId = await this.getUserFromCompany(buyerAgent.company_id);

    await supabase.from("notifications").insert([
      {
        user_id: sellerUserId,
        company_id: sellerAgent.company_id,
        type: "deal_proposed",
        title: "New Deal Awaiting Approval",
        message: `Your agent negotiated a deal in ${normalizedRounds} rounds: ${volume} tons ${parentContent.material_category} @ EUR ${price}/ton`,
        related_deal_id: deal.id,
        action_url: `/deals/created`,
      },
      {
        user_id: buyerUserId,
        company_id: buyerAgent.company_id,
        type: "deal_proposed",
        title: "Deal Pending Review",
        message: `Deal proposed in ${normalizedRounds} rounds: ${volume} tons ${parentContent.material_category} @ EUR ${price}/ton`,
        related_deal_id: deal.id,
        action_url: `/deals/created`,
      },
    ]);

    console.log(` Deal proposed: ${deal.id}`);
  }

  /**
   * Helper: Get user_id from company_id
   */
  private static async getUserFromCompany(companyId: string): Promise<string> {
    const { data } = await supabase
      .from("companies")
      .select("user_id")
      .eq("id", companyId)
      .single();

    return data?.user_id || "";
  }
}


