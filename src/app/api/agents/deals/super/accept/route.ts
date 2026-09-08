import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Body = {
  multi_party_deal_id?: string;
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

export async function POST(request: NextRequest) {
  try {
    const token = await resolveAccessToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    if (!body.multi_party_deal_id) {
      return NextResponse.json(
        { error: "multi_party_deal_id is required" },
        { status: 400 },
      );
    }

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!company?.id) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { data: deal } = await supabase
      .from("multi_party_deals")
      .select("*")
      .eq("id", body.multi_party_deal_id)
      .single();
    if (!deal) {
      return NextResponse.json(
        { error: "Super deal not found" },
        { status: 404 },
      );
    }

    const participants = (deal.participating_company_ids || []) as string[];
    if (!participants.includes(company.id)) {
      return NextResponse.json(
        { error: "Only participating companies can accept this super deal" },
        { status: 403 },
      );
    }

    const approvals = { ...((deal.approvals as any) || {}) };
    approvals[company.id] = {
      approved: true,
      approved_at: new Date().toISOString(),
    };

    const allApproved = participants.every(
      (companyId) => approvals?.[companyId]?.approved === true,
    );
    const nextStatus = allApproved ? "all_approved" : "partial_approval";

    const { error: updateErr } = await supabase
      .from("multi_party_deals")
      .update({
        approvals,
        status: nextStatus,
        activated_at: allApproved ? new Date().toISOString() : null,
      })
      .eq("id", deal.id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    if (allApproved) {
      await supabase
        .from("deals")
        .update({ status: "active", start_date: new Date().toISOString() })
        .eq("multi_party_deal_id", deal.id);
    }

    return NextResponse.json({
      success: true,
      multi_party_deal_id: deal.id,
      status: nextStatus,
      all_approved: allApproved,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to accept super deal" },
      { status: 500 },
    );
  }
}

