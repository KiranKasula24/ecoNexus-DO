/**
 * NEXAAPEX - SUPER AGENT (UPDATED WITH FULL COORDINATION)
 * Gap #1: Multi-Party Deal Structuring - IMPLEMENTED
 * Gap #5: Cross-Locality Coordination - IMPLEMENTED
 */

import { supabase } from "@/lib/database/supabase";
import { getMaterialProperties } from "@/lib/constants/material-database";
import {
  MultiPartyCoordinator,
  SymbiosisOpportunity,
} from "./multi-party-coordinator";
import { CrossLocalityCoordinator } from "./cross-locality-coordinator";

const supabaseAdmin = supabase;

export class SuperAgent {
  private agentId: string;
  private locality: string;
  private constraints: any;

  constructor(agent: any) {
    this.agentId = agent.id;
    this.locality = agent.locality;
    this.constraints = agent.constraints || {};
  }

  async runCycle(): Promise<{ actions: number; errors: string[] }> {
    const actions: string[] = [];
    const errors: string[] = [];

    try {
      // Step 1: Analyze material flows in locality
      const flows = await this.analyzeMaterialFlows();
      actions.push(`Analyzed ${flows.length} material flows`);

      // Step 2: Detect circular patterns (symbiosis)
      const symbioses = await this.detectSymbiosis(flows);
      actions.push(`Detected ${symbioses.length} symbiosis patterns`);

      // Step 3: Announce AND STRUCTURE high-value opportunities (GAP #1)
      const structured = await this.structureSymbioses(symbioses);
      actions.push(`Structured ${structured} multi-party deals`);

      // Step 3b: Same-locality multi-party matching from live marketplace feed
      const localityStructured = await this.coordinateSameLocalityDeals();
      actions.push(`Structured ${localityStructured} same-locality multi-party deals`);

      // Step 3c: Assist local agents with filtered actionable digest
      const assistPosts = await this.publishLocalAgentAssistDigest();
      actions.push(`Published ${assistPosts} local-assist digests`);

      // Step 4: Cross-locality coordination (GAP #5)
      const crossLocalityDeals = await this.coordinateCrossLocality();
      actions.push(`Coordinated ${crossLocalityDeals} cross-locality deals`);

      // Step 4b: Feed-driven cross-locality multi-party structuring for demo visibility
      const crossMarketplaceDeals = await this.coordinateCrossLocalityMarketplaceDeals();
      actions.push(`Structured ${crossMarketplaceDeals} cross-locality marketplace deals`);
    } catch (error: any) {
      errors.push(error.message);
    }

    return { actions: actions.length, errors };
  }

  /**
   * Analyze material flows in locality
   */
  private async analyzeMaterialFlows(): Promise<any[]> {
    // Get all companies in locality
    const { data: companies } = await supabaseAdmin
      .from("companies")
      .select("id, name, locality, location");

    if (!companies) return [];

    const normalizedLocality = this.normalizeLocality(this.locality);
    const localityCompanies = companies.filter((c: any) => {
      const loc = this.normalizeLocality(c.locality);
      const city = this.normalizeLocality(c.location?.city);
      return (
        loc === normalizedLocality ||
        city === normalizedLocality ||
        city.includes(normalizedLocality)
      );
    });

    const flows: any[] = [];

    for (const company of localityCompanies) {
      // Get their waste streams (outputs)
      const { data: outputs } = await supabaseAdmin
        .from("waste_streams")
        .select("material_type, material_category, monthly_volume")
        .eq("company_id", company.id);

      // Get their material requirements (inputs)
      const { data: inputs } = await supabaseAdmin
        .from("materials")
        .select("material_type, material_category, monthly_volume")
        .eq("company_id", company.id)
        .eq("category", "input");

      flows.push({
        company_id: company.id,
        company_name: company.name,
        outputs: outputs || [],
        inputs: inputs || [],
      });
    }

    return flows;
  }

