"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/database/supabase";
import Link from "next/link";

interface ProcessorProfile {
  processing_capacity_tons_month: number;
  current_utilization_percentage: number;
  input_materials: string[];
  output_materials: string[];
  processing_services: string[];
  value_share_model?: string;
}

export default function ProcessorDashboard() {
  const { company } = useAuth();
  const [profile, setProfile] = useState<ProcessorProfile | null>(null);
  const [stats, setStats] = useState({
    active_service_offers: 0,
    pending_jobs: 0,
    processing_jobs: 0,
    capacity_available: 0,
    agent_status: "active" as "active" | "paused",
  });

  useEffect(() => {
    loadData();
  }, [company]);

  const loadData = async () => {
    if (!company) return;

    // Load processor profile
    const { data: profileData } = (await supabase
      .from("processor_profiles")
      .select("*")
      .eq("company_id", company.id)
      .single()) as { data: ProcessorProfile | null };

    setProfile(profileData);

    // Load agent and posts
    const { data: agent } = (await supabase
      .from("agents")
      .select("id, status")
      .eq("company_id", company.id)
      .single()) as { data: { id: string; status: string } | null };

    if (agent) {
      const { count: offersCount } = await supabase
        .from("agent_feed")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agent.id)
        .eq("post_type", "offer")
        .eq("is_active", true);

      const { count: pendingCount } = await supabase
        .from("deals")
        .select("*", { count: "exact", head: true })
        .or(
          `seller_company_id.eq.${company.id},buyer_company_id.eq.${company.id}`,
        )
        .in("status", ["pending_seller_approval", "pending_buyer_approval"]);

      const capacityAvailable = Math.round(
        (profileData?.processing_capacity_tons_month || 0) *
          (1 - (profileData?.current_utilization_percentage || 0) / 100),
      );

      setStats({
        active_service_offers: offersCount || 0,
        pending_jobs: pendingCount || 0,
        processing_jobs: 0, // TODO: track active jobs
        capacity_available: capacityAvailable,
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
             Processor Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            {company?.name} - By-Product Processing Services
          </p>
        </div>
        <div
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            stats.agent_status === "active"
              ? "bg-purple-100 text-purple-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              stats.agent_status === "active"
                ? "bg-purple-500"
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
          title="Service Offers"
          value={stats.active_service_offers}
          icon=""
          color="purple"
        />
        <MetricCard
          title="Pending Jobs"
          value={stats.pending_jobs}
          icon=""
          color="yellow"
          highlight={stats.pending_jobs > 0}
        />
        <MetricCard
          title="Processing"
          value={stats.processing_jobs}
          icon=""
          color="blue"
        />
        <MetricCard
          title="Available Capacity"
          value={`${stats.capacity_available}t`}
          icon=""
          color="green"
        />
      </div>

      {/* Processing Capabilities */}
      {profile && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Processing Capabilities
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Input Materials</p>
              <div className="flex flex-wrap gap-1">
                {profile.input_materials.map((material: string) => (
                  <span
                    key={material}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {material.replace("-", " ")}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Output Materials</p>
              <div className="flex flex-wrap gap-1">
                {profile.output_materials.map((material: string) => (
                  <span
                    key={material}
                    className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {material.replace("-", " ")}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Services</p>
              <div className="flex flex-wrap gap-1">
                {profile.processing_services.map((service: string) => (
                  <span
                    key={service}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                  >
                    {service.replace("-", " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Capacity Utilization */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Monthly Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {profile.processing_capacity_tons_month} tons
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Current Utilization</p>
              <div className="flex items-end space-x-3">
                <p className="text-2xl font-bold text-gray-900">
                  {profile.current_utilization_percentage}%
                </p>
                <div className="flex-1 mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        profile.current_utilization_percentage > 80
                          ? "bg-red-500"
                          : profile.current_utilization_percentage > 60
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${profile.current_utilization_percentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nexus Feed */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                 Nexus Feed
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                Find by-products that need processing
              </p>
            </div>
            <span className="text-3xl"></span>
          </div>
          <div className="space-y-2">
            <Link
              href="/nexus"
              className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-center font-medium"
            >
              Browse Opportunities
            </Link>
            <Link
              href="/nexus?view=my-offers"
              className="block w-full px-4 py-2 bg-white border border-purple-600 text-purple-700 rounded-lg hover:bg-purple-50 text-center font-medium"
            >
              My Service Offers
            </Link>
          </div>
        </div>

        {/* Job Management */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900"> Jobs</h3>
              <p className="text-sm text-gray-700 mt-1">
                {stats.pending_jobs} pending  {stats.processing_jobs} in
                progress
              </p>
            </div>
            <span className="text-3xl"></span>
          </div>
          <div className="space-y-2">
            <Link
              href="/jobs/pending"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
            >
              Review Pending
            </Link>
            <Link
              href="/jobs/active"
              className="block w-full px-4 py-2 bg-white border border-blue-600 text-blue-700 rounded-lg hover:bg-blue-50 text-center font-medium"
            >
              Active Jobs
            </Link>
          </div>
        </div>

        {/* Pricing Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2"> Pricing</h3>
          <p className="text-sm text-gray-600 mb-4">
            Revenue Model:{" "}
            <span className="font-semibold capitalize">
              {profile?.value_share_model?.replace("_", " ")}
            </span>
          </p>
          <Link
            href="/pricing"
            className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium"
          >
            Manage Pricing
          </Link>
        </div>

        {/* Analytics */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2"> Analytics</h3>
          <p className="text-sm text-gray-600 mb-4">
            Track throughput, efficiency, and revenue
          </p>
          <Link
            href="/analytics/processor"
            className="block w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center font-medium"
          >
            View Performance
          </Link>
        </div>
      </div>

      {/* NexaPrime Info */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
               Your NexaPrime Agent
            </h2>
            <p className="text-sm text-gray-700 mb-3">
              NexaPrime finds by-products needing transformation and coordinates
              three-way deals.
            </p>
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-sm mb-2">
                How NexaPrime Works for Processors:
              </h4>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Scans Nexus for by-products matching your inputs</li>
                <li>Finds buyers interested in your outputs</li>
                <li>Coordinates supplier  you  buyer deals</li>
                <li>Proposes processing jobs for your approval</li>
              </ol>
            </div>
            <Link
              href="/agent/settings"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium inline-block"
            >
               Configure NexaPrime
            </Link>
          </div>
          <div className="ml-6 text-right">
            <div className="text-5xl mb-2"></div>
            <div className="text-sm text-gray-600">NexaPrime</div>
            <div className="text-xs text-gray-500">Processor</div>
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


