"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/database/supabase";
import Link from "next/link";

export default function LogisticsDashboard() {
  const { company } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    active_routes: 0,
    available_capacity: 0,
    consolidation_opportunities: 0,
    pending_requests: 0,
    agent_status: "active" as "active" | "paused",
  });

  useEffect(() => {
    loadData();
  }, [company]);

  const loadData = async () => {
    if (!company) return;

    // Load logistics profile
    const { data: profileData } = (await supabase
      .from("logistics_profiles")
      .select("*")
      .eq("company_id", company.id)
      .single()) as { data: any };

    setProfile(profileData);

    // Load agent
    const { data: agent } = (await supabase
      .from("agents")
      .select("id, status")
      .eq("company_id", company.id)
      .single()) as { data: { id: string; status: string } | null };

    if (agent && agent.id) {
      const { count: routesCount } = await supabase
        .from("agent_feed")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agent.id)
        .eq("post_type", "offer")
        .eq("is_active", true);

      const { count: requestsCount } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .or(
          `seller_company_id.eq.${company.id},buyer_company_id.eq.${company.id}`,
        )
        .in("status", ["pending_seller_approval", "pending_buyer_approval"]);

      setStats({
        active_routes: routesCount || 0,
        available_capacity: profileData?.available_capacity_tons_week || 0,
        consolidation_opportunities: 0, // TODO: calculate from matching routes
        pending_requests: requestsCount || 0,
        agent_status: agent.status as "active" | "paused",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
             Logistics Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            {company?.name} - Route Optimization & Coordination
          </p>
        </div>
        <div
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            stats.agent_status === "active"
              ? "bg-orange-100 text-orange-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              stats.agent_status === "active"
                ? "bg-orange-500"
                : "bg-yellow-500"
            }`}
          ></div>
          <span className="text-sm font-medium">
            NexaPrime: {stats.agent_status === "active" ? "Active" : "Paused"}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Routes"
          value={stats.active_routes}
          icon=""
          color="blue"
        />
        <MetricCard
          title="Available Capacity"
          value={`${stats.available_capacity}t`}
          icon=""
          color="green"
        />
        <MetricCard
          title="Consolidation Opps"
          value={stats.consolidation_opportunities}
          icon=""
          color="purple"
        />
        <MetricCard
          title="Pending Requests"
          value={stats.pending_requests}
          icon=""
          color="yellow"
          highlight={stats.pending_requests > 0}
        />
      </div>

      {/* Fleet Overview */}
      {profile && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Fleet Overview</h2>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Trucks</p>
              <p className="text-2xl font-bold text-gray-900">
                {profile.fleet_capacity?.trucks || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {profile.fleet_capacity?.total_capacity_tons || 0} tons
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Max Distance</p>
              <p className="text-2xl font-bold text-gray-900">
                {profile.max_distance_km} km
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Optimization</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {profile.optimization_priority}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Vehicle Types</p>
              <div className="flex flex-wrap gap-1">
                {profile.vehicle_types.map((type: string) => (
                  <span
                    key={type}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {type.replace("-", " ")}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Service Regions</p>
              <div className="flex flex-wrap gap-1">
                {profile.service_regions.map((region: string) => (
                  <span
                    key={region}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full capitalize"
                  >
                    {region.replace("-", " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nexus Feed */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                 Nexus Feed
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                Monitor transportation requests
              </p>
            </div>
            <span className="text-3xl"></span>
          </div>
          <div className="space-y-2">
            <Link
              href="/nexus?filter=transport"
              className="block w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-center font-medium"
            >
              View Requests
            </Link>
            <Link
              href="/nexus?view=my-routes"
              className="block w-full px-4 py-2 bg-white border border-orange-600 text-orange-700 rounded-lg hover:bg-orange-50 text-center font-medium"
            >
              My Route Offers
            </Link>
          </div>
        </div>

        {/* Route Optimization */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                 Optimization
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                {stats.consolidation_opportunities} consolidation opportunities
              </p>
            </div>
            <span className="text-3xl"></span>
          </div>
          <Link
            href="/routes/optimize"
            className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center font-medium"
          >
            Optimize Routes
          </Link>
        </div>

        {/* Active Routes */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2"> Active Routes</h3>
          <p className="text-sm text-gray-600 mb-4">
            {stats.active_routes} routes scheduled
          </p>
          <div className="space-y-2">
            <Link
              href="/routes/active"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
            >
              View Routes
            </Link>
            <Link
              href="/routes/plan"
              className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium"
            >
              Plan New Route
            </Link>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2"> Performance</h3>
          <p className="text-sm text-gray-600 mb-4">
            Track efficiency, costs, and carbon
          </p>
          <Link
            href="/analytics/logistics"
            className="block w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center font-medium"
          >
            View Analytics
          </Link>
        </div>
      </div>

      {/* NexaPrime Info */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
               Your NexaPrime Agent
            </h2>
            <p className="text-sm text-gray-700 mb-3">
              NexaPrime intelligently matches transportation requests and
              identifies consolidation opportunities.
            </p>
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-sm mb-2">
                Smart Coordination Features:
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>
                  <strong>Many-to-One:</strong> Consolidate pickups from
                  multiple suppliers to one destination
                </li>
                <li>
                  <strong>One-to-Many:</strong> Split deliveries to multiple
                  buyers on one route
                </li>
                <li>
                  <strong>Backhaul Optimization:</strong> Find return loads to
                  reduce empty miles
                </li>
                <li>
                  <strong>Route Optimization:</strong> Minimize costs, time, or
                  carbon based on your priority
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-white rounded p-3">
                <p className="text-gray-600">Base Rate</p>
                <p className="font-semibold">
                  {profile?.base_rate_per_ton_km || 0.15}/ton-km
                </p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-gray-600">Min Load</p>
                <p className="font-semibold">
                  {profile?.minimum_load_tons || 5} tons
                </p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-gray-600">Consolidation Discount</p>
                <p className="font-semibold">
                  {profile?.consolidation_discount_percentage || 15}%
                </p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-gray-600">Accepts Backhaul</p>
                <p className="font-semibold">
                  {profile?.accepts_backhaul ? "Yes" : "No"}
                </p>
              </div>
            </div>
            <Link
              href="/agent/settings"
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium inline-block"
            >
               Configure NexaPrime
            </Link>
          </div>
          <div className="ml-6 text-right">
            <div className="text-5xl mb-2"></div>
            <div className="text-sm text-gray-600">NexaPrime</div>
            <div className="text-xs text-gray-500">Logistics</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, color, highlight = false }: any) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
    purple: "bg-purple-50 border-purple-200",
    orange: "bg-orange-50 border-orange-200",
  };

  return (
    <div
      className={`border rounded-lg p-5 ${colorClasses[color as keyof typeof colorClasses]} ${
        highlight ? "ring-2 ring-yellow-500" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}


