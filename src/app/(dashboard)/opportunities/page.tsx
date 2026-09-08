"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/database/supabase";
import { useRouter } from "next/navigation";
import { getMaterialProperties } from "@/lib/constants/material-database";
import { calculateCircularSavings } from "@/lib/calculations/economic-kpis";
import { calculateCarbonSavings } from "@/lib/calculations/environmental-kpis";

interface CircularOpportunity {
  id: string;
  material_category: string;
  material_type: string;
  current_source: "virgin" | "circular";
  current_volume: number;
  current_cost: number;

  // Circular alternative
  circular_source?: {
    type: "nexus_offer" | "market_potential";
    post_id?: string;
    supplier?: string;
    volume: number;
    price: number;
    quality_tier: number;
    distance?: number;
  };

  // Calculated savings
  savings: {
    cost_savings: number;
    carbon_savings: number;
    savings_percentage: number;
    recommendation: string;
  };
}

export default function OpportunitiesPage() {
  const router = useRouter();
  const { company } = useAuth();
  const [opportunities, setOpportunities] = useState<CircularOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<CircularOpportunity | null>(
    null,
  );
  const [showWhatIf, setShowWhatIf] = useState(false);

  useEffect(() => {
    if (company) {
      findOpportunities();
    }
  }, [company]);

  const findOpportunities = async () => {
    if (!company) return;

    setLoading(true);
    try {
      // Get current material requirements
      const { data: materials } = await supabase
        .from("materials")
        .select("*")
        .eq("company_id", company.id)
        .eq("category", "input");

      if (!materials || materials.length === 0) {
        setOpportunities([]);
        setLoading(false);
        return;
      }

      const foundOpportunities: CircularOpportunity[] = [];

      for (const material of materials) {
        // Step 1: Search Nexus for live offers
        const { data: nexusOffers } = await supabase
          .from("agent_feed")
          .select(
            `
            *,
            agent:agent_id (
              id,
              name,
              company_id
            )
          `,
          )
          .eq("post_type", "offer")
          .eq("is_active", true)
          .contains("content", {
            material_category: material.material_category,
          });

        // Step 2: For each material, create opportunity
        const materialProps = getMaterialProperties(material.material_type);

        if (nexusOffers && nexusOffers.length > 0) {
          // REAL OFFER from Nexus
          for (const offer of nexusOffers.slice(0, 3)) {
            // Top 3 offers
            const offerContent = offer.content as {
              material_subtype?: string;
              material?: string;
              volume: number;
              price: number;
              quality_tier?: number;
            } | null;

            // Skip if offerContent is null or not an object
            if (!offerContent || typeof offerContent !== "object") continue;

            // Get supplier company name
            const { data: supplierCompany } = await supabase
              .from("companies")
              .select("name")
              .eq("id", offer.agent.company_id)
              .single();

            // Calculate savings
            const savings = calculateCircularSavings({
              virgin_material: {
                type: material.material_type,
                volume: material.monthly_volume,
                cost_per_unit: material.cost_per_unit ?? 0,
              },
              circular_alternative: {
                type: offerContent.material_subtype || offerContent.material || material.material_type,
                volume: Math.min(offerContent.volume, material.monthly_volume),
                cost_per_unit: offerContent.price,
                quality_tier: offerContent.quality_tier || 2,
              },
            });

            const carbonSavings = calculateCarbonSavings({
              virgin_material: {
                type: material.material_type,
                volume: material.monthly_volume,
              },
              circular_material: {
                type: offerContent.material_subtype || offerContent.material || material.material_type,
                volume: Math.min(offerContent.volume, material.monthly_volume),
              },
            });

            foundOpportunities.push({
              id: `${material.id}-${offer.id}`,
              material_category: material.material_category || "Unknown",
              material_type: material.material_type,
              current_source: "virgin",
              current_volume: material.monthly_volume,
              current_cost:
                (material.cost_per_unit || 0) * material.monthly_volume,
              circular_source: {
                type: "nexus_offer",
                post_id: offer.id,
                supplier: supplierCompany?.name || "Unknown",
                volume: offerContent.volume,
                price: offerContent.price,
                quality_tier: offerContent.quality_tier || 2,
                distance: 50, // Placeholder
              },
              savings: {
                cost_savings: savings.cost_savings,
                carbon_savings: carbonSavings.savings,
                savings_percentage: savings.savings_percentage,
                recommendation: savings.recommendation,
              },
            });
          }
        } else if (materialProps) {
          // POTENTIAL OPPORTUNITY (market-based)
          const marketPrice = materialProps.market_price.average * 0.8; // 20% discount for circular

          const savings = calculateCircularSavings({
            virgin_material: {
              type: material.material_type,
              volume: material.monthly_volume,
              cost_per_unit: material.cost_per_unit ?? 0,
            },
            circular_alternative: {
              type: material.material_type,
              volume: material.monthly_volume,
              cost_per_unit: marketPrice,
              quality_tier: 2,
            },
          });

          const carbonSavings = calculateCarbonSavings({
            virgin_material: {
              type: material.material_type,
              volume: material.monthly_volume,
            },
            circular_material: {
              type: material.material_type,
              volume: material.monthly_volume,
            },
          });

          foundOpportunities.push({
            id: `${material.id}-potential`,
            material_category: material.material_category || "Unknown",
            material_type: material.material_type,
            current_source: "virgin",
            current_volume: material.monthly_volume,
            current_cost:
              (material.cost_per_unit || 0) * material.monthly_volume,
            circular_source: {
              type: "market_potential",
              volume: material.monthly_volume,
              price: marketPrice,
              quality_tier: 2,
            },
            savings: {
              cost_savings: savings.cost_savings,
              carbon_savings: carbonSavings.savings,
              savings_percentage: savings.savings_percentage,
              recommendation: savings.recommendation,
            },
          });
        }
      }

      // Sort by savings (highest first)
      foundOpportunities.sort(
        (a, b) => b.savings.cost_savings - a.savings.cost_savings,
      );

      setOpportunities(foundOpportunities);
    } catch (error) {
      console.error("Error finding opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const startNegotiation = async (opportunity: CircularOpportunity) => {
    const offerPostId = opportunity.circular_source?.post_id;
    if (!offerPostId) {
      alert("This opportunity does not have a live offer to negotiate.");
      return;
    }

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/agents/deals/propose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ offer_post_id: offerPostId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start negotiation");

      alert(data.message || "Deal created and sent for approval.");
      router.push("/deals/created");
    } catch (error: any) {
      alert(error?.message || "Failed to start negotiation");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
             Circular Opportunities
          </h1>
          <p className="mt-2 text-gray-600">
            Discover cost savings and carbon reductions through circular
            materials
          </p>
        </div>
        <button
          onClick={() => setShowWhatIf(true)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
        >
           What-If Simulator
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Total Potential Savings
          </h3>
          <div className="text-3xl font-bold text-green-900">
            
            {opportunities
              .reduce((sum, opp) => sum + opp.savings.cost_savings, 0)
              .toLocaleString()}
          </div>
          <p className="text-xs text-gray-600 mt-1">per month</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Carbon Reduction
          </h3>
          <div className="text-3xl font-bold text-blue-900">
            {opportunities
              .reduce((sum, opp) => sum + opp.savings.carbon_savings, 0)
              .toFixed(1)}{" "}
            t
          </div>
          <p className="text-xs text-gray-600 mt-1">CO per month</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Opportunities Found
          </h3>
          <div className="text-3xl font-bold text-purple-900">
            {opportunities.length}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {
              opportunities.filter(
                (o) => o.circular_source?.type === "nexus_offer",
              ).length
            }{" "}
            live offers
          </p>
        </div>
      </div>

      {/* Opportunities List */}
      {opportunities.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">
            No opportunities found yet
          </p>
          <p className="text-sm text-gray-400">
            Add material requirements and activate your Nexa agent to discover
            circular alternatives
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onViewDetails={() => setSelectedOpp(opp)}
              onStartNegotiation={() => startNegotiation(opp)}
            />
          ))}
        </div>
      )}

      {/* What-If Simulator Modal */}
      {showWhatIf && (
        <WhatIfSimulator
          onClose={() => setShowWhatIf(false)}
          currentOpportunities={opportunities}
        />
      )}

      {/* Opportunity Details Modal */}
      {selectedOpp && (
        <OpportunityDetailsModal
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
        />
      )}
    </div>
  );
}

