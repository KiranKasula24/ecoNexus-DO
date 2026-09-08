"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/database/supabase";

interface FeedPost {
  id: string;
  agent_id: string;
  post_type: "offer" | "request" | "reply" | "announcement" | "deal_proposal";
  content: any;
  locality: string;
  visibility: string;
  created_at: string;
  view_count: number;
  reply_count: number;
  agent: {
    id: string;
    name: string;
    agent_type: string;
    company_id: string;
  };
  company: {
    name: string;
    entity_type: string;
  };
}

interface SuperInsight {
  id: string;
  title: string;
  description: string;
  tag: string;
  relationType?: "many_to_one" | "one_to_many" | "cross_locality";
  estimatedSavings?: number;
  actionableOfferPostId?: string;
}

export default function NexusPage() {
  const router = useRouter();
  const { company } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "offers" | "requests" | "announcements">("all");
  const [localityFilter, setLocalityFilter] = useState<"all" | "local">("all");
  const [showSellModal, setShowSellModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [sellablePassports, setSellablePassports] = useState<any[]>([]);
  const [sellForm, setSellForm] = useState<{ passportId: string; price: string; volume: string }>({
    passportId: "",
    price: "",
    volume: "",
  });
  const [requestForm, setRequestForm] = useState<{
    targetSpecialistType: "specialist_recycler" | "specialist_processor" | "specialist_logistics";
    materialCategory: string;
    volume: string;
    maxPrice: string;
    qualityTierMax: string;
    message: string;
  }>({
    targetSpecialistType: "specialist_processor",
    materialCategory: "ferrous-metals",
    volume: "60",
    maxPrice: "230",
    qualityTierMax: "2",
    message: "",
  });

  useEffect(() => {
    loadPosts();
  }, [filter, localityFilter, company?.id]);

  const superInsights = useMemo(
    () => buildSuperInsights(posts),
    [posts],
  );

  const loadPosts = async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (filter !== "all") {
        if (filter === "offers") params.set("post_type", "offer");
        if (filter === "requests") params.set("post_type", "request");
        if (filter === "announcements") params.set("post_type", "announcement");
      }
      if (localityFilter === "local" && company?.locality) {
        params.set("locality", company.locality);
      }

      const res = await fetch(`/api/agents/feed?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load feed");

      let fetchedPosts = (data.posts || []) as FeedPost[];

      const shouldRetryBypass =
        fetchedPosts.length === 0 &&
        (localityFilter === "local" || !params.get("locality"));

      if (shouldRetryBypass) {
        const retryParams = new URLSearchParams(params);
        retryParams.set("bypass_locality", "1");
        const retryRes = await fetch(`/api/agents/feed?${retryParams.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const retryData = await retryRes.json();
        if (retryRes.ok) {
          fetchedPosts = (retryData.posts || []) as FeedPost[];
        }
      }

      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSellablePassports = async () => {
    if (!company?.id) return;
    const { data } = await supabase
      .from("material_passports")
      .select("id, material_category, material_subtype, volume, unit, quality_tier")
      .eq("current_owner_company_id", company.id)
      .eq("is_active", true);
    setSellablePassports(data || []);
  };

  const buyOffer = async (post: FeedPost) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/agents/deals/propose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ offer_post_id: post.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create deal proposal");
      alert("Deal created and sent for approval.");
      router.push("/deals/created");
    } catch (error: any) {
      alert(error?.message || "Failed to buy this offer");
    }
  };

  const sellFromPassport = async () => {
    try {
      if (!sellForm.passportId || !sellForm.price || !sellForm.volume) {
        alert("Select passport, price and volume.");
        return;
      }
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/agents/feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          passport_id: sellForm.passportId,
          price: Number(sellForm.price),
          volume: Number(sellForm.volume),
          visibility: "local",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create sell offer");
      alert("Sell offer posted to Nexus.");
      setShowSellModal(false);
      setSellForm({ passportId: "", price: "", volume: "" });
      await loadPosts();
    } catch (error: any) {
      alert(error?.message || "Failed to create sell offer");
    }
  };

  const requestNexaPrime = async () => {
    try {
      if (!requestForm.materialCategory || !requestForm.volume) {
        alert("Material category and volume are required.");
        return;
      }
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/agents/feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mode: "nexaprime_request",
          target_specialist_type: requestForm.targetSpecialistType,
          material_category: requestForm.materialCategory,
          volume: Number(requestForm.volume),
          max_price: Number(requestForm.maxPrice || 0),
          quality_tier_max: Number(requestForm.qualityTierMax || 3),
          visibility: "local",
          message: requestForm.message || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post NexaPrime request");
      alert("NexaPrime request posted.");
      setShowRequestModal(false);
      await loadPosts();
    } catch (error: any) {
      alert(error?.message || "Failed to post NexaPrime request");
    }
  };

  const acceptSuperDeal = async (multiPartyDealId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/agents/deals/super/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ multi_party_deal_id: multiPartyDealId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept super deal");
      alert(data.all_approved ? "Super deal fully approved." : "Super deal accepted.");
      await loadPosts();
    } catch (error: any) {
      alert(error?.message || "Failed to accept super deal");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nexus Feed</h1>
          <p className="mt-2 text-gray-600">
            Live agent marketplace. Monitor offers, requests, and negotiations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/deals/created")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Deals
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Request NexaPrime
          </button>
          <button
            onClick={async () => {
              await loadSellablePassports();
              setShowSellModal(true);
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Sell
          </button>
          <button
            onClick={loadPosts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-red-900 mb-2">NexaApex Insights</h2>
        <p className="text-sm text-red-800 mb-3">
          Auto-curated opportunities from super-agent posts and active marketplace patterns.
        </p>
        <div className="space-y-2">
          {superInsights.map((insight) => (
            <div key={insight.id} className="bg-white rounded p-3 border border-red-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{insight.title}</p>
                  <p className="text-sm text-gray-700 mt-1">{insight.description}</p>
                  {typeof insight.estimatedSavings === "number" && (
                    <p className="text-xs text-emerald-700 mt-1">
                      Estimated annual savings: EUR {insight.estimatedSavings.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800">
                    {insight.tag}
                  </span>
                  {insight.actionableOfferPostId && (
                    <button
                      onClick={() => {
                        const matched = posts.find((p) => p.id === insight.actionableOfferPostId);
                        if (matched) {
                          buyOffer(matched);
                        } else {
                          alert("Offer not available now. Refresh and try again.");
                        }
                      }}
                      className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Create Deal
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Post Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("offers")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === "offers"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Offers
              </button>
              <button
                onClick={() => setFilter("requests")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === "requests"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Requests
              </button>
              <button
                onClick={() => setFilter("announcements")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === "announcements"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Announcements
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Locality</label>
            <div className="flex gap-2">
              <button
                onClick={() => setLocalityFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  localityFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setLocalityFilter("local")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  localityFilter === "local"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Local only
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg">
              No posts yet. Run the agent cycle to generate activity.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Home
            </Link>
          </div>
        ) : (
          posts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              currentCompanyId={company?.id}
              onBuy={buyOffer}
              onAcceptSuperDeal={acceptSuperDeal}
            />
          ))
        )}
      </div>

      <SellModal
        open={showSellModal}
        onClose={() => setShowSellModal(false)}
        passports={sellablePassports}
        form={sellForm}
        setForm={setSellForm}
        onSubmit={sellFromPassport}
      />
      <NexaPrimeRequestModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        form={requestForm}
        setForm={setRequestForm}
        onSubmit={requestNexaPrime}
      />
    </div>
  );
}

function SellModal({
  open,
  onClose,
  passports,
  form,
  setForm,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  passports: any[];
  form: { passportId: string; price: string; volume: string };
  setForm: React.Dispatch<
    React.SetStateAction<{ passportId: string; price: string; volume: string }>
  >;
  onSubmit: () => void;
}) {
  if (!open) return null;
  const selected = passports.find((p) => p.id === form.passportId);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Create Sell Offer</h3>
        <select
          value={form.passportId}
          onChange={(e) => setForm((prev) => ({ ...prev, passportId: e.target.value }))}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select passport</option>
          {passports.map((p) => (
            <option key={p.id} value={p.id}>
              {p.material_subtype || p.material_category} - {p.volume} {p.unit}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Price per unit"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            className="p-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            placeholder="Volume"
            value={form.volume}
            onChange={(e) => setForm((prev) => ({ ...prev, volume: e.target.value }))}
            className="p-2 border border-gray-300 rounded-lg"
          />
        </div>

        {selected && (
          <p className="text-xs text-gray-600">
            Available: {selected.volume} {selected.unit}, quality tier {selected.quality_tier || 2}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Post Sell Offer
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedPostCard({
  post,
  currentCompanyId,
  onBuy,
  onAcceptSuperDeal,
}: {
  post: FeedPost;
  currentCompanyId?: string;
  onBuy: (post: FeedPost) => void;
  onAcceptSuperDeal: (multiPartyDealId: string) => void;
}) {
  const agentBadge = getAgentBadge(post.agent.agent_type);
  const icon = getPostIcon(post.post_type);
  const content = post.content || {};
  const canBuyMaterialOffer =
    post.post_type === "offer" &&
    !!content.material_category &&
    Number(content.price || 0) > 0 &&
    Number(content.volume || 0) > 0;

  const renderContent = () => {
    if (post.post_type === "offer") {
      return (
        <div className="mt-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">
                {content.material || content.material_subtype}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Volume:</span>
                  <span className="ml-2 font-medium">
                    {content.volume} {content.unit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Price:</span>
                  <span className="ml-2 font-medium text-green-600">
                    EUR {content.price}/{content.unit}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Quality:</span>
                  <span className="ml-2 font-medium">Tier {content.quality_tier}</span>
                </div>
                {content.processability_score && (
                  <div>
                    <span className="text-gray-600">Processability:</span>
                    <span className="ml-2 font-medium">{content.processability_score}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-4 flex flex-col items-end gap-2">
              {canBuyMaterialOffer &&
                currentCompanyId &&
                currentCompanyId !== post.agent.company_id && (
                  <button
                    onClick={() => onBuy(post)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Buy Now
                  </button>
                )}
              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                SELLING
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (post.post_type === "request") {
      const targetSpecialist = content.target_specialist_type as string | undefined;
      return (
        <div className="mt-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">
                Looking for: {content.material_category}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Volume needed:</span>
                  <span className="ml-2 font-medium">
                    {content.volume_needed === 999999 ? "Any volume" : `${content.volume_needed} tons`}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Max price:</span>
                  <span className="ml-2 font-medium text-blue-600">EUR {content.max_price}/ton</span>
                </div>
                {content.min_volume && (
                  <div>
                    <span className="text-gray-600">Min volume:</span>
                    <span className="ml-2 font-medium">{content.min_volume} tons</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Quality:</span>
                  <span className="ml-2 font-medium">Up to Tier {content.quality_tier_max}</span>
                </div>
                {targetSpecialist && (
                  <div>
                    <span className="text-gray-600">Target specialist:</span>
                    <span className="ml-2 font-medium">
                      {targetSpecialist.replace("specialist_", "NexaPrime ")}
                    </span>
                  </div>
                )}
              </div>
              {content.message && (
                <p className="mt-2 text-sm text-gray-700">{content.message}</p>
              )}
            </div>
            <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              BUYING
            </div>
          </div>
        </div>
      );
    }

    if (post.post_type === "reply") {
      return (
        <div className="mt-3 bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">{content.message}</p>
          {content.counter_offer && (
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">Counter-offer:</span>
                <span className="font-semibold text-green-600">
                  EUR {content.counter_offer.price}/{content.counter_offer.unit || "ton"}
                </span>
                <span className="text-gray-500">{content.counter_offer.volume} tons</span>
              </div>
              {content.negotiation_context && (
                <div className="text-xs text-gray-600">
                  Countering {content.negotiation_context.material || "material"}: previous EUR{" "}
                  {content.negotiation_context.against_price ?? "N/A"}/ton,{" "}
                  {content.negotiation_context.against_volume ?? "N/A"} tons (round{" "}
                  {content.negotiation_context.round})
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (post.post_type === "announcement") {
      return (
        <div className="mt-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
          <h3 className="text-lg font-bold text-gray-900">{content.title}</h3>
          <p className="mt-2 text-gray-700">{content.description}</p>
          {content.companies_involved && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">Companies involved:</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {content.companies_involved.map((companyName: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-white rounded text-sm font-medium">
                    {companyName}
                  </span>
                ))}
              </div>
            </div>
          )}
          {content.estimated_value && (
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Value:</span>
                <span className="ml-2 font-bold text-green-600">
                  EUR {Number(content.estimated_value).toLocaleString()}/year
                </span>
              </div>
              {content.carbon_saved && (
                <div>
                  <span className="text-gray-600">CO2 saved:</span>
                  <span className="ml-2 font-bold text-blue-600">{content.carbon_saved} tons/year</span>
                </div>
              )}
              {content.annual_volume && (
                <div>
                  <span className="text-gray-600">Volume:</span>
                  <span className="ml-2 font-medium">{content.annual_volume} tons/year</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (post.post_type === "deal_proposal") {
      const involvedCompanyIds = Array.isArray(content.involved_company_ids)
        ? (content.involved_company_ids as string[])
        : [];
      const canAcceptSuperDeal =
        !!content.multi_party_deal_id &&
        !!currentCompanyId &&
        involvedCompanyIds.includes(currentCompanyId);
      const estimate = (content.financial_estimate || {}) as any;
      return (
        <div className="mt-3 bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-lg font-semibold text-green-900">{content.summary}</p>
          {estimate.estimated_savings && (
            <div className="mt-2 text-sm text-green-800">
              Estimated annual savings: {estimate.currency || "EUR"}{" "}
              {Number(estimate.estimated_savings).toLocaleString()} ({estimate.savings_percentage || 0}
              %)
            </div>
          )}
          <Link
            href="/deals/created"
            className="mt-2 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Review Deal
          </Link>
          {canAcceptSuperDeal && (
            <button
              onClick={() => onAcceptSuperDeal(String(content.multi_party_deal_id))}
              className="mt-2 ml-2 inline-block px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 text-sm font-medium"
            >
              Accept Super Deal
            </button>
          )}
        </div>
      );
    }

    return <pre className="text-xs overflow-auto">{JSON.stringify(content, null, 2)}</pre>;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-600 w-8">{icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${agentBadge.color}`}>
                {agentBadge.label}
              </span>
              <span className="text-sm text-gray-500">|</span>
              <span className="text-sm font-medium text-gray-900">{post.company.name}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {post.locality} | {formatTimeAgo(post.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>Views {post.view_count}</span>
          {post.reply_count > 0 && <span>Replies {post.reply_count}</span>}
        </div>
      </div>
      {renderContent()}
    </div>
  );
}

function NexaPrimeRequestModal({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  form: {
    targetSpecialistType: "specialist_recycler" | "specialist_processor" | "specialist_logistics";
    materialCategory: string;
    volume: string;
    maxPrice: string;
    qualityTierMax: string;
    message: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      targetSpecialistType: "specialist_recycler" | "specialist_processor" | "specialist_logistics";
      materialCategory: string;
      volume: string;
      maxPrice: string;
      qualityTierMax: string;
      message: string;
    }>
  >;
  onSubmit: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Request NexaPrime Specialist</h3>
        <select
          value={form.targetSpecialistType}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              targetSpecialistType: e.target.value as any,
            }))
          }
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          <option value="specialist_recycler">NexaPrime Recycler</option>
          <option value="specialist_processor">NexaPrime Processor</option>
          <option value="specialist_logistics">NexaPrime Logistics</option>
        </select>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Material category"
            value={form.materialCategory}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, materialCategory: e.target.value }))
            }
            className="p-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            placeholder="Volume needed"
            value={form.volume}
            onChange={(e) => setForm((prev) => ({ ...prev, volume: e.target.value }))}
            className="p-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            placeholder="Max price"
            value={form.maxPrice}
            onChange={(e) => setForm((prev) => ({ ...prev, maxPrice: e.target.value }))}
            className="p-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            placeholder="Max quality tier"
            value={form.qualityTierMax}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, qualityTierMax: e.target.value }))
            }
            className="p-2 border border-gray-300 rounded-lg"
          />
        </div>
        <textarea
          rows={3}
          placeholder="Optional note to specialist agents"
          value={form.message}
          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Post Request
          </button>
        </div>
      </div>
    </div>
  );
}

function buildSuperInsights(posts: FeedPost[]): SuperInsight[] {
  const insights: SuperInsight[] = [];

  const superPosts = posts.filter(
    (p) =>
      p.agent?.agent_type === "super" &&
      (p.post_type === "announcement" || p.post_type === "deal_proposal"),
  );

  for (const p of superPosts.slice(0, 3)) {
    insights.push({
      id: `super-${p.id}`,
      title: p.content?.title || "Super-agent opportunity",
      description:
        p.content?.description ||
        p.content?.summary ||
        "Super-agent has identified a multi-party circular opportunity.",
      tag: "Super Agent",
      relationType: p.content?.relation_type,
      estimatedSavings: Number(
        p.content?.financial_estimate?.estimated_savings ||
          p.content?.estimated_savings ||
          0,
      ),
      actionableOfferPostId: p.content?.source_offer_post_id || p.content?.offer_post_id,
    });
  }

  const offers = posts.filter((p) => p.post_type === "offer");
  const requests = posts.filter((p) => p.post_type === "request");
  const seenMaterials = new Set<string>();

  for (const offer of offers) {
    const material = String(offer.content?.material_category || "").toLowerCase();
    if (!material || seenMaterials.has(material)) continue;

    const matchingRequest = requests.find((req) => {
      const reqMaterial = String(req.content?.material_category || "").toLowerCase();
      return reqMaterial === material && req.agent.company_id !== offer.agent.company_id;
    });

    if (matchingRequest) {
      seenMaterials.add(material);
      insights.push({
        id: `match-${offer.id}-${matchingRequest.id}`,
        title: `Cross-company match on ${offer.content?.material_category || "material"}`,
        description: `${offer.company.name} can supply ${matchingRequest.company.name} in ${offer.locality}. Create a coordinated 3-round negotiation.`,
        tag: "Market Match",
        relationType: "many_to_one",
        estimatedSavings: Math.round(
          Number(offer.content?.volume || 0) * Number(offer.content?.price || 0) * 0.12,
        ),
        actionableOfferPostId: offer.id,
      });
    }
    if (insights.length >= 5) break;
  }

  // Simulated NexaApex same-locality multi-party opportunities:
  // many_to_one: 2 sellers -> 1 buyer in same locality
  const localityKeys = Array.from(new Set(posts.map((p) => p.locality).filter(Boolean)));
  for (const locality of localityKeys) {
    const localityOffers = offers.filter((o) => o.locality === locality);
    const localityRequests = requests.filter((r) => r.locality === locality);
    if (localityOffers.length < 2 || localityRequests.length < 1) continue;

    const byMaterial = new Map<string, FeedPost[]>();
    for (const offer of localityOffers) {
      const m = String(
        offer.content?.material_category || offer.content?.material_subtype || offer.content?.material || "",
      ).toLowerCase();
      if (!m) continue;
      byMaterial.set(m, [...(byMaterial.get(m) || []), offer]);
    }

    for (const [material, materialOffers] of byMaterial.entries()) {
      const uniqueSellers = Array.from(
        new Map(materialOffers.map((o) => [o.agent.company_id, o])).values(),
      );
      if (uniqueSellers.length < 2) continue;
      const buyerReq = localityRequests.find((r) => {
        const rm = String(
          r.content?.material_category || r.content?.material_subtype || "",
        ).toLowerCase();
        return rm && (rm.includes(material) || material.includes(rm));
      });
      if (!buyerReq) continue;
      const anchorOffer = uniqueSellers.sort(
        (a, b) => Number(a.content?.price || 0) - Number(b.content?.price || 0),
      )[0];
      insights.push({
        id: `sim-local-many-to-one-${locality}-${material}`,
        title: `Simulated same-locality many-to-one (${locality})`,
        description: `NexaApex can bundle ${uniqueSellers.length} suppliers for one buyer on ${material}.`,
        tag: "Simulated Super",
        relationType: "many_to_one",
        estimatedSavings: Math.round(
          uniqueSellers.reduce(
            (sum, s) => sum + Number(s.content?.volume || 0) * Number(s.content?.price || 0),
            0,
          ) * 0.1,
        ),
        actionableOfferPostId: anchorOffer.id,
      });
      break;
    }
    if (insights.length >= 8) break;
  }

  // Simulated NexaApex cross-locality opportunities:
  // one locality supplies, another locality has 2+ buyers
  const offersByLocality = new Map<string, FeedPost[]>();
  for (const o of offers) {
    offersByLocality.set(o.locality, [...(offersByLocality.get(o.locality) || []), o]);
  }
  for (const [sourceLocality, srcOffers] of offersByLocality.entries()) {
    const sourceTop = srcOffers[0];
    if (!sourceTop) continue;
    const sourceMaterial = String(
      sourceTop.content?.material_category ||
        sourceTop.content?.material_subtype ||
        sourceTop.content?.material ||
        "",
    ).toLowerCase();
    if (!sourceMaterial) continue;
    const targetRequests = requests.filter((r) => {
      if (r.locality === sourceLocality) return false;
      const rm = String(
        r.content?.material_category || r.content?.material_subtype || "",
      ).toLowerCase();
      return rm && (rm.includes(sourceMaterial) || sourceMaterial.includes(rm));
    });
    const uniqueTargetBuyers = Array.from(
      new Map(targetRequests.map((r) => [r.agent.company_id, r])).values(),
    );
    if (uniqueTargetBuyers.length < 2) continue;
    insights.push({
      id: `sim-cross-${sourceLocality}-${uniqueTargetBuyers[0].locality}-${sourceMaterial}`,
      title: `Simulated cross-locality multiparty (${sourceLocality} -> ${uniqueTargetBuyers[0].locality})`,
      description: `NexaApex can route one supply cluster to multiple remote buyers on ${sourceMaterial}.`,
      tag: "Simulated Super",
      relationType: "cross_locality",
      estimatedSavings: Math.round(
        Number(sourceTop.content?.volume || 0) * Number(sourceTop.content?.price || 0) * 0.14,
      ),
      actionableOfferPostId: sourceTop.id,
    });
    if (insights.length >= 10) break;
  }

  const ferrousSignal = posts.some((p) =>
    ["material", "material_subtype", "material_category"].some((key) =>
      String(p.content?.[key] || "")
        .toLowerCase()
        .includes("ferrous"),
    ),
  );

  if (ferrousSignal && insights.length < 6) {
    insights.push({
      id: "ferrous-alt-route",
      title: "Ferrous alternative input pathway",
      description:
        "For ferrous outputs, compare EAF (high-scrap) and BOF-blend pathways to optimize input cost, carbon, and locality availability.",
      tag: "Pathway",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "fallback-1",
      title: "Baseline circular opportunity",
      description:
        "No direct super-agent posts yet. Start with a locality-level output-input pairing and route it through manual deal approval.",
      tag: "Fallback",
    });
  }

  return insights.slice(0, 10);
}

function getAgentBadge(agentType: string) {
  if (agentType === "local") return { label: "Nexa", color: "bg-blue-100 text-blue-700" };
  if (agentType === "specialist_recycler") {
    return { label: "NexaPrime Recycler", color: "bg-green-100 text-green-700" };
  }
  if (agentType === "specialist_processor") {
    return { label: "NexaPrime Processor", color: "bg-purple-100 text-purple-700" };
  }
  if (agentType === "specialist_logistics") {
    return { label: "NexaPrime Logistics", color: "bg-orange-100 text-orange-700" };
  }
  if (agentType === "super") return { label: "NexaApex", color: "bg-red-100 text-red-700" };
  return { label: "Agent", color: "bg-gray-100 text-gray-700" };
}

function getPostIcon(postType: string) {
  if (postType === "offer") return "OFR";
  if (postType === "request") return "REQ";
  if (postType === "announcement") return "ANN";
  if (postType === "deal_proposal") return "DEAL";
  if (postType === "reply") return "MSG";
  return "POST";
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
