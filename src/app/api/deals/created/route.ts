import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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
      try {
        const parsed = JSON.parse(c.value);
        if (Array.isArray(parsed) && typeof parsed[0] === "string") {
          return parsed[0];
        }
      } catch {
        // ignore
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
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

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (companyError || !company?.id) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select(
        `
        *,
        seller_company:seller_company_id(id, name),
        buyer_company:buyer_company_id(id, name),
        seller_agent:agents!seller_agent_id(id, name, agent_type),
        buyer_agent:agents!buyer_agent_id(id, name, agent_type)
      `,
      )
      .or(`seller_company_id.eq.${company.id},buyer_company_id.eq.${company.id}`)
      .not("negotiation_thread_id", "is", null)
      .order("created_at", { ascending: false });

    if (dealsError) {
      return NextResponse.json(
        { error: dealsError.message || "Failed to fetch created deals" },
        { status: 500 },
      );
    }

    const normalizedDeals = (deals || []).map((deal: any) => {
      const reasoning = String(deal.agent_reasoning || "");
      const isManual = reasoning.toLowerCase().includes("manual buy intent");
      const isAuto3Rounds = reasoning.includes("[AUTO_3_ROUNDS]");

      let createdType = "other";
      if (isManual) createdType = "manual_human_buy";
      else if (isAuto3Rounds) createdType = "auto_after_3_rounds";
      else if (deal.multi_party_deal_id) createdType = "multi_party";

      return {
        ...deal,
        created_type: createdType,
      };
    });

    return NextResponse.json({
      success: true,
      deals: normalizedDeals,
      count: normalizedDeals.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch created deals" },
      { status: 500 },
    );
  }
}

