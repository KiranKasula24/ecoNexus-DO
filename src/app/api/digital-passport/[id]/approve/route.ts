import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

type ApprovalBody = {
  approved_by?: string;
  approval_type?: "quality" | "transfer" | "verification";
  notes?: string;
};

function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );
}

function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for approval writes.");
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: passportId } = await context.params;

  if (!passportId) {
    return NextResponse.json({ error: "Invalid passport ID" }, { status: 400 });
  }

  try {
    const supabaseUserClient = createSupabaseServerClient();
    const supabaseAdminClient = createSupabaseAdminClient();

    const {
      data: { user },
    } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as ApprovalBody;
    const approvedBy = body.approved_by || user.id;
    const approvalType = body.approval_type || "verification";
    const notes = body.notes || null;

    // approval_type: 'quality' | 'transfer' | 'verification'

    // 1. Fetch passport
    const { data: passport, error } = await supabaseAdminClient
      .from("material_passports")
      .select("id")
      .eq("id", passportId)
      .single();

    if (error || !passport) {
      return NextResponse.json(
        { error: "Passport not found" },
        { status: 404 },
      );
    }

    // 2. Create approval event
    const eventData = {
      passport_id: passportId,
      event_type: "human_approval",
      description: `${approvalType} approved by ${approvedBy}`,
      metadata: {
        approval_type: approvalType,
        approved_by: approvedBy,
        notes,
        timestamp: new Date().toISOString(),
      },
    };

    const { error: eventError } = await supabaseAdminClient
      .from("passport_events")
      .insert(eventData);

    if (eventError) {
      throw new Error(`Failed to record approval: ${eventError.message}`);
    }

    return NextResponse.json({
      success: true,
      passport_id: passportId,
      approval: {
        type: approvalType,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Approval error:", error);
    const message = error instanceof Error ? error.message : "Approval failed";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
