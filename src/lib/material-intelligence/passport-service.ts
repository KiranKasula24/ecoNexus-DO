import { supabase } from "@/lib/database/supabase";
import { Database } from "@/types/database";
import {
  calculateProcessabilityScore,
  calculateQualityTier,
  calculateRecyclableScore,
} from "./scoring";
import { generatePassportQR } from "@/lib/passport/qr-generator";
// Add this import

type WasteStreamRow = Database["public"]["Tables"]["waste_streams"]["Row"];
type PassportRow = Database["public"]["Tables"]["material_passports"]["Row"];

type QualityGrade = "A" | "B" | "C" | "D";

function requireValue<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}

function isQualityGrade(value: string): value is QualityGrade {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

export async function createPassportFromWasteStream(
  wasteStream: WasteStreamRow,
): Promise<PassportRow> {

  // Validate material_id exists
  const materialId = requireValue(
    wasteStream.material_id,
    `Waste stream ${wasteStream.id} is missing material_id`,
  );

  // Fetch material data
  const { data: material, error: materialError } = await (supabase
    .from("materials")
    .select(
      "id, material_category, material_subtype, physical_form, unit, carbon_footprint, technical_properties",
    )
    .eq("id", materialId)
    .single() as any);

  if (materialError) {
    throw new Error(`Failed to load material: ${materialError.message}`);
  }
  if (!material) {
    throw new Error(`Material not found for waste stream ${wasteStream.id}`);
  }

  // Extract and validate required fields
  const category = requireValue(
    material.material_category,
    `Material ${material.id} is missing material_category`,
  );
  const subtype = requireValue(
    material.material_subtype,
    `Material ${material.id} is missing material_subtype`,
  );
  const physicalForm = requireValue(
    material.physical_form,
    `Material ${material.id} is missing physical_form`,
  );
  const unit = requireValue(
    material.unit,
    `Material ${material.id} is missing unit`,
  );

  const qualityGrade = requireValue(
    wasteStream.quality_grade,
    `Waste stream ${wasteStream.id} is missing quality_grade`,
  );
  if (!isQualityGrade(qualityGrade)) {
    throw new Error(
      `Waste stream ${wasteStream.id} has invalid quality_grade: ${qualityGrade}`,
    );
  }

  // Calculate scores
  const contaminationLevel = wasteStream.contamination_level ?? 0;
  const tier = calculateQualityTier(qualityGrade, contaminationLevel);
  const processability = calculateProcessabilityScore(
    category,
    contaminationLevel,
  );
  const recyclable = calculateRecyclableScore(category, tier);

  // Build insert payload
  const passportData: any = {
    waste_stream_id: wasteStream.id,
    current_owner_company_id: wasteStream.company_id,
    material_category: category,
    material_subtype: subtype,
    physical_form: physicalForm,
    volume: wasteStream.monthly_volume,
    unit: unit,
    quality_grade: qualityGrade,
    quality_tier: tier,
    contamination_level: wasteStream.contamination_level,
    carbon_footprint: material.carbon_footprint,
    technical_properties: material.technical_properties,
  };

  // Insert passport
  const { data: passport, error: passportError } = await (supabase
    .from("material_passports")
    .insert(passportData)
    .select()
    .single() as any);

  if (passportError) {
    throw new Error(`Failed to create passport: ${passportError.message}`);
  }
  if (!passport) {
    throw new Error("Passport creation returned no data");
  }

  // Create passport event
  const eventData: any = {
    passport_id: passport.id,
    event_type: "creation",
    to_company_id: wasteStream.company_id,
    description: "Passport created from waste stream",
  };

  const { error: eventError } = await (supabase
    .from("passport_events")
    .insert(eventData) as any);

  if (eventError) {
    throw new Error(`Failed to create passport event: ${eventError.message}`);
  }

  // Update waste stream with passport link and scores
  const updateData: any = {
    passport_id: passport.id,
    processability_score: processability,
    recyclable_score: recyclable,
  };

  const { error: wasteStreamError } = await (
    supabase.from("waste_streams") as any
  )
    .update(updateData)
    .eq("id", wasteStream.id); // ← This line is missing in your code!

  if (wasteStreamError) {
    throw new Error(
      `Failed to update waste stream ${wasteStream.id}: ${wasteStreamError.message}`,
    );
  }
  // Generate QR code (non-blocking)
  generatePassportQR(passport.id).catch((error) => {
    console.error("QR generation failed (non-critical):", error);
  });

  return passport;
}

/**
 * Generate and store QR code for a passport
 * Called after passport creation
 */
export async function generatePassportQRCode(
  passportId: string,
): Promise<string> {
  const qrDataUrl = await generatePassportQR(passportId);

  // Optional: Store QR code URL in passport metadata
  // For now, we generate on-demand, but you could cache it

  return qrDataUrl;
}