// Opportunity Card Component
function OpportunityCard({
  opportunity,
  onViewDetails,
  onStartNegotiation,
}: {
  opportunity: CircularOpportunity;
  onViewDetails: () => void;
  onStartNegotiation: () => void;
}) {
  const isLiveOffer = opportunity.circular_source?.type === "nexus_offer";

  const getRecommendationColor = (rec: string) => {
    if (rec === "highly_recommended")
      return "bg-green-100 text-green-700 border-green-300";
    if (rec === "recommended")
      return "bg-blue-100 text-blue-700 border-blue-300";
    if (rec === "consider")
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xl font-semibold text-gray-900">
              {opportunity.material_type}
            </h3>
            {isLiveOffer ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                 Live Offer
              </span>
            ) : (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                 Market Potential
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRecommendationColor(opportunity.savings.recommendation)}`}
            >
              {opportunity.savings.recommendation
                .replace("_", " ")
                .toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Cost</p>
              <p className="text-lg font-semibold text-gray-900">
                
                {(
                  opportunity.current_cost / opportunity.current_volume
                ).toFixed(2)}
                /ton
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Circular Price</p>
              <p className="text-lg font-semibold text-green-600">
                {opportunity.circular_source?.price.toFixed(2)}/ton
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Monthly Savings</p>
              <p className="text-lg font-semibold text-green-600">
                {opportunity.savings.cost_savings.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">CO Reduction</p>
              <p className="text-lg font-semibold text-blue-600">
                {opportunity.savings.carbon_savings.toFixed(1)} tons
              </p>
            </div>
          </div>

          {isLiveOffer && opportunity.circular_source && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Supplier:</strong>{" "}
                {opportunity.circular_source.supplier} 
                <strong className="ml-2">Available:</strong>{" "}
                {opportunity.circular_source.volume} tons 
                <strong className="ml-2">Quality:</strong> Tier{" "}
                {opportunity.circular_source.quality_tier}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onViewDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              View Details
            </button>
            {isLiveOffer && (
              <button
                onClick={onStartNegotiation}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
              >
                Start Negotiation
              </button>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold text-green-600">
            {opportunity.savings.savings_percentage.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-600">savings</p>
        </div>
      </div>
    </div>
  );
}

// Opportunity Details Modal
function OpportunityDetailsModal({
  opportunity,
  onClose,
}: {
  opportunity: CircularOpportunity;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Opportunity Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Comparison Table */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Current vs. Circular</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2">Metric</th>
                  <th className="text-right py-2">Current (Virgin)</th>
                  <th className="text-right py-2">Circular Alternative</th>
                  <th className="text-right py-2">Difference</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-200">
                  <td className="py-3">Price per ton</td>
                  <td className="text-right">
                    
                    {(
                      opportunity.current_cost / opportunity.current_volume
                    ).toFixed(2)}
                  </td>
                  <td className="text-right text-green-600">
                    {opportunity.circular_source?.price.toFixed(2)}
                  </td>
                  <td className="text-right font-semibold text-green-600">
                    -
                    {(
                      opportunity.current_cost / opportunity.current_volume -
                      (opportunity.circular_source?.price || 0)
                    ).toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3">Monthly cost</td>
                  <td className="text-right">
                    {opportunity.current_cost.toLocaleString()}
                  </td>
                  <td className="text-right text-green-600">
                    
                    {(
                      (opportunity.circular_source?.price || 0) *
                      opportunity.current_volume
                    ).toLocaleString()}
                  </td>
                  <td className="text-right font-semibold text-green-600">
                    -{opportunity.savings.cost_savings.toLocaleString()}
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3">CO emissions (tons)</td>
                  <td className="text-right">
                    {(opportunity.current_volume * 2.5).toFixed(1)}
                  </td>
                  <td className="text-right text-blue-600">
                    {(opportunity.current_volume * 0.8).toFixed(1)}
                  </td>
                  <td className="text-right font-semibold text-blue-600">
                    -{opportunity.savings.carbon_savings.toFixed(1)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3">Quality tier</td>
                  <td className="text-right">Tier 1</td>
                  <td className="text-right">
                    Tier {opportunity.circular_source?.quality_tier}
                  </td>
                  <td className="text-right text-gray-600">
                    {opportunity.circular_source?.quality_tier === 1
                      ? "Same"
                      : "Slight degradation"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Annual Impact */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Annual Cost Savings
              </h4>
              <div className="text-3xl font-bold text-green-900">
                {(opportunity.savings.cost_savings * 12).toLocaleString()}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Annual Carbon Reduction
              </h4>
              <div className="text-3xl font-bold text-blue-900">
                {(opportunity.savings.carbon_savings * 12).toFixed(1)} tons
              </div>
              <p className="text-xs text-gray-600 mt-1">
                = planting{" "}
                {Math.round((opportunity.savings.carbon_savings * 12) / 21)}{" "}
                trees
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Close
            </button>
            {opportunity.circular_source?.type === "nexus_offer" && (
              <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Contact Supplier
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// What-If Simulator Component
function WhatIfSimulator({
  onClose,
  currentOpportunities,
}: {
  onClose: () => void;
  currentOpportunities: CircularOpportunity[];
}) {
  const [scenario, setScenario] = useState({
    circular_adoption_percentage: 50,
    quality_tier_acceptance: 2,
    max_distance_km: 100,
  });

  const [projectedImpact, setProjectedImpact] = useState({
    cost_savings: 0,
    carbon_savings: 0,
    mci_improvement: 0,
  });

  useEffect(() => {
    calculateProjectedImpact();
  }, [scenario]);

  const calculateProjectedImpact = () => {
    // Filter opportunities based on scenario constraints
    const eligibleOpps = currentOpportunities.filter((opp) => {
      if (!opp.circular_source) return false;
      if (opp.circular_source.quality_tier > scenario.quality_tier_acceptance)
        return false;
      if (
        opp.circular_source.distance &&
        opp.circular_source.distance > scenario.max_distance_km
      )
        return false;
      return true;
    });

    // Calculate impact based on adoption percentage
    const adoptionFactor = scenario.circular_adoption_percentage / 100;

    const totalCostSavings = eligibleOpps.reduce(
      (sum, opp) => sum + opp.savings.cost_savings * adoptionFactor,
      0,
    );

    const totalCarbonSavings = eligibleOpps.reduce(
      (sum, opp) => sum + opp.savings.carbon_savings * adoptionFactor,
      0,
    );

    // Estimate MCI improvement (simplified)
    const mciImprovement = (scenario.circular_adoption_percentage / 100) * 30; // Up to 30 point improvement

    setProjectedImpact({
      cost_savings: totalCostSavings,
      carbon_savings: totalCarbonSavings,
      mci_improvement: mciImprovement,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                 What-If Simulator
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Model different scenarios for circular material adoption
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Scenario Controls */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Scenario Parameters</h3>

            <div className="space-y-6">
              {/* Adoption Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Circular Material Adoption:{" "}
                  {scenario.circular_adoption_percentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={scenario.circular_adoption_percentage}
                  onChange={(e) =>
                    setScenario({
                      ...scenario,
                      circular_adoption_percentage: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Quality Tier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Quality Tier Accepted: Tier{" "}
                  {scenario.quality_tier_acceptance}
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={scenario.quality_tier_acceptance}
                  onChange={(e) =>
                    setScenario({
                      ...scenario,
                      quality_tier_acceptance: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Tier 1 (Premium)</span>
                  <span>Tier 2</span>
                  <span>Tier 3</span>
                  <span>Tier 4 (Lower)</span>
                </div>
              </div>

              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Distance: {scenario.max_distance_km} km
                </label>
                <input
                  type="range"
                  min="25"
                  max="500"
                  step="25"
                  value={scenario.max_distance_km}
                  onChange={(e) =>
                    setScenario({
                      ...scenario,
                      max_distance_km: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>25 km</span>
                  <span>250 km</span>
                  <span>500 km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Projected Impact */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Projected Annual Impact
            </h3>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cost Savings</p>
                <div className="text-3xl font-bold text-green-900">
                  {(projectedImpact.cost_savings * 12).toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 mt-1">per year</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Carbon Reduction</p>
                <div className="text-3xl font-bold text-blue-900">
                  {(projectedImpact.carbon_savings * 12).toFixed(0)} t
                </div>
                <p className="text-xs text-gray-600 mt-1">CO per year</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">MCI Improvement</p>
                <div className="text-3xl font-bold text-purple-900">
                  +{projectedImpact.mci_improvement.toFixed(0)}
                </div>
                <p className="text-xs text-gray-600 mt-1">points</p>
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Scenario Comparison</h3>
            <div className="space-y-4">
              <ScenarioBar label="Current State" percentage={0} color="gray" />
              <ScenarioBar
                label="Your Scenario"
                percentage={scenario.circular_adoption_percentage}
                color="blue"
              />
              <ScenarioBar
                label="Industry Leader (80%)"
                percentage={80}
                color="green"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Close
            </button>
            <button className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
              Generate Action Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioBar({
  label,
  percentage,
  color,
}: {
  label: string;
  percentage: number;
  color: string;
}) {
  const colorClasses = {
    gray: "bg-gray-400",
    blue: "bg-blue-600",
    green: "bg-green-600",
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className={`h-4 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

