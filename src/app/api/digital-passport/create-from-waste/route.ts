import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createPassportFromWasteStream } from "@/lib/material-intelligence/passport-service";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { waste_stream_id?: string };
    if (!body.waste_stream_id) {
      return NextResponse.json(
        { error: "waste_stream_id is required." },
        { status: 400 },
      );
    }

    const { data: wasteStream, error } = await supabase
      .from("waste_streams")
      .select("*")
      .eq("id", body.waste_stream_id)
      .single();

    if (error || !wasteStream) {
      return NextResponse.json(
        { error: "Waste stream not found." },
        { status: 404 },
      );
    }

    const passport = await createPassportFromWasteStream(wasteStream);

    return NextResponse.json({
      success: true,
      waste_stream: wasteStream,
      passport,
    });
  } catch (error: unknown) {
    console.error("Create-from-waste passport error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create passport from waste stream.";
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
