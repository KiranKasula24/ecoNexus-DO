import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createPassportFromWasteStream } from "@/lib/material-intelligence/passport-service";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type CreatePayload = {
  waste_stream_id?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreatePayload;

    if (!body.waste_stream_id) {
      return NextResponse.json(
        { error: "waste_stream_id is required." },
        { status: 400 },
      );
    }

    const { data: wasteStream, error: wasteError } = await supabase
      .from("waste_streams")
      .select("*")
      .eq("id", body.waste_stream_id)
      .single();

    if (wasteError || !wasteStream) {
      return NextResponse.json(
        { error: "Waste stream not found." },
        { status: 404 },
      );
    }

    const passport = await createPassportFromWasteStream(wasteStream);

    return NextResponse.json({
      success: true,
      passport,
      waste_stream: wasteStream,
    });
  } catch (error: unknown) {
    console.error("Create passport error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create passport.";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
