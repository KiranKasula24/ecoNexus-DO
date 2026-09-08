import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/database/supabase";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    //  MUST await params in Next 16
    const { id: passportId } = await context.params;

    if (!passportId) {
      return NextResponse.json(
        { error: "Invalid passport ID" },
        { status: 400 },
      );
    }


    console.log("Fetching passport:", passportId);

    const { data: passport, error } = await supabase
      .from("material_passports")
      .select("*")
      .eq("id", passportId)
      .single();

    if (error || !passport) {
      return NextResponse.json(
        { error: "Passport not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      passport,
    });
  } catch (error: any) {
    console.error("Passport fetch error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to fetch passport" },
      { status: 500 },
    );
  }
}

