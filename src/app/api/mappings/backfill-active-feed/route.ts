import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getEffectiveMappingsForWasteSku } from "@/lib/mapping/processed-sku-mapper";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST() {
  try {
    const db: any = admin;
    const { data: offers } = await db
      .from("agent_feed")
      .select("id, content")
      .eq("post_type", "offer")
      .eq("is_active", true)
      .limit(1000);

    let updated = 0;
    for (const offer of offers || []) {
      const content = (offer.content || {}) as any;
      const wasteSku = String(
        content.sku ||
          content.waste_sku ||
          content.material_subtype ||
          content.material_category ||
          "",
      )
        .trim()
        .toUpperCase();
      if (!wasteSku) continue;

      const candidates = await getEffectiveMappingsForWasteSku(wasteSku);
      if (candidates.length === 0) continue;

      const top = candidates.slice(0, 5).map((c) => ({
        processed_sku: c.processed_sku,
        source: c.source,
        score_breakdown: {
          quality_score: c.quality_score,
          cost_competitiveness_score: c.cost_competitiveness_score,
          recovery_score: c.recovery_score,
          market_demand_score: c.market_demand_score,
        },
      }));

      await db
        .from("agent_feed")
        .update({
          content: {
            ...content,
            processed_sku_candidates: top,
            mapping_source: candidates[0].source,
          },
        })
        .eq("id", offer.id);
      updated++;
    }

    return NextResponse.json({ success: true, updated_posts: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Backfill failed" },
      { status: 500 },
    );
  }
}

