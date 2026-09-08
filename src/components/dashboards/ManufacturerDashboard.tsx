"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/database/supabase";
import Link from "next/link";

export default function ManufacturerDashboard() {
  const { company } = useAuth();
  const [stats, setStats] = useState({
    materials: 0,
    waste_streams: 0,
    passports: 0,
    pending_deals: 0,
    agent_status: "paused" as "active" | "paused",
  });
  const [agentCycleRunning, setAgentCycleRunning] = useState(false);
  const [cycleResult, setCycleResult] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, [company]);

  const loadStats = async () => {
    if (!company) return;

    // Get materials count
    const { count: materialsCount } = await supabase
      .from("materials")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company.id);

    // Get waste streams count
    const { count: wasteCount } = await supabase
      .from("waste_streams")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company.id);

    // Get passports count
    const { count: passportsCount } = await supabase
      .from("material_passports")
      .select("*", { count: "exact", head: true })
      .eq("current_owner_company_id", company.id);

    // Get pending deals count
    const { count: dealsCount } = await supabase
      .from("deals")
      .select("*", { count: "exact", head: true })
      .or(
        `seller_company_id.eq.${company.id},buyer_company_id.eq.${company.id}`,
      )
      .in("status", ["pending_seller_approval", "pending_buyer_approval"]);

    // Get agent status
    const { data: agent } = await supabase
      .from("agents")
      .select("status")
      .eq("company_id", company.id)
      .single<{ status: "active" | "paused" }>();

    setStats({
      materials: materialsCount || 0,
      waste_streams: wasteCount || 0,
      passports: passportsCount || 0,
      pending_deals: dealsCount || 0,
      agent_status: agent?.status || "paused",
    });
  };

  const runAgentCycle = async () => {
    setAgentCycleRunning(true);
    setCycleResult(null);

    try {
      const res = await fetch("/api/agents/run-cycle", { method: "POST" });
      const data = await res.json();
      setCycleResult(data);
      await loadStats(); // Refresh stats
    } catch (error) {
      console.error("Agent cycle failed:", error);
      setCycleResult({ success: false, error: "Failed to run agent cycle" });
    } finally {
      setAgentCycleRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manufacturing Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            {company?.name} - Circular Economy Intelligence
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              stats.agent_status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                stats.agent_status === "active"
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            ></div>
            <span className="text-sm font-medium">
              Nexa: {stats.agent_status === "active" ? "Active" : "Paused"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Materials Tracked"
          value={stats.materials}
          icon=""
          link="/materials/requirements"
        />
        <StatCard
          title="Waste Streams"
          value={stats.waste_streams}
          icon=""
          link="/analytics"
        />
        <StatCard
          title="Digital Passports"
          value={stats.passports}
          icon=""
          link="/passports"
        />
        <StatCard
          title="Pending Deals"
          value={stats.pending_deals}
          icon=""
          link="/deals/pending"
          highlight={stats.pending_deals > 0}
        />
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Requirements */}
        <ActionCard
          title=" Material Requirements"
          description="Define what materials you need for production"
          actions={[
            {
              label: "Add Requirements",
              href: "/materials/requirements",
              primary: true,
            },
            { label: "Upload Invoice", href: "/materials/upload" },
          ]}
        />

        {/* Circular Opportunities */}
        <ActionCard
          title=" Circular Opportunities"
          description="Discover cost savings through circular materials"
          actions={[
            {
              label: "View Opportunities",
              href: "/opportunities",
              primary: true,
            },
            {
              label: "Run Simulation",
              href: "/opportunities/simulate",
            },
          ]}
        />

        {/* Nexus Feed */}
        <ActionCard
          title=" Nexus (Agent Marketplace)"
          description="See live negotiations and deals"
          actions={[
            { label: "Open Nexus", href: "/nexus", primary: true },
            { label: "My Negotiations", href: "/nexus?filter=my" },
          ]}
        />

        {/* Analytics & KPIs */}
        <ActionCard
          title=" Analytics & KPIs"
          description="Track environmental and economic performance"
          actions={[
            {
              label: "View Dashboard",
              href: "/analytics",
              primary: true,
            },
            { label: "Generate Report", href: "/analytics/report" },
          ]}
        />
      </div>

      {/* Nexa Agent Control */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
               Your Nexa Agent
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              Nexa continuously scans Nexus for circular opportunities and
              negotiates on your behalf.
            </p>

            {stats.agent_status === "paused" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="text-sm text-yellow-800">
                   Your agent is paused. Complete material input to activate
                  autonomous negotiations.
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={runAgentCycle}
                disabled={agentCycleRunning}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {agentCycleRunning ? "Running..." : " Run Agent Cycle"}
              </button>
              <Link
                href="/agent/settings"
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                 Configure Nexa
              </Link>
            </div>

            {cycleResult && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  cycleResult.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <p className="text-sm font-medium mb-2">
                  {cycleResult.success
                    ? " Cycle Complete"
                    : " Cycle Failed"}
                </p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(cycleResult.stats, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="ml-6 text-right">
            <div className="text-3xl mb-2"></div>
            <div className="text-sm text-gray-600">
              Nexa-{company?.name?.slice(0, 15)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickLink
            href="/materials/requirements"
            label="Add Materials"
            icon=""
          />
          <QuickLink
            href="/materials/upload"
            label="Upload Invoice"
            icon=""
          />
          <QuickLink href="/nexus" label="Open Nexus" icon="" />
          <QuickLink
            href="/deals/pending"
            label="Approve Deals"
            icon=""
          />
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon, link, highlight = false }: any) {
  return (
    <Link href={link}>
      <div
        className={`bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
          highlight ? "ring-2 ring-blue-500" : ""
        }`}
      >
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">{icon}</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {title}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {value}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ActionCard({ title, description, actions }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <div className="flex space-x-3">
        {actions.map((action: any, idx: number) => (
          <Link
            key={idx}
            href={action.href}
            className={`px-4 py-2 rounded-lg font-medium ${
              action.primary
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function QuickLink({ href, label, icon }: any) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-sm text-gray-700 text-center">{label}</span>
    </Link>
  );
}


