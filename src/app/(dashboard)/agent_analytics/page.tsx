"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface KPIs {
  // Environmental
  mci_score: number;
  landfill_diversion_percentage: number;
  total_carbon_emissions: number;
  carbon_emissions_avoided: number;
  total_waste_generated: number;
  total_waste_recycled: number;
  recycling_rate: number;

  // Financial
  disposal_cost: number;
  circular_revenue: number;
  net_circular_value: number;
  cost_savings: number;
  average_deal_value: number;
  material_recovery_value: number;

  // Agent Performance
  deals_pending: number;
  deals_active: number;
  deals_completed: number;
  agent_opportunities_scanned: number;
  agent_value_generated: number;
}

export default function DashboardPage() {
  const { company, user } = useAuth();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningCycle, setRunningCycle] = useState(false);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const res = await fetch("/api/analytics/kpis");
      const data = await res.json();
      if (res.ok) {
        setKpis(data.kpis);
      }
    } catch (err) {
      console.error("Failed to fetch KPIs:", err);
    } finally {
      setLoading(false);
    }
  };

  const runAgentCycle = async () => {
    try {
      setRunningCycle(true);
      const res = await fetch("/api/agents/run-cycle", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(
          `Agent cycle completed! ${data.stats.agentsRun} agents ran successfully.`,
        );
        fetchKPIs(); // Refresh KPIs
      }
    } catch (err) {
      console.error("Failed to run agent cycle:", err);
      alert("Failed to run agent cycle");
    } finally {
      setRunningCycle(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {company?.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            Your circular economy dashboard and AI agent control center
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/materials/flow/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add Material Flow
          </Link>
          <button
            onClick={runAgentCycle}
            disabled={runningCycle}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {runningCycle ? "Running..." : " Run Agent Cycle"}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <Link
          href="/deals/pending"
          className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 hover:border-orange-400 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">
                Pending Deals
              </p>
              <p className="text-2xl font-bold text-orange-900">
                {kpis?.deals_pending || 0}
              </p>
            </div>
            <div className="text-3xl"></div>
          </div>
          <p className="text-xs text-orange-600 mt-2">Awaiting your approval</p>
        </Link>

        <Link
          href="/nexus"
          className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 hover:border-purple-400 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Nexus Feed</p>
              <p className="text-2xl font-bold text-purple-900">Live</p>
            </div>
            <div className="text-3xl"></div>
          </div>
          <p className="text-xs text-purple-600 mt-2">Agent negotiations</p>
        </Link>

        <Link
          href="/passports"
          className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 hover:border-blue-400 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Digital Passports
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {kpis?.deals_active || 0}
              </p>
            </div>
            <div className="text-3xl"></div>
          </div>
          <p className="text-xs text-blue-600 mt-2">Active materials</p>
        </Link>

        <Link
          href="/agent/settings"
          className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:border-gray-400 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Agent Settings
              </p>
              <p className="text-2xl font-bold text-gray-900">Configure</p>
            </div>
            <div className="text-3xl"></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">Tune your agent</p>
        </Link>
      </div>

      {/* Environmental KPIs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span></span> Environmental Impact
          </h2>
        </div>
        <div className="p-6 grid grid-cols-4 gap-6">
          {/* MCI Score */}
          <div>
            <p className="text-sm font-medium text-gray-600">
              Material Circularity Indicator
            </p>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-bold text-green-600">
                {kpis?.mci_score?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${kpis?.mci_score || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Industry avg: 35%</p>
          </div>

          {/* Landfill Diversion */}
          <div>
            <p className="text-sm font-medium text-gray-600">
              Landfill Diversion Rate
            </p>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-bold text-blue-600">
                {kpis?.landfill_diversion_percentage?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${kpis?.landfill_diversion_percentage || 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis?.total_waste_recycled?.toFixed(1) || 0} /{" "}
              {kpis?.total_waste_generated?.toFixed(1) || 0} tons recycled
            </p>
          </div>

          {/* Carbon Emissions */}
          <div>
            <p className="text-sm font-medium text-gray-600">
              Carbon Emissions
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold text-red-600">
                {(kpis?.total_carbon_emissions || 0).toFixed(1)}
              </p>
              <span className="text-sm text-gray-500">tons CO</span>
            </div>
            <p className="text-xs text-green-600 mt-2">
               {(kpis?.carbon_emissions_avoided || 0).toFixed(1)} tons avoided
            </p>
            <p className="text-xs text-gray-500">through circularity</p>
          </div>

          {/* Recycling Rate */}
          <div>
            <p className="text-sm font-medium text-gray-600">Recycling Rate</p>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-bold text-purple-600">
                {kpis?.recycling_rate?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${kpis?.recycling_rate || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">by material type</p>
          </div>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span></span> Financial Performance
          </h2>
        </div>
        <div className="p-6 grid grid-cols-4 gap-6">
          {/* Net Circular Value */}
          <div>
            <p className="text-sm font-medium text-gray-600">
              Net Circular Value
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              <p className="text-3xl font-bold text-green-600">
                {(kpis?.net_circular_value || 0).toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">Revenue minus costs</p>
          </div>

          {/* Disposal Cost Savings */}
          <div>
            <p className="text-sm font-medium text-gray-600">
              Disposal Cost Savings
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              <p className="text-3xl font-bold text-blue-600">
                {(kpis?.cost_savings || 0).toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              vs. current disposal: 
              {(kpis?.disposal_cost || 0).toLocaleString()}/mo
            </p>
          </div>

          {/* Circular Revenue */}
          <div>
            <p className="text-sm font-medium text-gray-600">
              Circular Revenue
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              <p className="text-3xl font-bold text-purple-600">
                {(kpis?.circular_revenue || 0).toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              from {kpis?.deals_completed || 0} completed deals
            </p>
          </div>

          {/* Average Deal Value */}
          <div>
            <p className="text-sm font-medium text-gray-600">Avg. Deal Value</p>
            <div className="mt-2 flex items-baseline gap-1">
              <p className="text-3xl font-bold text-orange-600">
                {(kpis?.average_deal_value || 0).toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">per transaction</p>
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span></span> Your Agent Performance
          </h2>
        </div>
        <div className="p-6 grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Opportunities Scanned
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {kpis?.agent_opportunities_scanned || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">in last 30 days</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">
              Total Value Generated
            </p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {(kpis?.agent_value_generated || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              through agent negotiations
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600">Deal Pipeline</p>
            <div className="mt-2 flex gap-4">
              <div>
                <p className="text-lg font-semibold text-orange-600">
                  {kpis?.deals_pending || 0}
                </p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-600">
                  {kpis?.deals_active || 0}
                </p>
                <p className="text-xs text-gray-500">Active</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-green-600">
                  {kpis?.deals_completed || 0}
                </p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity (placeholder) */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <p className="text-gray-500 text-center py-8">
            Your agent's recent negotiations and deals will appear here
          </p>
        </div>
      </div>
    </div>
  );
}


