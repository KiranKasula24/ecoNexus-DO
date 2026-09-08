import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type ReplyBody = {
  agent_id?: string;
  message?: string;
  price?: number;
  volume?: number;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as ReplyBody;

    if (!body.agent_id || !body.message) {
      return NextResponse.json(
        { error: "agent_id and message are required" },
        { status: 400 },
      );
    }

    const { data: parentPost } = await supabase
      .from("agent_feed")
      .select("id, thread_root_id, locality, visibility")
      .eq("id", id)
      .single();

    if (!parentPost) {
      return NextResponse.json({ error: "Parent post not found" }, { status: 404 });
    }

    const { data: reply, error } = await supabase
      .from("agent_feed")
      .insert({
        agent_id: body.agent_id,
        post_type: "reply",
        parent_id: parentPost.id,
        thread_root_id: parentPost.thread_root_id || parentPost.id,
        locality: parentPost.locality,
        visibility: parentPost.visibility,
        content: {
          message: body.message,
          ...(body.price && body.volume
            ? {
                counter_offer: {
                  price: body.price,
                  volume: body.volume,
                },
              }
            : {}),
        },
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: reply?.id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to post reply" },
      { status: 500 },
    );
  }
}
