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
        // ignore and continue
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const openStatuses = [
      "pending_seller_approval",
      "pending_buyer_approval",
      "pending_logistics",
      "pending_multi_party_approval",
      "proposed",
      "partial_approval",
      "approved_both_parties",
    ];

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

    // Get user's company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get pending deals where user's company is involved
    const { data: deals, error: dealsError } = await supabase
      .from("deals")
      .select(
        `
        *,
        seller_company:seller_company_id(id, name),
        buyer_company:buyer_company_id(id, name),
        seller_agent:agents!seller_agent_id(id, name, company_id),
        buyer_agent:agents!buyer_agent_id(id, name, company_id),
        passport:material_passports(id, material_category, material_subtype, volume, unit, quality_tier)
      `,
      )
      .or(
        `seller_company_id.eq.${company.id},buyer_company_id.eq.${company.id}`,
      )
      .in("status", openStatuses)
      .order("created_at", { ascending: false });

    if (dealsError) {
      console.error("Deals fetch error:", dealsError);
      return NextResponse.json(
        { error: "Failed to fetch deals" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      deals: deals || [],
      count: (deals || []).length,
    });
  } catch (error: any) {
    console.error("Pending deals error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pending deals" },
      { status: 500 },
    );
  }
}
