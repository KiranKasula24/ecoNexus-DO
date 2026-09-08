import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

type VerificationMethod =
  | "document"
  | "lab_test"
  | "sensor"
  | "visual_inspection";

type VerificationBody = {
  method?: VerificationMethod;
  verified_by?: string;
  findings?: string;
  evidence_documents?: string[];
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
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for verification writes.",
    );
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
  );
}

function calculateVerificationScore(
  method: VerificationMethod,
  qualityTier: number,
): number {
  const methodScores: Record<VerificationMethod, number> = {
    visual_inspection: 40,
    document: 60,
    lab_test: 90,
    sensor: 85,
  };

  let score = methodScores[method];
  score += (5 - qualityTier) * 5;
  return Math.max(0, Math.min(100, score));
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: passportId } = await context.params;
    if (!passportId) {
      return NextResponse.json(
        { error: "Invalid passport ID" },
        { status: 400 },
      );
    }

    const supabaseAdminClient = createSupabaseAdminClient();

    
    const body = (await request.json()) as VerificationBody;
    const method = body.method;
    const allowedMethods: VerificationMethod[] = [
      "document",
      "lab_test",
      "sensor",
      "visual_inspection",
    ];

    if (!method || !allowedMethods.includes(method)) {
      return NextResponse.json(
        { error: "Invalid verification method" },
        { status: 400 },
      );
    }

    const verifiedBy = body.verified_by || "system";

    const { data: passport, error: passportError } = await supabaseAdminClient
      .from("material_passports")
      .select("id, quality_tier")
      .eq("id", passportId)
      .single();

    if (passportError || !passport) {
      return NextResponse.json(
        { error: "Passport not found" },
        { status: 404 },
      );
    }

    const score = calculateVerificationScore(
      method,
      passport.quality_tier || 3,
    );
    const status =
      score >= 70 ? "verified" : score >= 50 ? "pending" : "failed";

    const { error: updateError } = await supabaseAdminClient
      .from("material_passports")
      .update({
        verification_status: status,
        verification_score: score,
        verification_provider: verifiedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", passportId);

    if (updateError) {
      throw new Error(`Failed to update passport: ${updateError.message}`);
    }

    const { error: documentUpdateError } = await supabaseAdminClient
      .from("passport_documents")
      .update({ verification_status: status })
      .eq("passport_id", passportId)
      .eq("verification_status", "pending");

    if (documentUpdateError) {
      throw new Error(
        `Failed to update document statuses: ${documentUpdateError.message}`,
      );
    }

    const { error: eventError } = await supabaseAdminClient
      .from("passport_events")
      .insert({
        passport_id: passportId,
        event_type: "verification",
        description: `Verification via ${method}: ${status}`,
        metadata: {
          method,
          score,
          findings: body.findings || null,
          evidence_documents: body.evidence_documents || [],
          verified_by: verifiedBy,
        },
      });

    if (eventError) {
      throw new Error(
        `Failed to create verification event: ${eventError.message}`,
      );
    }

    const result = {
      passport_id: passportId,
      verification_status: status,
      verification_score: score,
      method,
      verified_by: verifiedBy,
      findings: body.findings,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      verification: result,
    });
  } catch (error: unknown) {
    console.error("Verification submission error:", error);
    const message =
      error instanceof Error ? error.message : "Verification failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: passportId } = await context.params;
    if (!passportId) {
      return NextResponse.json(
        { error: "Invalid passport ID" },
        { status: 400 },
      );
    }

    const supabaseUserClient = createSupabaseServerClient();
    const supabaseAdminClient = createSupabaseAdminClient();

    const {
      data: { user },
    } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: history, error } = await supabaseAdminClient
      .from("passport_events")
      .select("*")
      .eq("passport_id", passportId)
      .eq("event_type", "verification")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      passport_id: passportId,
      verifications: history || [],
    });
  } catch (error: unknown) {
    console.error("Verification history error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch history";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
