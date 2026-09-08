"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ManufacturerDashboard from "@/components/dashboards/ManufacturerDashboard";
import RecyclerDashboard from "@/components/dashboards/RecyclerDashboard";
import ProcessorDashboard from "@/components/dashboards/ProcessorDashboard";
import LogisticsDashboard from "@/components/dashboards/LogisticsDashboard";

export default function DashboardPage() {
  const { company, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [company, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Route to appropriate dashboard based on entity type
  const renderDashboard = () => {
    switch (company?.entity_type) {
      case "manufacturer":
        return <ManufacturerDashboard />;
      case "recycler":
        return <RecyclerDashboard />;
      case "energy_recovery":
        return <ProcessorDashboard />;
      case "logistics":
        return <LogisticsDashboard />;
      default:
        return <div>Unknown entity type</div>;
    }
  };

  return <div>{renderDashboard()}</div>;
}
