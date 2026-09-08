"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/database/supabase";
import Link from "next/link";

export default function RecyclerDashboard() {
  const { company } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    active_buy_requests: 0,
    active_offers: 0,
    pending_purchases: 0,
    processing_utilization: 0,
    agent_status: "active" as "active" | "paused",
  });

  useEffect(() => {
    loadData();
  }, [company]);

  const loadData = async () => {
    if (!company) return;

    // Load recycler profile
    const { data: profileData } = await supabase
      .from("recycler_profiles")
      .select("*")
      .eq("company_id", company.id)
      .single();

    setProfile(profileData as any);

    // Load feed posts (buy requests)
    const { data: agent } = await supabase
      .from("agents")
      .select("id, status")
      .eq("company_id", company.id)
      .single<{ id: string; status: "active" | "paused" }>();

    if (agent && agent.id) {
      const { count: buyRequestsCount } = await supabase
        .from("agent_feed")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agent.id)
        .eq("post_type", "request")
        .eq("is_active", true);

      const { count: offersCount } = await supabase
        .from("agent_feed")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agent.id)
        .eq("post_type", "offer")
        .eq("is_active", true);

      const { count: dealsCount } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .eq("buyer_company_id", company.id)
        .eq("status", "pending_buyer_approval");

      setStats({
        active_buy_requests: buyRequestsCount || 0,
        active_offers: offersCount || 0,
        pending_purchases: dealsCount || 0,
        processing_utilization:
          (profileData as any)?.current_utilization_percentage || 0,
        agent_status: agent.status,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
             Recycler Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            {company?.name} - Waste Processing Operations
          </p>
        </div>
        <div
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            stats.agent_status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              stats.agent_status === "active" ? "bg-green-500" : "bg-yellow-500"
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
          title="Active Buy Requests"
          value={stats.active_buy_requests}
          icon=""
          color="blue"
        />
        <MetricCard
          title="Materials for Sale"
          value={stats.active_offers}
          icon=""
          color="green"
        />
        <MetricCard
          title="Pending Purchases"
          value={stats.pending_purchases}
          icon=""
          color="yellow"
          highlight={stats.pending_purchases > 0}
        />
        <MetricCard
          title="Capacity Utilization"
          value={`${stats.processing_utilization}%`}
          icon=""
          color="purple"
        />
      </div>

      {/* Processing Capacity */}
      {profile && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Processing Capacity</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {profile.processing_capacity_tons_month} tons/month
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Available Capacity</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round(
                  profile.processing_capacity_tons_month *
                    (1 - stats.processing_utilization / 100),
                )}{" "}
                tons/month
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Accepted Materials</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {profile.accepted_material_categories.map((cat: string) => (
                  <span
                    key={cat}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Capacity Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Utilization</span>
              <span>{stats.processing_utilization}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  stats.processing_utilization > 80
                    ? "bg-red-500"
                    : stats.processing_utilization > 60
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${stats.processing_utilization}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nexus Feed */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                 Nexus Feed
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                Global marketplace - see all waste streams
              </p>
            </div>
            <span className="text-3xl"></span>
          </div>
          <div className="space-y-2">
            <Link
              href="/nexus"
              className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium"
            >
              Open Nexus
            </Link>
            <Link
              href="/nexus?view=buy-requests"
              className="block w-full px-4 py-2 bg-white border border-green-600 text-green-700 rounded-lg hover:bg-green-50 text-center font-medium"
            >
              My Buy Requests
            </Link>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                 Pending Approvals
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                {stats.pending_purchases} purchase
                {stats.pending_purchases !== 1 ? "s" : ""} awaiting your review
              </p>
            </div>
            <span className="text-3xl"></span>
          </div>
          <Link
            href="/deals/pending"
            className="block w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-center font-medium"
          >
            Review Deals
          </Link>
        </div>

        {/* Inventory Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2"> Inventory</h3>
          <p className="text-sm text-gray-600 mb-4">
            Manage processed materials available for sale
          </p>
          <div className="space-y-2">
            <Link
              href="/inventory"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
            >
              View Inventory
            </Link>
            <Link
              href="/inventory/add"
              className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium"
            >
              Add to Inventory
            </Link>
          </div>
        </div>

        {/* Processing KPIs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2"> Performance</h3>
          <p className="text-sm text-gray-600 mb-4">
            Track processing efficiency and throughput
          </p>
          <Link
            href="/analytics/recycler"
            className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center font-medium"
          >
            View KPIs
          </Link>
        </div>
      </div>

      {/* NexaPrime Info */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
               Your NexaPrime Agent
            </h2>
            <p className="text-sm text-gray-700 mb-3">
              NexaPrime scans ALL localities globally for waste streams matching
              your criteria.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white rounded p-3">
                <p className="text-gray-600">Service Area</p>
                <p className="font-semibold capitalize">
                  {profile?.geographic_service_area || "Regional"}
                </p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-gray-600">Min Pickup</p>
                <p className="font-semibold">
                  {profile?.min_pickup_volume_tons || 5} tons
                </p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-gray-600">Max Contamination</p>
                <p className="font-semibold">
                  {profile?.max_contamination_tolerance || 10}%
                </p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-gray-600">Processing Methods</p>
                <p className="font-semibold">
                  {profile?.processing_methods?.length || 0} methods
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/agent/settings"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium inline-block"
              >
                 Configure NexaPrime
              </Link>
            </div>
          </div>
          <div className="ml-6 text-right">
            <div className="text-5xl mb-2"></div>
            <div className="text-sm text-gray-600">NexaPrime</div>
            <div className="text-xs text-gray-500">Recycler</div>
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


