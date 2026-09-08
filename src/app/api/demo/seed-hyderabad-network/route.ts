import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const HYD_SEED_TAG = "hyd-network-seed-v2";

const admin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type SeedBody = {
  locality?: string;
  reset?: boolean;
};

async function resolveAccessToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieStore = await cookies();
  const direct = cookieStore.get("sb-access-token")?.value;
  if (direct) return direct;

  for (const c of cookieStore.getAll()) {
    if (!c.name.includes("auth-token")) continue;
    try {
      const parsed = JSON.parse(c.value);
      if (Array.isArray(parsed) && typeof parsed[0] === "string") {
        return parsed[0];
      }
    } catch {
      // ignore
    }
  }

  return null;
}

function slugifyLocality(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, "-");
}

async function getOrCreateCompany(params: {
  name: string;
  locality: string;
  entity_type: "manufacturer" | "recycler" | "processor" | "logistics" | "energy_recovery";
  industry: string;
}) {
  const { data: existing } = await admin
    .from("companies")
    .select("id")
    .eq("name", params.name)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await admin
    .from("companies")
    .insert({
      name: params.name,
      industry: params.industry,
      entity_type: params.entity_type,
      locality: params.locality,
      location: { city: params.locality, country: "IN" } as any,
      is_setup_complete: true,
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(`Failed creating company ${params.name}: ${error?.message}`);
  }
  return data.id;
}

async function getOrCreateAgent(params: {
  company_id: string;
  name: string;
  agent_type: "local" | "specialist_recycler" | "specialist_processor" | "specialist_logistics" | "super";
  locality: string;
  constraints?: Record<string, any>;
}) {
  const { data: existing } = await admin
    .from("agents")
    .select("id")
    .eq("company_id", params.company_id)
    .eq("agent_type", params.agent_type)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await admin
    .from("agents")
    .insert({
      company_id: params.company_id,
      name: params.name,
      agent_type: params.agent_type,
      locality: params.locality,
      status: "active",
      constraints: { ...(params.constraints || {}), seed_tag: HYD_SEED_TAG },
    })
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(`Failed creating agent ${params.name}: ${error?.message}`);
  }
  return data.id;
}

