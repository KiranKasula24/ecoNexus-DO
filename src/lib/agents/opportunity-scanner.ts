/**
 * OPPORTUNITY SCANNER
 * Scans Nexus feed and scores opportunities for agents
 */

import { supabase } from "@/lib/database/supabase";
import { getMaterialProperties } from "@/lib/constants/material-database";

export interface OpportunityScore {
  post_id: string;
  agent_id: string;
  post_type: "offer" | "request";
  material_category: string;
  material_subtype?: string;
  volume: number;
  unit: string;
  price: number;
  quality_tier?: number;
  distance?: number;
  score: number; // 0-100
  reasoning: string;
  thread_root_id?: string;
}

export class OpportunityScanner {
  private agentId: string;
  private locality: string;
  private constraints: any;

  constructor(agentId: string, locality: string, constraints?: any) {
    this.agentId = agentId;
    this.locality = locality;
    this.constraints = constraints || {};
  }

  /**
   * Scan feed for opportunities
   */
  async scanFeed(): Promise<OpportunityScore[]> {
    // Get posts from local feed
    const { data: posts } = await supabase
      .from("agent_feed")
      .select("*")
      .eq("locality", this.locality)
      .eq("is_active", true)
      .in("post_type", ["offer", "request"])
      .neq("agent_id", this.agentId) // Don't respond to own posts
      .order("created_at", { ascending: false })
      .limit(50);

    if (!posts || posts.length === 0) return [];

    // Score each opportunity
    const opportunities: OpportunityScore[] = [];

    for (const post of posts) {
      const score = await this.scoreOpportunity(post);
      if (score) {
        opportunities.push(score);
      }
    }

    // Sort by score (highest first)
    return opportunities.sort((a, b) => b.score - a.score);
  }

  /**
   * Score a single opportunity
   */
  private async scoreOpportunity(post: any): Promise<OpportunityScore | null> {
    const content = post.content;

    // Extract key data
    const materialKey =
      content.material_id ||
      content.sku ||
      content.material_subtype ||
      content.material_category ||
      content.material ||
      "";
    const material_category =
      content.material_category || content.material || materialKey;
    const material_subtype =
      content.material_subtype || content.material || materialKey;
    const volume = content.volume || content.volume_needed || 0;
    const price = content.price || content.max_price || 0;
    const quality_tier = content.quality_tier || content.quality_tier_max || 2;

    if (!material_category || volume === 0) return null;

    // Get material properties for reference (SKU-aware via material-database fallback)
    const materialProps =
      getMaterialProperties(materialKey) ||
      getMaterialProperties(material_subtype) ||
      getMaterialProperties(material_category);
    if (!materialProps) return null;

    // Initialize score
    let score = 0;
    const reasons: string[] = [];

    // FACTOR 1: Material Match (0-30 points)
    if (this.constraints.material_categories?.includes(material_category)) {
      score += 30;
      reasons.push("Material category matches preferences");
    } else {
      score += 15; // Partial credit for any material
    }

    // FACTOR 2: Price Attractiveness (0-35 points)
    const marketPrice = materialProps.market_price.average || 1;

    if (post.post_type === "offer") {
      // Buying: Lower price is better
      const priceDiff = (marketPrice - price) / marketPrice;
      if (priceDiff > 0.2) {
        score += 35; // 20%+ below market
        reasons.push("Excellent price (>20% below market)");
      } else if (priceDiff > 0.1) {
        score += 25; // 10-20% below market
        reasons.push("Good price (10-20% below market)");
      } else if (priceDiff > 0) {
        score += 15; // Below market
        reasons.push("Fair price (below market)");
      } else {
        score += 5; // At or above market
      }
    } else {
      // Selling: Higher price is better
      const priceDiff = (price - marketPrice) / marketPrice;
      if (priceDiff > 0.2) {
        score += 35; // 20%+ above market
        reasons.push("Excellent offer (>20% above market)");
      } else if (priceDiff > 0.1) {
        score += 25; // 10-20% above market
        reasons.push("Good offer (10-20% above market)");
      } else if (priceDiff > 0) {
        score += 15; // Above market
        reasons.push("Fair offer (above market)");
      } else {
        score += 5; // At or below market
      }
    }

    // FACTOR 3: Quality (0-25 points)
    const clampedTier = Math.min(4, Math.max(1, Number(quality_tier) || 2));
    const qualityScore = (5 - clampedTier) * 6.25; // Tier 1 = 25pts, Tier 4 = 6.25pts
    score += qualityScore;
    if (clampedTier === 1) {
      reasons.push("Premium quality (Tier 1)");
    } else if (clampedTier === 2) {
      reasons.push("Good quality (Tier 2)");
    }

    // FACTOR 4: Volume Suitability (0-20 points)
    const minVolume = this.constraints.min_volume || 0;
    const maxVolume = this.constraints.max_volume || 999999;

    if (volume >= minVolume && volume <= maxVolume) {
      score += 20;
      reasons.push("Volume matches requirements");
    } else if (volume >= minVolume * 0.8 && volume <= maxVolume * 1.2) {
      score += 10; // Close enough
      reasons.push("Volume acceptable");
    } else {
      score += 0;
      reasons.push("Volume outside preferred range");
    }

    // FACTOR 5: Distance (0-10 points) - Placeholder
    // TODO: Calculate actual distance using company locations
    const distance = 25; // km placeholder
    if (distance < 50) {
      score += 10;
      reasons.push("Close proximity");
    } else if (distance < 100) {
      score += 5;
    }

    // FACTOR 6: Contamination (adjust score)
    const contamination = content.contamination_level || 0;
    const maxContamination = this.constraints.max_contamination_tolerance || 15;

    if (contamination > maxContamination) {
      score -= 20; // Penalty for high contamination
      reasons.push("High contamination level");
    }

    // FACTOR 7: Processability + market demand (bonus points)
    const processability = content.processability_score || 0;
    if (processability > 80) {
      score += 5;
      reasons.push("High processability");
    }
    if (materialProps.demand_level === "high") {
      score += 4;
      reasons.push("Strong demand profile");
    }

    // Cap score at 100
    score = Math.min(score, 100);

    return {
      post_id: post.id,
      agent_id: post.agent_id,
      post_type: post.post_type,
      material_category,
      material_subtype,
      volume,
      unit: content.unit || "tons",
      price,
      quality_tier,
      distance,
      score: Math.round(score),
      reasoning: reasons.join("; "),
      thread_root_id: post.thread_root_id || post.id,
    };
  }

  /**
   * Filter opportunities by material category
   */
  filterByMaterial(
    opportunities: OpportunityScore[],
    materialCategory: string,
  ): OpportunityScore[] {
    return opportunities.filter((opp) =>
      opp.material_category
        .toLowerCase()
        .includes(materialCategory.toLowerCase()),
    );
  }

  /**
   * Filter opportunities by minimum score
   */
  filterByScore(
    opportunities: OpportunityScore[],
    minScore: number,
  ): OpportunityScore[] {
    return opportunities.filter((opp) => opp.score >= minScore);
  }

  /**
   * Get top N opportunities
   */
  getTopOpportunities(
    opportunities: OpportunityScore[],
    count: number,
  ): OpportunityScore[] {
    return opportunities.slice(0, count);
  }
}
