"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/database/supabase";

export default function CreatedDealsPage() {
  const { company, loading: authLoading } = useAuth();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      loadCreatedDeals();
    }
  }, [company, authLoading]);

  const loadCreatedDeals = async () => {
    if (!company?.id) {
      setDeals([]);
      setLoading(false);
      setErrorText("No active company context found.");
      return;
    }

    setLoading(true);
    setErrorText(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/deals/created", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch created deals");
      setDeals(data.deals || []);
    } catch (error: any) {
      setDeals([]);
      setErrorText(error?.message || "Failed to fetch created deals");
    } finally {
      setLoading(false);
    }
  };

  const approveDeal = async (dealId: string) => {
    if (!confirm("Approve this deal?")) return;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/deals/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ deal_id: dealId, action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");
      alert(data.message || "Deal approved.");
      await loadCreatedDeals();
    } catch (error: any) {
      alert(error?.message || "Failed to approve");
    }
  };

  const rejectDeal = async (dealId: string) => {
    if (!confirm("Reject this deal?")) return;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/deals/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ deal_id: dealId, action: "reject" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject");
      alert(data.message || "Deal rejected.");
      await loadCreatedDeals();
    } catch (error: any) {
      alert(error?.message || "Failed to reject");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Created Deals</h1>
        <p className="mt-2 text-gray-600">
          Deals created by manual buy or by agent negotiation rounds.
        </p>
      </div>

      {deals.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500">No created deals found</p>
          {errorText && <p className="text-xs text-red-600 mt-2">{errorText}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => {
            const canAct =
              (deal.status === "pending_seller_approval" &&
                deal.seller_company_id === company?.id) ||
              (deal.status === "pending_buyer_approval" &&
                deal.buyer_company_id === company?.id);

            return (
              <div key={deal.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {deal.volume} {deal.unit} {deal.material_category}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Seller: {deal.seller_company?.name} | Buyer: {deal.buyer_company?.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Price: EUR {deal.price_per_unit}/{deal.unit} | Total: EUR{" "}
                      {Number(deal.total_value || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Status: {deal.status} | Created type: {deal.created_type}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {deal.agent_reasoning || "No reasoning provided."}
                    </p>
                  </div>
                </div>

                {canAct && (
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => approveDeal(deal.id)}
                      className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectDeal(deal.id)}
                      className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

