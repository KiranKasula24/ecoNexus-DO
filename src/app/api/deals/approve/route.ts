import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // must use service role for secure server operations
);

export async function POST(request: NextRequest) {
  try {
    // ============================
    // 1. AUTH VALIDATION
    // ============================

    const authHeader = request.headers.get("authorization");
    let accessToken: string | undefined;
    if (authHeader?.toLowerCase().startsWith("bearer ")) {
      accessToken = authHeader.slice(7).trim();
    }

    if (!accessToken) {
      const cookieStore = cookies();
      accessToken = (await cookieStore).get("sb-access-token")?.value;
    }

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

    // ============================
    // 2. PARSE BODY
    // ============================

    const body = await request.json();
    const { deal_id, action } = body;

    if (!deal_id || !action) {
      return NextResponse.json(
        { error: "Missing deal_id or action" },
        { status: 400 },
      );
    }

    // ============================
    // 3. FETCH DEAL
    // ============================

    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select(
        `
        *,
        seller_company:seller_company_id (id, user_id, name),
        buyer_company:buyer_company_id (id, user_id, name)
      `,
      )
      .eq("id", deal_id)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (deal.status === "cancelled" || deal.status === "active") {
      return NextResponse.json(
        { error: "Deal already finalized" },
        { status: 400 },
      );
    }

    // ============================
    // 4. VERIFY USER COMPANY
    // ============================

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const isSeller = deal.seller_company_id === company.id;
    const isBuyer = deal.buyer_company_id === company.id;

    if (!isSeller && !isBuyer) {
      return NextResponse.json(
        { error: "Not authorized for this deal" },
        { status: 403 },
      );
    }

    // ============================
    // 5. HANDLE REJECTION
    // ============================

    if (action === "reject") {
      const { error: updateError } = await supabase
        .from("deals")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", deal_id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to cancel deal" },
          { status: 500 },
        );
      }

      const otherCompanyId = isSeller
        ? deal.buyer_company_id
        : deal.seller_company_id;

      const otherUserId = isSeller
        ? deal.buyer_company?.user_id
        : deal.seller_company?.user_id;

      if (otherUserId) {
        await supabase.from("notifications").insert({
          user_id: otherUserId,
          company_id: otherCompanyId,
          type: "deal_rejected",
          title: "Deal Rejected",
          message: `Deal for ${deal.volume} tons ${deal.material_category} was rejected`,
          related_deal_id: deal_id,
          action_url: `/deals`,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Deal rejected",
      });
    }

    // ============================
    // 6. HANDLE APPROVAL
    // ============================

    if (action === "approve") {
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // ---- Seller approval step ----
      if (deal.status === "pending_seller_approval" && isSeller) {
        updates.status = "pending_buyer_approval";
        updates.seller_approved_at = new Date().toISOString();

        await supabase.from("notifications").insert({
          user_id: deal.buyer_company?.user_id,
          company_id: deal.buyer_company_id,
          type: "deal_awaiting_approval",
          title: "Deal Awaiting Your Approval",
          message: `${deal.seller_company?.name} approved the deal. Your approval needed.`,
          related_deal_id: deal_id,
          action_url: `/deals/created`,
        });
      }

      // ---- Buyer final approval step ----
      else if (deal.status === "pending_buyer_approval" && isBuyer) {
        updates.status = "active";
        updates.buyer_approved_at = new Date().toISOString();

        if (deal.passport_id) {
          const { error: transferError } = await supabase
            .from("material_passports")
            .update({
              current_owner_company_id: deal.buyer_company_id,
              previous_owner_company_id: deal.seller_company_id,
              transfer_date: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", deal.passport_id);

          if (transferError) {
            return NextResponse.json(
              { error: "Failed to transfer passport ownership" },
              { status: 500 },
            );
          }

          await supabase.from("passport_transfers").insert({
            passport_id: deal.passport_id,
            from_company_id: deal.seller_company_id,
            to_company_id: deal.buyer_company_id,
            deal_id: deal_id,
            transfer_date: new Date().toISOString(),
            volume: deal.volume,
            price_per_unit: deal.price_per_unit,
          });
        }

        await supabase.from("notifications").insert({
          user_id: deal.seller_company?.user_id,
          company_id: deal.seller_company_id,
          type: "deal_completed",
          title: "Deal Completed!",
          message: `Deal with ${deal.buyer_company?.name} is now active.`,
          related_deal_id: deal_id,
          action_url: `/deals/${deal_id}`,
        });
      } else {
        return NextResponse.json(
          { error: "Invalid approval attempt" },
          { status: 400 },
        );
      }

      const { error: updateError } = await supabase
        .from("deals")
        .update(updates)
        .eq("id", deal_id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update deal" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message:
          updates.status === "active"
            ? "Deal approved and passport transferred!"
            : "Deal approved",
        new_status: updates.status,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Deal approval error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process deal" },
      { status: 500 },
    );
  }
}

