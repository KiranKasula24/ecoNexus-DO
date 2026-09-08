import { NextRequest, NextResponse } from "next/server";
import {
  generatePassportQR,
  generatePassportQRSVG,
} from "@/lib/passport/qr-generator";
import { supabase } from "@/lib/database/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    //  MUST await params in your Next version
    const { id: passportId } = await context.params;

    if (!passportId) {
      return NextResponse.json(
        { error: "Invalid passport ID" },
        { status: 400 },
      );
    }


    console.log("Looking for passport ID:", passportId);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "png";

    // 1 Verify passport exists
    const { data: passport, error } = await supabase
      .from("material_passports")
      .select(
        "id, material_category, material_subtype, current_owner_company_id",
      )
      .eq("id", passportId)
      .single();

    if (error || !passport) {
      console.log("Supabase error:", error);
      return NextResponse.json(
        { error: "Passport not found" },
        { status: 404 },
      );
    }

    console.log("Passport found:", passport);

    // 2 Generate QR
    if (format === "svg") {
      const qrSvg = await generatePassportQRSVG(passportId);

      return new NextResponse(qrSvg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Content-Disposition": `inline; filename="passport-${passportId}.svg"`,
        },
      });
    }

    // Default PNG (base64)
    const qrDataUrl = await generatePassportQR(passportId);

    return NextResponse.json({
      success: true,
      qr_code: qrDataUrl,
      passport_id: passportId,
    });
  } catch (error) {
    console.error("QR route error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