async function getOrCreatePassport(params: {
  owner_company_id: string;
  material_subtype: string;
  material_category: string;
  volume: number;
  unit: string;
  quality_tier: number;
  locality: string;
}) {
  const { data: existing } = await admin
    .from("material_passports")
    .select("id")
    .eq("current_owner_company_id", params.owner_company_id)
    .eq("material_subtype", params.material_subtype)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await admin
    .from("material_passports")
    .insert({
      passport_number: `HYD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      material_category: params.material_category,
      material_subtype: params.material_subtype,
      volume: params.volume,
      unit: params.unit,
      quality_tier: params.quality_tier,
      current_owner_company_id: params.owner_company_id,
      current_location: { city: params.locality, country: "IN" } as any,
      material_properties: { source: "seed", seed_tag: HYD_SEED_TAG } as any,
      compliance_data: { seed_tag: HYD_SEED_TAG } as any,
      is_active: true,
      verification_status: "verified",
    } as any)
    .select("id")
    .single();
  if (error || !data?.id) {
    throw new Error(`Failed creating passport ${params.material_subtype}: ${error?.message}`);
  }
  return data.id;
}

export async function POST(request: NextRequest) {
  try {
    const body = ((await request.json().catch(() => ({}))) || {}) as SeedBody;
    const accessToken = await resolveAccessToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: primaryCompany } = await admin
      .from("companies")
      .select("id, name, locality")
      .eq("user_id", user.id)
      .single();
    if (!primaryCompany?.id) {
      return NextResponse.json(
        { error: "Primary company not found for this user" },
        { status: 404 },
      );
    }

    const locality = slugifyLocality(body.locality || primaryCompany.locality || "hyderabad");

    if (body.reset ?? true) {
      const { data: oldSeedAgents } = await admin
        .from("agents")
        .select("id")
        .contains("constraints", { seed_tag: HYD_SEED_TAG } as any);
      const oldAgentIds = (oldSeedAgents || []).map((a) => a.id);
      if (oldAgentIds.length > 0) {
        await admin.from("agent_feed").delete().in("agent_id", oldAgentIds);
      }
      await admin
        .from("deals")
        .delete()
        .ilike("agent_reasoning", `%${HYD_SEED_TAG}%`);
    }

    const buyerCompanyId = primaryCompany.id;
    const recyclerA = await getOrCreateCompany({
      name: `Demo HydraCycle Recycler A (${locality})`,
      locality,
      entity_type: "recycler",
      industry: "recycling",
    });
    const recyclerB = await getOrCreateCompany({
      name: `Demo HydraCycle Recycler B (${locality})`,
      locality,
      entity_type: "recycler",
      industry: "recycling",
    });
    const processorA = await getOrCreateCompany({
      name: `Demo FerroFlux Processor A (${locality})`,
      locality,
      entity_type: "processor",
      industry: "processing",
    });
    const processorB = await getOrCreateCompany({
      name: `Demo FerroFlux Processor B (${locality})`,
      locality,
      entity_type: "processor",
      industry: "processing",
    });
    const logisticsA = await getOrCreateCompany({
      name: `Demo RouteGrid Logistics (${locality})`,
      locality,
      entity_type: "logistics",
      industry: "logistics",
    });
    const makerA = await getOrCreateCompany({
      name: `Demo AlloyForge Manufacturer (${locality})`,
      locality,
      entity_type: "manufacturer",
      industry: "manufacturing",
    });
    const superCompany = await getOrCreateCompany({
      name: `NexaApex ${locality}`,
      locality,
      entity_type: "manufacturer",
      industry: "coordination",
    });

    const localBuyerAgent = await getOrCreateAgent({
      company_id: buyerCompanyId,
      name: `Nexa-${primaryCompany.name}`,
      agent_type: "local",
      locality,
      constraints: { material_categories: ["ferrous-metals"] },
    });
    const recyclerAgentA = await getOrCreateAgent({
      company_id: recyclerA,
      name: `NexaPrime Recycler A - ${locality}`,
      agent_type: "specialist_recycler",
      locality,
      constraints: { accepted_material_categories: ["ferrous-metals"] },
    });
    const recyclerAgentB = await getOrCreateAgent({
      company_id: recyclerB,
      name: `NexaPrime Recycler B - ${locality}`,
      agent_type: "specialist_recycler",
      locality,
      constraints: { accepted_material_categories: ["ferrous-metals"] },
    });
    const processorAgentA = await getOrCreateAgent({
      company_id: processorA,
      name: `NexaPrime Processor A - ${locality}`,
      agent_type: "specialist_processor",
      locality,
      constraints: { input_materials: ["ferrous-metals"] },
    });
    const processorAgentB = await getOrCreateAgent({
      company_id: processorB,
      name: `NexaPrime Processor B - ${locality}`,
      agent_type: "specialist_processor",
      locality,
      constraints: { input_materials: ["ferrous-metals"] },
    });
    const logisticsAgent = await getOrCreateAgent({
      company_id: logisticsA,
      name: `NexaPrime Logistics - ${locality}`,
      agent_type: "specialist_logistics",
      locality,
      constraints: { service_regions: [locality] },
    });
    const makerAgent = await getOrCreateAgent({
      company_id: makerA,
      name: `Nexa-Demo AlloyForge - ${locality}`,
      agent_type: "local",
      locality,
      constraints: { material_categories: ["ferrous-metals"] },
    });
    const superAgent = await getOrCreateAgent({
      company_id: superCompany,
      name: `NexaApex-${locality}`,
      agent_type: "super",
      locality,
      constraints: { coordination_scope: "locality", auto_generated: true },
    });

    const passportRecyclerA = await getOrCreatePassport({
      owner_company_id: recyclerA,
      material_subtype: "shredded-ferrous-scrap",
      material_category: "ferrous-metals",
      volume: 320,
      unit: "tons",
      quality_tier: 2,
      locality,
    });
    const passportRecyclerB = await getOrCreatePassport({
      owner_company_id: recyclerB,
      material_subtype: "mixed-steel-offcuts",
      material_category: "ferrous-metals",
      volume: 240,
      unit: "tons",
      quality_tier: 2,
      locality,
    });
    const passportBuyer = await getOrCreatePassport({
      owner_company_id: buyerCompanyId,
      material_subtype: "ferrous-mill-scale",
      material_category: "ferrous-metals",
      volume: 180,
      unit: "tons",
      quality_tier: 2,
      locality,
    });

    const { data: feedRows } = await admin
      .from("agent_feed")
      .insert([
        {
          agent_id: recyclerAgentA,
          post_type: "offer",
          locality,
          visibility: "local",
          content: {
            material_category: "ferrous-metals",
            material_subtype: "shredded-ferrous-scrap",
            material: "shredded ferrous scrap",
            volume: 120,
            unit: "tons",
            price: 212,
            quality_tier: 2,
            passport_id: passportRecyclerA,
            seed_tag: HYD_SEED_TAG,
          },
        },
        {
          agent_id: recyclerAgentB,
          post_type: "offer",
          locality,
          visibility: "local",
          content: {
            material_category: "ferrous-metals",
            material_subtype: "mixed-steel-offcuts",
            material: "mixed steel offcuts",
            volume: 90,
            unit: "tons",
            price: 205,
            quality_tier: 2,
            passport_id: passportRecyclerB,
            seed_tag: HYD_SEED_TAG,
          },
        },
        {
          agent_id: processorAgentA,
          post_type: "request",
          locality,
          visibility: "local",
          content: {
            material_category: "ferrous-metals",
            volume_needed: 180,
            max_price: 228,
            quality_tier_max: 2,
            min_volume: 30,
            target_specialist: "processor",
            seed_tag: HYD_SEED_TAG,
          },
        },
        {
          agent_id: logisticsAgent,
          post_type: "announcement",
          locality,
          visibility: "local",
          content: {
            title: "Cluster pickup window open",
            description: `Backhaul slots opened for ${locality} recycler to processor routes this week.`,
            annual_volume: 480,
            estimated_value: 42000,
            seed_tag: HYD_SEED_TAG,
          },
        },
        {
          agent_id: superAgent,
          post_type: "announcement",
          locality,
          visibility: "local",
          content: {
            title: "Many-to-one opportunity detected",
            description:
              "Two recyclers can jointly supply one anchor manufacturer with staged deliveries and pooled logistics.",
            companies_involved: [
              `Demo HydraCycle Recycler A (${locality})`,
              `Demo HydraCycle Recycler B (${locality})`,
              primaryCompany.name,
            ],
            annual_volume: 2100,
            estimated_value: 502000,
            carbon_saved: 620,
            relation_type: "many_to_one",
            seed_tag: HYD_SEED_TAG,
          },
        },
        {
          agent_id: superAgent,
          post_type: "announcement",
          locality,
          visibility: "local",
          content: {
            title: "One-to-many allocation opportunity",
            description:
              "Single high-quality ferrous output can be split between processor and downstream manufacturer for higher margin.",
            companies_involved: [
              primaryCompany.name,
              `Demo FerroFlux Processor A (${locality})`,
              `Demo AlloyForge Manufacturer (${locality})`,
            ],
            annual_volume: 1650,
            estimated_value: 438000,
            carbon_saved: 510,
            relation_type: "one_to_many",
            seed_tag: HYD_SEED_TAG,
          },
        },
        {
          agent_id: superAgent,
          post_type: "deal_proposal",
          locality,
          visibility: "local",
          content: {
            summary:
              "Super-agent proposes pooled recycler lots into one 3-round negotiation with buyer and logistics guardrails.",
            relation_type: "many_to_one",
            seed_tag: HYD_SEED_TAG,
          },
        },
        {
          agent_id: superAgent,
          post_type: "deal_proposal",
          locality,
          visibility: "local",
          content: {
            summary:
              "Super-agent proposes one-to-many split: anchor buyer + processor with indexed price corridor.",
            relation_type: "one_to_many",
            seed_tag: HYD_SEED_TAG,
          },
        },
      ])
      .select("id, agent_id, content");

    const offerAId =
      feedRows?.find(
        (r) =>
          r.agent_id === recyclerAgentA &&
          ((r.content as any)?.passport_id as string | undefined) === passportRecyclerA,
      )?.id || null;
    const offerBId =
      feedRows?.find(
        (r) =>
          r.agent_id === recyclerAgentB &&
          ((r.content as any)?.passport_id as string | undefined) === passportRecyclerB,
      )?.id || null;

    if (offerAId) {
      await admin.from("deals").insert({
        seller_agent_id: recyclerAgentA,
        buyer_agent_id: localBuyerAgent,
        seller_company_id: recyclerA,
        buyer_company_id: buyerCompanyId,
        passport_id: passportRecyclerA,
        material_category: "ferrous-metals",
        material_subtype: "shredded-ferrous-scrap",
        volume: 55,
        unit: "tons",
        price_per_unit: 212,
        total_value: 11660,
        status: "pending_buyer_approval",
        negotiation_thread_id: offerAId,
        quality_tier: 2,
        duration_months: 2,
        payment_terms: "30 days",
        delivery_terms: "Delivered",
        agent_recommendation: "approved",
        agent_reasoning: `${HYD_SEED_TAG}: seeded pending buyer approval flow.`,
      } as any);
    }

    if (offerBId) {
      await admin.from("deals").insert({
        seller_agent_id: localBuyerAgent,
        buyer_agent_id: makerAgent,
        seller_company_id: buyerCompanyId,
        buyer_company_id: makerA,
        passport_id: passportBuyer,
        material_category: "ferrous-metals",
        material_subtype: "ferrous-mill-scale",
        volume: 35,
        unit: "tons",
        price_per_unit: 198,
        total_value: 6930,
        status: "pending_seller_approval",
        negotiation_thread_id: offerBId,
        quality_tier: 2,
        duration_months: 1,
        payment_terms: "15 days",
        delivery_terms: "Buyer pickup",
        agent_recommendation: "approved",
        agent_reasoning: `${HYD_SEED_TAG}: seeded pending seller approval flow.`,
      } as any);
    }

    return NextResponse.json({
      success: true,
      locality,
      message: "Hyderabad demo network seeded",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to seed Hyderabad network" },
      { status: 500 },
    );
  }
}
