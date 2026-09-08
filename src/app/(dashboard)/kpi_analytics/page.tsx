"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/database/supabase";
import { compareToIndustry } from "@/lib/constants/industry-benchmarks";

interface AnalyticsData {
  mci_score: number;
  environmental_kpis: {
    total_carbon_emissions: number;
    carbon_per_revenue: number;
    waste_diversion_rate: number;
    circular_content_percentage: number;
    energy_efficiency: number;

    // NEW
    virgin_emissions: number;
    circular_emissions: number;
  };

  economic_kpis: {
    circular_savings: number;
    waste_to_value: number;
    cost_avoidance: number;
    total_revenue: number;
  };

  industry_comparison: {
    mci_percentile: number;
    carbon_percentile: number;
    waste_percentile: number;
  };
}

export default function AnalyticsPage() {
  const { company } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">(
    "month",
  );

  useEffect(() => {
    if (company) {
      calculateAnalytics();
    }
  }, [company, timeRange]);

  const calculateAnalytics = async () => {
    if (!company) return;

    setLoading(true);
    try {
      // Fetch company data
      const { data: materials } = await supabase
        .from("materials")
        .select("*")
        .eq("company_id", company.id);

      const { data: wasteStreams } = await supabase
        .from("waste_streams")
        .select("*")
        .eq("company_id", company.id);

      const { data: deals } = await supabase
        .from("deals")
        .select("*")
        .or(
          `seller_company_id.eq.${company.id},buyer_company_id.eq.${company.id}`,
        )
        .in("status", ["active", "completed", "approved_both_parties"]);

      const { data: passports } = await supabase
        .from("material_passports")
        .select("*")
        .eq("current_owner_company_id", company.id);

      // Calculate metrics
      const totalMaterialCost =
        materials?.reduce((sum, m) => sum + (m.cost_per_unit || 0), 0) || 0;
      const totalWasteVolume =
        wasteStreams?.reduce((sum, w) => sum + (w.monthly_volume || 0), 0) || 0;
      const totalWasteValue =
        wasteStreams?.reduce((sum, w) => sum + (w.potential_value || 0), 0) ||
        0;
      const totalWasteDisposalCost =
        wasteStreams?.reduce(
          (sum, w) => sum + (w.current_disposal_cost || 0),
          0,
        ) || 0;

      const circularDealsValue =
        deals?.reduce((sum, d) => {
          if (d.buyer_company_id === company.id)
            return sum + (d.total_value || 0);
          return sum;
        }, 0) || 0;

      const circularMaterialVolume =
        deals?.reduce((sum, d) => {
          if (d.buyer_company_id === company.id) return sum + (d.volume || 0);
          return sum;
        }, 0) || 0;

      const totalMaterialVolume =
        materials?.reduce((sum, m) => sum + (m.monthly_volume || 0), 0) || 0;

      // Calculate circular content percentage
      const circular_content_percentage =
        totalMaterialVolume > 0
          ? (circularMaterialVolume / totalMaterialVolume) * 100
          : 0;

      // Calculate waste diversion rate
      const recyclableWaste =
        wasteStreams
          ?.filter((w) => w.classification === "recyclable")
          .reduce((sum, w) => sum + w.monthly_volume, 0) || 0;
      const waste_diversion_rate =
        totalWasteVolume > 0 ? (recyclableWaste / totalWasteVolume) * 100 : 0;

      // Calculate carbon emissions (simplified)
      const virgin_emissions =
        (totalMaterialVolume - circularMaterialVolume) * 2.5; // tons CO2 (avg)
      const circular_emissions = circularMaterialVolume * 0.8; // tons CO2 (avg)
      const total_carbon_emissions = virgin_emissions + circular_emissions;

      // Estimate revenue (simplified - use material costs as proxy)
      const estimated_revenue = totalMaterialCost * 3; // Assume 3x markup
      const carbon_per_revenue =
        estimated_revenue > 0
          ? total_carbon_emissions / (estimated_revenue / 1000) // per 1000
          : 0;

      // Calculate MCI Score (0-100)
      // Formula: weighted average of key circularity metrics
      const mci_score = Math.min(
        100,
        Math.round(
          circular_content_percentage * 0.3 + // 30% weight
            waste_diversion_rate * 0.3 + // 30% weight
            Math.min(
              100,
              (totalWasteValue / Math.max(1, totalWasteDisposalCost)) * 20,
            ) *
              0.2 + // 20% weight (waste-to-value ratio)
            Math.max(0, 100 - carbon_per_revenue) * 0.2, // 20% weight (lower carbon = higher score)
        ),
      );

      // Economic KPIs
      const circular_savings =
        circularDealsValue > 0
          ? totalMaterialCost * 0.15 // Estimate 15% savings
          : 0;

      const waste_to_value = totalWasteValue - totalWasteDisposalCost;

      // Industry comparison
      const wastePercentage =
        totalMaterialVolume > 0
          ? (totalWasteVolume / totalMaterialVolume) * 100
          : 0;

      const industryComparison = compareToIndustry(company.industry, {
        mci_score,
        waste_percentage: wastePercentage,
        carbon_per_revenue,
      });

      setAnalytics({
        mci_score,
        environmental_kpis: {
          total_carbon_emissions,
          carbon_per_revenue,
          waste_diversion_rate,
          circular_content_percentage,
          energy_efficiency: 75,
          virgin_emissions,
          circular_emissions,
        },

        economic_kpis: {
          circular_savings,
          waste_to_value,
          cost_avoidance: circular_savings + waste_to_value,
          total_revenue: estimated_revenue,
        },
        industry_comparison: {
          mci_percentile: industryComparison.mci_percentile,
          carbon_percentile: industryComparison.carbon_percentile,
          waste_percentile: industryComparison.waste_percentile,
        },
      });
    } catch (error) {
      console.error("Error calculating analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & KPIs</h1>
          <p className="mt-2 text-gray-600">
            Track your circular economy performance
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("month")}
            className={`px-4 py-2 rounded-lg font-medium ${
              timeRange === "month"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange("quarter")}
            className={`px-4 py-2 rounded-lg font-medium ${
              timeRange === "quarter"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Quarter
          </button>
          <button
            onClick={() => setTimeRange("year")}
            className={`px-4 py-2 rounded-lg font-medium ${
              timeRange === "year"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* MCI Score - Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold opacity-90">
              Material Circularity Indicator
            </h2>
            <div className="mt-4">
              <div className="text-6xl font-bold">{analytics.mci_score}</div>
              <div className="text-sm opacity-75 mt-2">out of 100</div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              <div className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                {getMCIRating(analytics.mci_score)}
              </div>
              <div className="text-sm opacity-75">
                Top {100 - analytics.industry_comparison.mci_percentile}% in{" "}
                {company?.industry}
              </div>
            </div>
          </div>
          <div className="text-right">
            <MCIGauge score={analytics.mci_score} />
          </div>
        </div>
      </div>

      {/* Environmental KPIs */}
      <div>
        <h2 className="text-2xl font-bold mb-4"> Environmental Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Carbon Emissions"
            value={`${Math.round(analytics.environmental_kpis.total_carbon_emissions)} t`}
            subtitle={`${analytics.environmental_kpis.carbon_per_revenue.toFixed(1)} kg/1000 revenue`}
            trend="down"
            trendValue="12%"
            color="green"
          />
          <KPICard
            title="Waste Diversion"
            value={`${analytics.environmental_kpis.waste_diversion_rate.toFixed(1)}%`}
            subtitle="of waste recycled/recovered"
            trend="up"
            trendValue="8%"
            color="blue"
          />
          <KPICard
            title="Circular Content"
            value={`${analytics.environmental_kpis.circular_content_percentage.toFixed(1)}%`}
            subtitle="of materials from circular sources"
            trend="up"
            trendValue="15%"
            color="purple"
          />
          <KPICard
            title="Energy Efficiency"
            value={`${analytics.environmental_kpis.energy_efficiency}%`}
            subtitle="efficiency rating"
            trend="up"
            trendValue="5%"
            color="orange"
          />
        </div>
      </div>

      {/* Economic KPIs */}
      <div>
        <h2 className="text-2xl font-bold mb-4"> Economic Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Circular Savings"
            value={`${analytics.economic_kpis.circular_savings.toLocaleString()}`}
            subtitle="saved through circular sourcing"
            trend="up"
            trendValue="2.3k"
            color="green"
          />
          <KPICard
            title="Waste-to-Value"
            value={`${analytics.economic_kpis.waste_to_value.toLocaleString()}`}
            subtitle="from selling waste materials"
            trend="up"
            trendValue="1.8k"
            color="blue"
          />
          <KPICard
            title="Cost Avoidance"
            value={`${analytics.economic_kpis.cost_avoidance.toLocaleString()}`}
            subtitle="total financial benefit"
            trend="up"
            trendValue="4.1k"
            color="purple"
          />
          <KPICard
            title="Revenue Impact"
            value={`${((analytics.economic_kpis.cost_avoidance / analytics.economic_kpis.total_revenue) * 100).toFixed(2)}%`}
            subtitle="of total revenue"
            trend="up"
            trendValue="0.3%"
            color="orange"
          />
        </div>
      </div>

      {/* Industry Comparison */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6"> Industry Benchmarking</h2>
        <div className="space-y-6">
          <BenchmarkBar
            label="MCI Score"
            value={analytics.industry_comparison.mci_percentile}
            industry={company?.industry || "Industry"}
            color="blue"
          />
          <BenchmarkBar
            label="Carbon Intensity"
            value={analytics.industry_comparison.carbon_percentile}
            industry={company?.industry || "Industry"}
            color="green"
          />
          <BenchmarkBar
            label="Waste Management"
            value={analytics.industry_comparison.waste_percentile}
            industry={company?.industry || "Industry"}
            color="purple"
          />
        </div>
      </div>

      {/* Carbon Breakdown Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">
           Carbon Footprint Breakdown
        </h2>
        <CarbonBreakdownChart
          virginEmissions={
            analytics.environmental_kpis.total_carbon_emissions * 0.7
          }
          circularEmissions={
            analytics.environmental_kpis.total_carbon_emissions * 0.3
          }
        />
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-green-900 mb-4">
           Recommendations to Improve MCI
        </h2>
        <ul className="space-y-3">
          {analytics.environmental_kpis.circular_content_percentage < 30 && (
            <li className="flex items-start gap-3">
              <span className="text-green-600 text-xl"></span>
              <div>
                <p className="font-medium text-green-900">
                  Increase Circular Material Sourcing
                </p>
                <p className="text-sm text-green-700">
                  Your circular content is at{" "}
                  {analytics.environmental_kpis.circular_content_percentage.toFixed(
                    1,
                  )}
                  %. Target: 50%+. Check the Circular Opportunities page for
                  available materials.
                </p>
              </div>
            </li>
          )}
          {analytics.environmental_kpis.waste_diversion_rate < 70 && (
            <li className="flex items-start gap-3">
              <span className="text-green-600 text-xl"></span>
              <div>
                <p className="font-medium text-green-900">
                  Improve Waste Diversion
                </p>
                <p className="text-sm text-green-700">
                  Current diversion:{" "}
                  {analytics.environmental_kpis.waste_diversion_rate.toFixed(1)}
                  %. Target: 90%+. List more waste streams on Nexus to find
                  buyers.
                </p>
              </div>
            </li>
          )}
          {analytics.economic_kpis.waste_to_value < 1000 && (
            <li className="flex items-start gap-3">
              <span className="text-green-600 text-xl"></span>
              <div>
                <p className="font-medium text-green-900">
                  Monetize Waste Streams
                </p>
                <p className="text-sm text-green-700">
                  You're only capturing 
                  {analytics.economic_kpis.waste_to_value.toLocaleString()} in
                  waste value. Activate your Nexa agent to automatically find
                  buyers.
                </p>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

// Helper Components

function MCIGauge({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-40 h-40">
      <svg className="w-40 h-40 transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="12"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="white"
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
    </div>
  );
}

function getMCIRating(score: number): string {
  if (score >= 80) return " Excellent";
  if (score >= 60) return " Good";
  if (score >= 40) return " Fair";
  return " Needs Improvement";
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  trend?: "up" | "down";
  trendValue?: string;
  color: "green" | "blue" | "purple" | "orange";
}

function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color,
}: KPICardProps) {
  const colorClasses = {
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    purple: "bg-purple-50 border-purple-200",
    orange: "bg-orange-50 border-orange-200",
  };

  const textColorClasses = {
    green: "text-green-900",
    blue: "text-blue-900",
    purple: "text-purple-900",
    orange: "text-orange-900",
  };

  return (
    <div className={`border rounded-lg p-5 ${colorClasses[color]}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {trend && trendValue && (
          <span
            className={`text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
          >
            {trend === "up" ? "" : ""} {trendValue}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold ${textColorClasses[color]} mb-1`}>
        {value}
      </div>
      <p className="text-xs text-gray-600">{subtitle}</p>
    </div>
  );
}

function BenchmarkBar({
  label,
  value,
  industry,
  color,
}: {
  label: string;
  value: number;
  industry: string;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {value}th percentile in {industry}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>Bottom 25%</span>
        <span>Median</span>
        <span>Top 25%</span>
      </div>
    </div>
  );
}

function CarbonBreakdownChart({
  virginEmissions,
  circularEmissions,
}: {
  virginEmissions: number;
  circularEmissions: number;
}) {
  const total = virginEmissions + circularEmissions;
  const virginPercent = (virginEmissions / total) * 100;
  const circularPercent = (circularEmissions / total) * 100;

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Virgin Materials
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(virginEmissions)} tons CO
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-8">
            <div
              className="bg-red-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ width: `${virginPercent}%` }}
            >
              {virginPercent.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Circular Materials
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(circularEmissions)} tons CO
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-8">
            <div
              className="bg-green-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ width: `${circularPercent}%` }}
            >
              {circularPercent.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-blue-900">
          <strong>Potential Savings:</strong> If you increased circular content
          to 50%, you could save approximately{" "}
          <strong>{Math.round(virginEmissions * 0.5 * 0.68)} tons CO</strong>{" "}
          annually (equivalent to planting{" "}
          {Math.round((virginEmissions * 0.5 * 0.68) / 21)} trees).
        </p>
      </div>
    </div>
  );
}