  /**
   * Detect circular symbiosis patterns (3+ companies)
   */
  private async detectSymbiosis(flows: any[]): Promise<SymbiosisOpportunity[]> {
    const symbioses: SymbiosisOpportunity[] = [];

    // Simple 3-way pattern detection: A produces X, B needs X and produces Y, C needs Y
    for (let i = 0; i < flows.length; i++) {
      const companyA = flows[i];

      for (const outputA of companyA.outputs) {
        // Find who needs this output
        for (let j = 0; j < flows.length; j++) {
          if (i === j) continue;
          const companyB = flows[j];

          const matchingInputB = companyB.inputs.find(
            (inp: any) =>
              this.materialsCompatible(
                outputA.material_category || outputA.material_type,
                inp.material_category || inp.material_type,
              ),
          );

          if (!matchingInputB) continue;

          // Found A  B connection
          // Now check if B produces something that someone else needs
          for (const outputB of companyB.outputs) {
            for (let k = 0; k < flows.length; k++) {
              if (k === i || k === j) continue;
              const companyC = flows[k];

              const matchingInputC = companyC.inputs.find(
                (inp: any) =>
                  this.materialsCompatible(
                    outputB.material_category || outputB.material_type,
                    inp.material_category || inp.material_type,
                  ),
              );

              if (!matchingInputC) continue;

              // Found A  B  C symbiosis!
              const annualVolume =
                Math.min(
                  outputA.monthly_volume,
                  matchingInputB.monthly_volume,
                  outputB.monthly_volume,
                  matchingInputC.monthly_volume,
                ) * 12;

              // Estimate value (simplified)
              const estimatedValue = annualVolume * 100; // 100/ton average

              // Estimate carbon savings (simplified)
              const carbonSaved = annualVolume * 0.5; // 0.5 tons CO/ton material

              // Check if meets minimum criteria
              const meetsCriteria =
                estimatedValue >= 25000 || // 25k/year
                carbonSaved >= 50; // 50 tons CO/year

              if (meetsCriteria) {
                // Build detailed flows for structuring
                const detailedFlows = [
                  {
                    from_company_id: companyA.company_id,
                    to_company_id: companyB.company_id,
                    material_category: outputA.material_category,
                    volume: Math.min(
                      outputA.monthly_volume,
                      matchingInputB.monthly_volume,
                    ),
                    price: 100, // Placeholder
                  },
                  {
                    from_company_id: companyB.company_id,
                    to_company_id: companyC.company_id,
                    material_category: outputB.material_category,
                    volume: Math.min(
                      outputB.monthly_volume,
                      matchingInputC.monthly_volume,
                    ),
                    price: 100,
                  },
                ];

                symbioses.push({
                  companies: [
                    companyA.company_name,
                    companyB.company_name,
                    companyC.company_name,
                  ],
                  company_ids: [
                    companyA.company_id,
                    companyB.company_id,
                    companyC.company_id,
                  ],
                  flow: `${outputA.material_category}  ${outputB.material_category}`,
                  annual_volume: annualVolume,
                  estimated_value: estimatedValue,
                  carbon_saved: carbonSaved,
                  score:
                    estimatedValue * 0.4 +
                    carbonSaved * 300 * 0.3 +
                    3 * 1000 * 0.2 +
                    100 * 0.1,
                  flows: detailedFlows,
                });
              }
            }
          }
        }
      }
    }

    // Sort by score and return top opportunities
    return symbioses.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  /**
   * Structure symbioses into actual multi-party deals (GAP #1 SOLUTION)
   */
  private async structureSymbioses(
    symbioses: SymbiosisOpportunity[],
  ): Promise<number> {
    let structured = 0;

    for (const symbiosis of symbioses) {
      // Check if already structured
      const { data: existingDeal } = await supabaseAdmin
        .from("multi_party_deals")
        .select("id")
        .contains("participating_company_ids", symbiosis.company_ids)
        .in("status", ["proposed", "partial_approval", "all_approved"])
        .single();

      if (existingDeal) continue;

      // USE NEW MULTI-PARTY COORDINATOR!
      const multiPartyDeal = await MultiPartyCoordinator.structureDeal(
        symbiosis,
        this.agentId,
      );

      if (multiPartyDeal) {
        structured++;
        console.log(
          ` NexaApex structured ${symbiosis.companies.length}-party deal worth ${Math.round(multiPartyDeal.total_value).toLocaleString()}/year`,
        );
      }
    }

    return structured;
  }

  /**
   * Coordinate with other NexaApex agents (GAP #5 SOLUTION)
   */
  private async coordinateCrossLocality(): Promise<number> {
    console.log(
      ` ${this.locality} NexaApex: Starting cross-locality coordination...`,
    );

    // Use new Cross-Locality Coordinator
    const { surpluses, deficits, matches } =
      await CrossLocalityCoordinator.analyzeCrossLocalityOpportunities();

    let dealsNegotiated = 0;

    // For each match, negotiate deal
    for (const match of matches) {
      // Skip if we're not involved in this match
      if (
        match.surplus.super_agent_id !== this.agentId &&
        match.deficit.super_agent_id !== this.agentId
      ) {
        continue;
      }

      // Check if already negotiated
      const { data: existingDeal } = await supabaseAdmin
        .from("cross_locality_deals")
        .select("id")
        .eq("source_locality", match.surplus.locality)
        .eq("destination_locality", match.deficit.locality)
        .eq("material_category", match.surplus.material_category)
        .in("status", ["proposed", "negotiating", "agreed"])
        .single();

      if (existingDeal) continue;

      // Negotiate cross-locality deal
      const deal = await CrossLocalityCoordinator.negotiateCrossLocalityDeal(
        match.surplus,
        match.deficit,
      );

      if (deal) {
        dealsNegotiated++;
        console.log(
          ` Cross-locality deal: ${match.surplus.locality}  ${match.deficit.locality} (${match.surplus.material_category})`,
        );
      }
    }

    console.log(
      ` ${this.locality} NexaApex coordinated ${dealsNegotiated} cross-locality deals`,
    );
    return dealsNegotiated;
  }

  /**
   * Detects and structures same-locality multi-party opportunities:
   * - many_to_one: 2+ sellers -> 1 buyer
   * - one_to_many: 1 seller -> 2+ buyers
   */
  private async coordinateSameLocalityDeals(): Promise<number> {
    const { data: feed } = await supabaseAdmin
      .from("agent_feed")
      .select(
        `
        id,
        post_type,
        locality,
        content,
        agent:agent_id(id, name, company_id, agent_type)
      `,
      )
      .eq("is_active", true)
      .in("post_type", ["offer", "request"])
      .order("created_at", { ascending: false })
      .limit(300);

    if (!feed || feed.length === 0) return 0;

    const feedInLocality = feed.filter((post: any) =>
      this.localitiesMatch(post.locality, this.locality),
    );
    if (feedInLocality.length === 0) return 0;

    const offers = feedInLocality.filter((p: any) => p.post_type === "offer");
    const requests = feedInLocality.filter((p: any) => p.post_type === "request");
    let created = 0;

    // many_to_one: multiple sellers -> one buyer
    for (const req of requests) {
      const reqContent = (req.content || {}) as any;
      const material = (reqContent.material_category || "").toLowerCase();
      const requestedVolume = Number(reqContent.volume_needed || 0);
      if (!material || requestedVolume <= 0) continue;

      const matchingOffers = offers.filter((offer: any) => {
        const oc = offer.content || {};
        const offerMaterial = String(
          oc.material_category || oc.material_subtype || oc.material || "",
        ).toLowerCase();
        return (
          offerMaterial.includes(material) ||
          material.includes(offerMaterial)
        );
      });

      const uniqueSellers = Array.from(
        new Map(
          matchingOffers
            .filter((m: any) => m.agent?.company_id !== req.agent?.company_id)
            .map((m: any) => [m.agent?.company_id, m]),
        ).values(),
      );

      if (uniqueSellers.length < 2) continue;

      const selectedSellers = uniqueSellers.slice(0, 2);
      const totalOffered = selectedSellers.reduce(
        (sum: number, s: any) => sum + Number(s.content?.volume || 0),
        0,
      );
      if (totalOffered <= 0) continue;

      const participatingCompanies = [
        ...selectedSellers.map((s: any) => s.agent.company_id),
        req.agent.company_id,
      ];
      const duplicate = await this.findExistingLocalityMultiPartyDeal(
        participatingCompanies,
        "many_to_one",
      );
      if (duplicate) continue;

      const flows = selectedSellers.map((s: any) => ({
        seller_company_id: s.agent.company_id,
        buyer_company_id: req.agent.company_id,
        material_category: reqContent.material_category || s.content?.material_category,
        material_subtype: s.content?.material_subtype || s.content?.material || "unknown",
        volume: Math.min(Number(s.content?.volume || 0), requestedVolume / selectedSellers.length),
        price_per_unit: Number(s.content?.price || reqContent.max_price || 0),
        passport_id: s.content?.passport_id || null,
        source_offer_post_id: s.id,
      }));

      await this.createLocalityMultiPartyDeal({
        relationType: "many_to_one",
        participatingCompanies,
        flows,
        title: "Same-locality many-to-one bundle",
        description:
          "NexaApex bundled multiple local sellers to satisfy one local buyer with coordinated pricing and delivery.",
      });

      created++;
    }

    // one_to_many: one seller -> multiple buyers
    for (const offer of offers) {
      const offerContent = (offer.content || {}) as any;
      const material = String(
        offerContent.material_category || offerContent.material_subtype || offerContent.material || "",
      ).toLowerCase();
      const offeredVolume = Number(offerContent.volume || 0);
      if (!material || offeredVolume <= 0) continue;

      const matchingRequests = requests.filter((req: any) => {
        const rc = req.content || {};
        const reqMaterial = String(
          rc.material_category || rc.material_subtype || "",
        ).toLowerCase();
        return (
          (reqMaterial.includes(material) || material.includes(reqMaterial)) &&
          req.agent?.company_id !== offer.agent?.company_id
        );
      });

      const uniqueBuyers = Array.from(
        new Map(matchingRequests.map((r: any) => [r.agent?.company_id, r])).values(),
      );
      if (uniqueBuyers.length < 2) continue;

      const selectedBuyers = uniqueBuyers.slice(0, 2);
      const participatingCompanies = [
        offer.agent.company_id,
        ...selectedBuyers.map((b: any) => b.agent.company_id),
      ];
      const duplicate = await this.findExistingLocalityMultiPartyDeal(
        participatingCompanies,
        "one_to_many",
      );
      if (duplicate) continue;

      const flows = selectedBuyers.map((b: any) => {
        const needed = Number(b.content?.volume_needed || offeredVolume / selectedBuyers.length);
        return {
          seller_company_id: offer.agent.company_id,
          buyer_company_id: b.agent.company_id,
          material_category: b.content?.material_category || offerContent.material_category,
          material_subtype: offerContent.material_subtype || offerContent.material || "unknown",
          volume: Math.min(needed, offeredVolume / selectedBuyers.length),
          price_per_unit: Number(offerContent.price || b.content?.max_price || 0),
          passport_id: offerContent.passport_id || null,
          source_offer_post_id: offer.id,
        };
      });

      await this.createLocalityMultiPartyDeal({
        relationType: "one_to_many",
        participatingCompanies,
        flows,
        title: "Same-locality one-to-many allocation",
        description:
          "NexaApex split one local seller output across multiple local buyers to maximize utilization.",
      });

      created++;
    }

    return created;
  }

  private async findExistingLocalityMultiPartyDeal(
    companyIds: string[],
    relationType: "many_to_one" | "one_to_many",
  ): Promise<boolean> {
    const { data: existing } = await supabaseAdmin
      .from("multi_party_deals")
      .select("id, flows")
      .contains("participating_company_ids", companyIds)
      .in("status", ["proposed", "partial_approval", "all_approved"])
      .limit(10);

    if (!existing || existing.length === 0) return false;

    return existing.some((row: any) => {
      const flows = Array.isArray(row.flows) ? row.flows : [];
      const flowCount = flows.length;
      if (relationType === "many_to_one") return flowCount >= 2;
      if (relationType === "one_to_many") return flowCount >= 2;
      return true;
    });
  }

  private async createLocalityMultiPartyDeal(params: {
    relationType: "many_to_one" | "one_to_many";
    participatingCompanies: string[];
    flows: Array<{
      seller_company_id: string;
      buyer_company_id: string;
      material_category: string;
      material_subtype: string;
      volume: number;
      price_per_unit: number;
      passport_id?: string | null;
      source_offer_post_id?: string;
    }>;
    title: string;
    description: string;
    visibility?: "local" | "regional" | "public";
  }): Promise<void> {
    const totalAnnualValue =
      params.flows.reduce(
        (sum, f) => sum + Number(f.volume || 0) * Number(f.price_per_unit || 0) * 12,
        0,
      ) || 0;
    const baselineAnnualCost = Math.round(totalAnnualValue * 1.18); // 18% above optimized circular cost baseline
    const optimizedAnnualCost = Math.round(totalAnnualValue);
    const estimatedSavings = Math.max(0, baselineAnnualCost - optimizedAnnualCost);
    const savingsPct =
      baselineAnnualCost > 0
        ? Number(((estimatedSavings / baselineAnnualCost) * 100).toFixed(1))
        : 0;
    const carbonSavings = Math.max(30, Math.round((totalAnnualValue / 1000) * 0.8));

    const valueDistribution: Record<string, number> = {};
    for (const companyId of params.participatingCompanies) {
      valueDistribution[companyId] = Math.round(
        totalAnnualValue / Math.max(1, params.participatingCompanies.length),
      );
    }

    const approvals: Record<string, { approved: boolean }> = {};
    for (const companyId of params.participatingCompanies) {
      approvals[companyId] = { approved: false };
    }

    const { data: deal, error } = await supabaseAdmin
      .from("multi_party_deals")
      .insert({
        participating_company_ids: params.participatingCompanies,
        flows: params.flows as any,
        value_distribution: valueDistribution as any,
        total_annual_value: totalAnnualValue,
        carbon_savings_tons_year: carbonSavings,
        status: "proposed",
        approvals: approvals as any,
        coordination_fee_percentage: 5,
        coordinator_agent_id: this.agentId,
      })
      .select("id")
      .single();

    if (error || !deal?.id) return;

    await supabaseAdmin.from("agent_feed").insert([
      {
        agent_id: this.agentId,
        post_type: "announcement",
        locality: this.locality,
        visibility: params.visibility || "local",
        content: {
          title: params.title,
          description: params.description,
          relation_type: params.relationType,
          multi_party_deal_id: deal.id,
          estimated_value: totalAnnualValue,
          estimated_savings: estimatedSavings,
          financial_estimate: {
            baseline_annual_cost: baselineAnnualCost,
            optimized_annual_cost: optimizedAnnualCost,
            estimated_savings: estimatedSavings,
            savings_percentage: savingsPct,
            currency: "EUR",
          },
          involved_company_ids: params.participatingCompanies,
          carbon_saved: carbonSavings,
        },
      },
      {
        agent_id: this.agentId,
        post_type: "deal_proposal",
        locality: this.locality,
        visibility: params.visibility || "local",
        content: {
          summary: `${params.title} created for ${params.participatingCompanies.length} local companies`,
          relation_type: params.relationType,
          multi_party_deal_id: deal.id,
          involved_company_ids: params.participatingCompanies,
          financial_estimate: {
            baseline_annual_cost: baselineAnnualCost,
            optimized_annual_cost: optimizedAnnualCost,
            estimated_savings: estimatedSavings,
            savings_percentage: savingsPct,
            currency: "EUR",
          },
        },
      },
    ]);
  }

  /**
   * Publishes a compact local digest so local agents can quickly filter actionable matches.
   */
  private async publishLocalAgentAssistDigest(): Promise<number> {
    const { data: localAgents } = await supabaseAdmin
      .from("agents")
      .select("id, company_id, name, locality")
      .eq("agent_type", "local")
      .eq("status", "active");
    const localAgentsInLocality = (localAgents || []).filter((a: any) =>
      this.localitiesMatch(a.locality, this.locality),
    );
    if (localAgentsInLocality.length === 0) return 0;

    const { data: recentFeed } = await supabaseAdmin
      .from("agent_feed")
      .select("id, post_type, content, agent:agent_id(company_id)")
      .eq("is_active", true)
      .in("post_type", ["offer", "request"])
      .order("created_at", { ascending: false })
      .limit(300);
    if (!recentFeed || recentFeed.length === 0) return 0;

    const localFeed = recentFeed.filter((x: any) =>
      this.localitiesMatch(x.locality, this.locality),
    );
    const offers = localFeed.filter((x: any) => x.post_type === "offer");
    const requests = localFeed.filter((x: any) => x.post_type === "request");

    let posted = 0;
    for (const localAgent of localAgentsInLocality) {
      const localCompanyId = localAgent.company_id;

      const topMatches = offers
        .filter((offer: any) => offer.agent?.company_id !== localCompanyId)
        .map((offer: any) => {
          const o = offer.content || {};
          const offerMat = String(
            o.material_category || o.material_subtype || o.material || "",
          ).toLowerCase();
          const matchReq = requests.find((req: any) => {
            if (req.agent?.company_id !== localCompanyId) return false;
            const r = req.content || {};
            const reqMat = String(r.material_category || r.material_subtype || "").toLowerCase();
            return reqMat && (offerMat.includes(reqMat) || reqMat.includes(offerMat));
          });
          return {
            offer_id: offer.id,
            material: o.material_subtype || o.material_category || "unknown",
            volume: Number(o.volume || 0),
            unit: o.unit || "tons",
            price: Number(o.price || 0),
            quality_tier: Number(o.quality_tier || 2),
            match_type: matchReq ? "direct_match" : "open_market",
          };
        })
        .filter((m) => m.volume > 0 && m.price > 0)
        .sort((a, b) => a.price - b.price)
        .slice(0, 5);

      if (topMatches.length === 0) continue;

      await supabaseAdmin.from("agent_feed").insert({
        agent_id: this.agentId,
        post_type: "announcement",
        locality: this.locality,
        visibility: "local",
        content: {
          type: "local_agent_assist",
          local_agent_id: localAgent.id,
          title: `Filtered opportunities for ${localAgent.name}`,
          description:
            "NexaApex ranked locality offers by material match, price, and immediate negotiability.",
          top_matches: topMatches,
          recommendation:
            "Start with direct_match rows first; then open_market rows by lowest price.",
        },
      });
      posted++;
    }

    return posted;
  }

  private async coordinateCrossLocalityMarketplaceDeals(): Promise<number> {
    const { data: feed } = await supabaseAdmin
      .from("agent_feed")
      .select(
        `
        id,
        post_type,
        locality,
        content,
        agent:agent_id(id, name, company_id, agent_type)
      `,
      )
      .eq("is_active", true)
      .in("post_type", ["offer", "request"])
      .order("created_at", { ascending: false })
      .limit(500);

    if (!feed || feed.length === 0) return 0;

    const normalizedThisLocality = this.normalizeLocality(this.locality);
    const offers = feed.filter((p: any) => p.post_type === "offer");
    const requests = feed.filter((p: any) => p.post_type === "request");
    let created = 0;

    for (const localOffer of offers) {
      const offerLocality = this.normalizeLocality(localOffer.locality);
      if (offerLocality !== normalizedThisLocality) continue;

      const offerContent = (localOffer.content || {}) as any;
      const offerMaterial = String(
        offerContent.material_subtype ||
          offerContent.material_category ||
          offerContent.material ||
          "",
      ).toLowerCase();
      const offerVolume = Number(offerContent.volume || 0);
      if (!offerMaterial || offerVolume <= 0) continue;

      const otherLocalityRequests = requests.filter((req: any) => {
        const reqLocality = this.normalizeLocality(req.locality);
        if (!reqLocality || reqLocality === normalizedThisLocality) return false;
        if (req.agent?.company_id === localOffer.agent?.company_id) return false;
          const reqContent = (req.content || {}) as any;
        const reqMaterial = String(
          reqContent.material_subtype || reqContent.material_category || "",
        ).toLowerCase();
        return (
          !!reqMaterial &&
          (reqMaterial.includes(offerMaterial) || offerMaterial.includes(reqMaterial))
        );
      });

      const distinctOtherLocalities = Array.from(
        new Set(otherLocalityRequests.map((r: any) => this.normalizeLocality(r.locality))),
      ).filter((v) => !!v);

      if (distinctOtherLocalities.length === 0) continue;

      const targetLocality = distinctOtherLocalities[0];
      const buyersInTarget = Array.from(
        new Map(
          otherLocalityRequests
            .filter((r: any) => this.normalizeLocality(r.locality) === targetLocality)
            .map((r: any) => [r.agent?.company_id, r]),
        ).values(),
      ).slice(0, 2);

      if (buyersInTarget.length < 2) continue;

      const localSupportOffers = Array.from(
        new Map(
          offers
            .filter((o: any) => {
              if (o.id === localOffer.id) return false;
              if (!this.localitiesMatch(o.locality, this.locality)) return false;
              if (o.agent?.company_id === localOffer.agent?.company_id) return false;
              const oc = (o.content || {}) as any;
              const om = String(
                oc.material_subtype || oc.material_category || oc.material || "",
              ).toLowerCase();
              return (
                !!om &&
                (om.includes(offerMaterial) || offerMaterial.includes(om)) &&
                Number(oc.volume || 0) > 0
              );
            })
            .map((o: any) => [o.agent?.company_id, o]),
        ).values(),
      ).slice(0, 1);

      const participatingCompanies = [
        localOffer.agent?.company_id,
        ...localSupportOffers.map((x: any) => x.agent?.company_id),
        ...buyersInTarget.map((x: any) => x.agent?.company_id),
      ].filter((id: string | undefined) => !!id) as string[];

      const uniqueParticipants = Array.from(new Set(participatingCompanies));
      if (uniqueParticipants.length < 4) continue;
      if (uniqueParticipants.length > 5) {
        uniqueParticipants.splice(5);
      }

      const duplicate = await this.findExistingLocalityMultiPartyDeal(
        uniqueParticipants,
        "many_to_one",
      );
      if (duplicate) continue;

      const basePrice = Number(offerContent.price || 0);
      const transportMarkup = Math.max(5, Math.round(basePrice * 0.06));
      const buyerShare = Math.max(1, Math.floor(offerVolume / buyersInTarget.length));

      const flows: Array<{
        seller_company_id: string;
        buyer_company_id: string;
        material_category: string;
        material_subtype: string;
        volume: number;
        price_per_unit: number;
        passport_id?: string | null;
        source_offer_post_id?: string;
      }> = [];

      const allSellers = [localOffer, ...localSupportOffers];
      for (const buyer of buyersInTarget) {
        for (const seller of allSellers) {
          const sContent = (seller.content || {}) as any;
          const buyerContent = (buyer.content || {}) as any;
          const perFlowVolume = Math.max(1, Math.floor(buyerShare / allSellers.length));
          flows.push({
            seller_company_id: seller.agent.company_id,
            buyer_company_id: buyer.agent.company_id,
            material_category:
              buyerContent.material_category || sContent.material_category || "ferrous-metals",
            material_subtype:
              sContent.material_subtype || sContent.material || "mixed-ferrous",
            volume: perFlowVolume,
            price_per_unit: Number(sContent.price || basePrice) + transportMarkup,
            passport_id: sContent.passport_id || null,
            source_offer_post_id: seller.id,
          });
        }
      }

      await this.createLocalityMultiPartyDeal({
        relationType: "many_to_one",
        participatingCompanies: uniqueParticipants,
        flows,
        title: `Cross-locality multiparty optimization: ${this.locality} to ${targetLocality}`,
        description:
          "NexaApex coordinated suppliers from one locality with multiple buyers in another locality, including pooled logistics and staged allocation.",
        visibility: "regional",
      });

      created++;
      if (created >= 3) break;
    }

    return created;
  }

  private normalizeLocality(value: string | null | undefined): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  private localitiesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
    const left = this.normalizeLocality(a);
    const right = this.normalizeLocality(b);
    if (!left || !right) return false;
    return left === right || left.includes(right) || right.includes(left);
  }

  private materialsCompatible(a: string, b: string): boolean {
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

