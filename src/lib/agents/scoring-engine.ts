/**
 * SCORING ENGINE
 * Advanced scoring logic for deals and negotiations
 */

import { getMaterialProperties } from "@/lib/constants/material-database";

export interface DealScore {
  total_score: number; // 0-100
  breakdown: {
    price_score: number;
    quality_score: number;
    volume_score: number;
    sustainability_score: number;
    risk_score: number;
  };
  recommendation:
    | "highly_recommended"
    | "recommended"
    | "consider"
    | "not_recommended";
  reasoning: string[];
}

export class ScoringEngine {
  /**
   * Score a deal based on multiple factors
   */
  static scoreDeal(params: {
    material_category: string;
    material_subtype?: string;
    material_id?: string;
    volume: number;
    price: number;
    quality_tier: number;
    carbon_footprint?: number;
    distance?: number;
    supplier_reliability?: number;
  }): DealScore {
    const breakdown = {
      price_score: 0,
      quality_score: 0,
      volume_score: 0,
      sustainability_score: 0,
      risk_score: 0,
    };

    const reasoning: string[] = [];

    // Get material reference data
    const materialProps =
      getMaterialProperties(params.material_id || "") ||
      getMaterialProperties(params.material_subtype || "") ||
      getMaterialProperties(params.material_category);
    const marketPrice = materialProps?.market_price?.average || 100;

    // PRICE SCORE (35% weight)
    const priceDiff = ((marketPrice - params.price) / marketPrice) * 100;
    if (priceDiff > 20) {
      breakdown.price_score = 35;
      reasoning.push("Excellent price: >20% below market");
    } else if (priceDiff > 10) {
      breakdown.price_score = 28;
      reasoning.push("Good price: 10-20% below market");
    } else if (priceDiff > 0) {
      breakdown.price_score = 20;
      reasoning.push("Fair price: below market average");
    } else if (priceDiff > -10) {
      breakdown.price_score = 12;
      reasoning.push("Price at market average");
    } else {
      breakdown.price_score = 5;
      reasoning.push("Price above market average");
    }

    // QUALITY SCORE (25% weight)
    const normalizedTier = Math.min(4, Math.max(1, params.quality_tier || 2));
    const qualityScore = (5 - normalizedTier) * 6.25;
    breakdown.quality_score = qualityScore;
    if (normalizedTier === 1) {
      reasoning.push("Premium quality (Tier 1)");
    } else if (normalizedTier === 2) {
      reasoning.push("Good quality (Tier 2)");
    } else if (normalizedTier === 3) {
      reasoning.push("Acceptable quality (Tier 3)");
    } else {
      reasoning.push("Lower quality (Tier 4)");
    }

    // VOLUME SCORE (20% weight)
    // Prefer volumes between 10-100 tons for efficiency
    if (params.volume >= 10 && params.volume <= 100) {
      breakdown.volume_score = 20;
      reasoning.push("Optimal volume for processing");
    } else if (params.volume >= 5 && params.volume <= 200) {
      breakdown.volume_score = 15;
      reasoning.push("Acceptable volume");
    } else if (params.volume < 5) {
      breakdown.volume_score = 8;
      reasoning.push("Small volume - may have higher per-unit costs");
    } else {
      breakdown.volume_score = 12;
      reasoning.push("Large volume - requires significant capacity");
    }

    // SUSTAINABILITY SCORE (10% weight)
    if (params.carbon_footprint) {
      const virginEmissions =
        materialProps?.carbon_footprint?.virgin_production || 2000;
      const recycledEmissions =
        materialProps?.carbon_footprint?.recycling || 800;
      const savingsPercent =
        ((virginEmissions - recycledEmissions) / virginEmissions) * 100;

      if (savingsPercent > 60) {
        breakdown.sustainability_score = 10;
        reasoning.push(`High carbon savings: ${Math.round(savingsPercent)}%`);
      } else if (savingsPercent > 40) {
        breakdown.sustainability_score = 7;
        reasoning.push(`Good carbon savings: ${Math.round(savingsPercent)}%`);
      } else {
        breakdown.sustainability_score = 4;
        reasoning.push(
          `Moderate carbon savings: ${Math.round(savingsPercent)}%`,
        );
      }
    } else {
      breakdown.sustainability_score = 5; // Default
    }

    // RISK SCORE (10% weight)
    let riskScore = 10;

    // Distance risk
    if (params.distance && params.distance > 500) {
      riskScore -= 3;
      reasoning.push("Long distance increases logistics risk");
    }

    // Quality risk
    if (normalizedTier >= 3) {
      riskScore -= 2;
      reasoning.push("Lower quality tier increases processing risk");
    }

    // Supplier reliability
    if (params.supplier_reliability && params.supplier_reliability < 70) {
      riskScore -= 3;
      reasoning.push("Supplier has lower reliability score");
    }

    breakdown.risk_score = Math.max(riskScore, 0);

    // TOTAL SCORE
    const total_score = Math.round(
      breakdown.price_score +
        breakdown.quality_score +
        breakdown.volume_score +
        breakdown.sustainability_score +
        breakdown.risk_score,
    );

    // RECOMMENDATION
    let recommendation: DealScore["recommendation"];
    if (total_score >= 80) {
      recommendation = "highly_recommended";
    } else if (total_score >= 65) {
      recommendation = "recommended";
    } else if (total_score >= 50) {
      recommendation = "consider";
    } else {
      recommendation = "not_recommended";
    }

    return {
      total_score,
      breakdown,
      recommendation,
      reasoning,
    };
  }

  /**
   * Calculate counter-offer price
   */
  static calculateCounterOffer(params: {
    original_price: number;
    target_price: number;
    round: number; // 1, 2, or 3
    max_rounds: number;
  }): number {
    const gap = params.target_price - params.original_price;

    // Progressive closing: move more toward target each round
    const percentToClose = 0.33 + (params.round / params.max_rounds) * 0.34; // 33%  67%

    const counterOffer = params.original_price + gap * percentToClose;

    // Add small randomness (3%) for human-like behavior
    const randomFactor = 0.97 + Math.random() * 0.06;

    return Math.round(counterOffer * randomFactor * 100) / 100;
  }

  /**
   * Determine if deal should be proposed
   */
  static shouldProposeDeal(params: {
    seller_price: number;
    buyer_price: number;
    market_price: number;
    round: number;
  }): boolean {
    const gap = Math.abs(params.seller_price - params.buyer_price);
    const gapPercent = (gap / params.market_price) * 100;

    // Propose deal if:
    // 1. Gap is less than 5% of market price, OR
    // 2. We're at round 3 and gap is less than 10%
    if (gapPercent < 5) return true;
    if (params.round >= 3 && gapPercent < 10) return true;

    return false;
  }
}

