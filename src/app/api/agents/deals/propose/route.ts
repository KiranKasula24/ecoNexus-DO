import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type ProposeBody = {
  offer_post_id?: string;
  volume?: number;
};

async function resolveAccessToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieStore = await cookies();
  const direct = cookieStore.get("sb-access-token")?.value;
  if (direct) return direct;

  for (const c of cookieStore.getAll()) {
    if (c.name.includes("auth-token")) {
      // Supabase auth cookie value often stores JSON array: [access,refresh]
      try {
        const parsed = JSON.parse(c.value);
        if (Array.isArray(parsed) && typeof parsed[0] === "string") {
          return parsed[0];
        }
      } catch {
        // ignore and continue
      }
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ProposeBody;
    if (!body.offer_post_id) {
      return NextResponse.json(
        { error: "offer_post_id is required" },
        { status: 400 },
      );
    }

    const { data: buyerCompany } = await supabase
      .from("companies")
      .select("id, locality")
      .eq("user_id", user.id)
      .single();
    if (!buyerCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { data: offerPost } = await supabase
      .from("agent_feed")
      .select("*")
      .eq("id", body.offer_post_id)
      .eq("post_type", "offer")
      .single();
    if (!offerPost) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    const { data: sellerAgent } = await supabase
      .from("agents")
      .select("id, company_id")
      .eq("id", offerPost.agent_id)
      .single();
    if (!sellerAgent) {
      return NextResponse.json(
        { error: "Seller agent not found" },
        { status: 404 },
      );
    }
    if (sellerAgent.company_id === buyerCompany.id) {
      return NextResponse.json(
        { error: "Cannot buy your own offer" },
        { status: 400 },
      );
    }

    let { data: buyerAgent } = await supabase
      .from("agents")
      .select("id")
      .eq("company_id", buyerCompany.id)
      .single();

    if (!buyerAgent?.id) {
      const { data: createdAgent, error: createAgentError } = await supabase
        .from("agents")
        .insert({
          company_id: buyerCompany.id,
          name: `Nexa-${buyerCompany.id.slice(0, 8)}`,
          agent_type: "local",
          locality: buyerCompany.locality || "unknown",
          status: "active",
        })
        .select("id")
        .single();
      if (createAgentError || !createdAgent?.id) {
        return NextResponse.json(
          { error: "Failed to create buyer agent" },
          { status: 500 },
        );
      }
      buyerAgent = createdAgent;
    }

    const content = (offerPost.content || {}) as any;
    if (!content.material_category || !content.price || !content.volume) {
      return NextResponse.json(
        { error: "Only material offers with price and volume are buyable" },
        { status: 400 },
      );
    }
    const volume = Math.min(
      Number(body.volume || content.volume || 0),
      Number(content.volume || 0),
    );
    const price = Number(content.price || 0);
    const materialCategory = content.material_category || content.material || "unknown";
    const materialSubtype = content.material_subtype || content.material || "unknown";

    if (!volume || !price) {
      return NextResponse.json(
        { error: "Offer is missing volume or price" },
        { status: 400 },
      );
    }

    let passportId = content.passport_id as string | undefined;
    if (!passportId) {
      const { data: fallbackPassport } = await supabase
        .from("material_passports")
        .select("id")
        .eq("current_owner_company_id", sellerAgent.company_id)
        .eq("material_category", materialCategory)
        .maybeSingle();
      passportId = fallbackPassport?.id;
    }

    if (!passportId) {
      return NextResponse.json(
        { error: "No passport found for this offer" },
        { status: 400 },
      );
    }

    const { data: existingDeal } = await supabase
      .from("deals")
      .select("id")
      .eq("negotiation_thread_id", offerPost.id)
      .maybeSingle();
    if (existingDeal?.id) {
      return NextResponse.json({
        success: true,
        deal_id: existingDeal.id,
        message: "Deal already exists for this offer",
      });
    }

    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .insert({
        seller_agent_id: sellerAgent.id,
        buyer_agent_id: buyerAgent.id,
        seller_company_id: sellerAgent.company_id,
        buyer_company_id: buyerCompany.id,
        passport_id: passportId,
        material_category: materialCategory,
        material_subtype: materialSubtype,
        volume,
        unit: content.unit || "tons",
        price_per_unit: price,
        total_value: volume * price,
        duration_months: 1,
        payment_terms: "30 days",
        delivery_terms: "Buyer pickup",
        quality_tier: Number(content.quality_tier || 2),
        status: "pending_seller_approval",
        negotiation_thread_id: offerPost.id,
        agent_recommendation: "approved",
        agent_reasoning: "Manual buy intent by human from Nexus feed.",
      })
      .select("id")
      .single();

    if (dealError || !deal?.id) {
      return NextResponse.json(
        { error: dealError?.message || "Failed to create deal" },
        { status: 500 },
      );
    }

    await supabase.from("agent_feed").insert({
      agent_id: buyerAgent.id,
      post_type: "deal_proposal",
      parent_id: offerPost.id,
      thread_root_id: offerPost.id,
      locality: offerPost.locality,
      visibility: offerPost.visibility,
      content: {
        deal_id: deal.id,
        summary: `Manual buy initiated: ${volume} ${
          content.unit || "tons"
        } ${materialCategory} @ EUR ${price}/${
          content.unit || "ton"
        }`,
      },
    });

    return NextResponse.json({ success: true, deal_id: deal.id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to propose deal" },
      { status: 500 },
    );
  }
}
