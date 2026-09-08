import { supabase } from "@/lib/database/supabase";

export type VerificationMethod =
  | "document"
  | "lab_test"
  | "sensor"
  | "visual_inspection";

export interface VerificationResult {
  passport_id: string;
  verification_status: "verified" | "pending" | "failed";
  verification_score: number; // 0-100
  method: VerificationMethod;
  verified_by?: string; // Company or user ID
  findings?: string;
  timestamp: string;
}

/**
 * Submit verification for a passport
 */
export async function submitVerification(
  passportId: string,
  verification: {
    method: VerificationMethod;
    verified_by: string; // Company ID or user ID
    findings?: string;
    evidence_documents?: string[]; // URLs to uploaded docs
  },
): Promise<VerificationResult> {
  try {
    // 1. Fetch passport

    const { data: passport, error: passportError } = await (supabase
      .from("material_passports")
      .select("*")
      .eq("id", passportId)
      .single() as any);

    if (passportError || !passport) {
      throw new Error("Passport not found");
    }

    // 2. Calculate verification score based on method
    const score = calculateVerificationScore(
      verification.method,
      passport.quality_tier || 3,
    );

    // 3. Determine status
    const status =
      score >= 70 ? "verified" : score >= 50 ? "pending" : "failed";

    // 4. Update passport
    const { error: updateError } = await (
      supabase.from("material_passports") as any
    )
      .update({
        verification_status: status,
        verification_score: score,
        verification_provider: verification.verified_by,
        updated_at: new Date().toISOString(),
      })
      .eq("id", passportId);

    if (updateError) {
      throw new Error(`Failed to update passport: ${updateError.message}`);
    }

    // 5. Create verification event
    const eventData: any = {
      passport_id: passportId,
      event_type: "verification",
      description: `Verification via ${verification.method}: ${status}`,
      metadata: {
        method: verification.method,
        score,
        findings: verification.findings,
        evidence_documents: verification.evidence_documents,
      },
    };

    await supabase.from("passport_events").insert(eventData);

    // 6. Return result
    return {
      passport_id: passportId,
      verification_status: status,
      verification_score: score,
      method: verification.method,
      verified_by: verification.verified_by,
      findings: verification.findings,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Verification failed:", error);
    throw error;
  }
}

/**
 * Calculate verification score based on method and quality
 */
function calculateVerificationScore(
  method: VerificationMethod,
  qualityTier: number,
): number {
  // Base scores by method (more rigorous = higher score)
  const methodScores: Record<VerificationMethod, number> = {
    visual_inspection: 40,
    document: 60,
    lab_test: 90,
    sensor: 85,
  };

  let score = methodScores[method];

  // Adjust for quality tier (better quality = easier to verify accurately)
  // Tier 1 (best) = +10, Tier 4 (worst) = -10
  score += (5 - qualityTier) * 5;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get verification history for a passport
 */
export async function getVerificationHistory(passportId: string) {
  const { data: events, error } = await supabase
    .from("passport_events")
    .select("*")
    .eq("passport_id", passportId)
    .eq("event_type", "verification")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch verification history: ${error.message}`);
  }

  return events || [];
}

/**
 * Check if passport is verified
 */
export async function isPassportVerified(passportId: string): Promise<boolean> {
  const { data: passport } = await (supabase
    .from("material_passports")
    .select("verification_status, verification_score")
    .eq("id", passportId)
    .single() as any);

  return (
    passport?.verification_status === "verified" &&
    (passport?.verification_score || 0) >= 70
  );
}
