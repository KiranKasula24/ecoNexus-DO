import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/database/supabase";
import { AgentRunner } from "@/lib/agents/agent-runner";
import type { Database } from "@/types/database";

type CompanyInsert = Database["public"]["Tables"]["companies"]["Insert"];
type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
type PassportInsert =
  Database["public"]["Tables"]["material_passports"]["Insert"];
type WasteInsert = Database["public"]["Tables"]["waste_streams"]["Insert"];
type MaterialInsert = Database["public"]["Tables"]["materials"]["Insert"];
type DealInsert = Database["public"]["Tables"]["deals"]["Insert"];

type SeedRequest = {
  reset?: boolean;
  run_cycle?: boolean;
};

const DEMO_TAG = "demo-agent-seed-v1";

const COMPANY_DEFS: Array<CompanyInsert & { key: string }> = [
  {
    key: "pit_supplier",
    name: "Demo Steel Stamping Works",
    industry: "manufacturing",
    entity_type: "manufacturer",
    locality: "pittsburgh",
    location: { city: "pittsburgh", state: "PA", country: "US" },
    is_setup_complete: true,
  },
  {
    key: "pit_buyer",
    name: "Demo Precision Cast Components",
    industry: "manufacturing",
    entity_type: "manufacturer",
    locality: "pittsburgh",
    location: { city: "pittsburgh", state: "PA", country: "US" },
    is_setup_complete: true,
  },
  {
    key: "pit_partner",
    name: "Demo Industrial Cement Blend",
    industry: "materials",
    entity_type: "manufacturer",
    locality: "pittsburgh",
    location: { city: "pittsburgh", state: "PA", country: "US" },
    is_setup_complete: true,
  },
  {
    key: "det_buyer",
    name: "Demo Detroit Fabrication Hub",
    industry: "automotive",
    entity_type: "manufacturer",
    locality: "detroit",
    location: { city: "detroit", state: "MI", country: "US" },
    is_setup_complete: true,
  },
  {
    key: "det_supplier",
    name: "Demo Motor Frame Forge",
    industry: "automotive",
    entity_type: "manufacturer",
    locality: "detroit",
    location: { city: "detroit", state: "MI", country: "US" },
    is_setup_complete: true,
  },
  {
    key: "recycler_co",
    name: "Demo Ferrous Recycler Prime",
    industry: "recycling",
    entity_type: "recycler",
    locality: "regional",
    location: { city: "cleveland", state: "OH", country: "US" },
    is_setup_complete: true,
  },
  {
    key: "processor_co",
    name: "Demo Alloy Upcycling Processor",
    industry: "processing",
    entity_type: "processor",
    locality: "regional",
    location: { city: "akron", state: "OH", country: "US" },
    is_setup_complete: true,
  },
  {
    key: "logistics_co",
    name: "Demo Rust Belt Logistics",
    industry: "logistics",
    entity_type: "logistics",
    locality: "regional",
    location: { city: "toledo", state: "OH", country: "US" },
    is_setup_complete: true,
  },
  {
    key: "super_pit",
    name: "Demo NexaApex Pittsburgh",
    industry: "coordination",
    entity_type: "manufacturer",
    locality: "pittsburgh",
    location: { city: "pittsburgh", state: "PA", country: "US" },
    is_setup_complete: true,
  },
  {
    key: "super_det",
    name: "Demo NexaApex Detroit",
    industry: "coordination",
    entity_type: "manufacturer",
    locality: "detroit",
    location: { city: "detroit", state: "MI", country: "US" },
    is_setup_complete: true,
  },
];

function must<T>(value: T | null | undefined, message: string): T {
  if (value == null) throw new Error(message);
  return value;
}

async function resetExistingSeedData(): Promise<void> {
  const names = COMPANY_DEFS.map((c) => c.name);
  const { data: existingCompanies } = await supabase
    .from("companies")
    .select("id")
    .in("name", names);

  const companyIds = (existingCompanies || []).map((c) => c.id);
  if (companyIds.length === 0) return;

  const { data: agents } = await supabase
    .from("agents")
    .select("id")
    .in("company_id", companyIds);
  const agentIds = (agents || []).map((a) => a.id);

  const { data: passports } = await supabase
    .from("material_passports")
    .select("id")
    .in("current_owner_company_id", companyIds);
  const passportIds = (passports || []).map((p) => p.id);

  if (passportIds.length > 0) {
    await supabase
      .from("passport_documents")
      .delete()
      .in("passport_id", passportIds);
    await supabase
      .from("passport_events")
      .delete()
      .in("passport_id", passportIds);
    await supabase
      .from("passport_transfers")
      .delete()
      .in("passport_id", passportIds);
  }

  await supabase.from("notifications").delete().in("company_id", companyIds);

  await supabase
    .from("three_way_deals")
    .delete()
    .in("supplier_company_id", companyIds);
  await supabase
    .from("three_way_deals")
    .delete()
    .in("processor_company_id", companyIds);
  await supabase
    .from("three_way_deals")
    .delete()
    .in("buyer_company_id", companyIds);

  await supabase.from("deals").delete().in("seller_company_id", companyIds);
  await supabase.from("deals").delete().in("buyer_company_id", companyIds);

  if (agentIds.length > 0) {
    await supabase
      .from("cross_locality_deals")
      .delete()
      .in("source_super_agent_id", agentIds);
    await supabase
      .from("cross_locality_deals")
      .delete()
      .in("destination_super_agent_id", agentIds);

    await supabase
      .from("multi_party_deals")
      .delete()
      .in("coordinator_agent_id", agentIds);

    await supabase.from("agent_feed").delete().in("agent_id", agentIds);
  }

  if (passportIds.length > 0) {
    await supabase.from("material_passports").delete().in("id", passportIds);
  }
  await supabase.from("waste_streams").delete().in("company_id", companyIds);
  await supabase.from("materials").delete().in("company_id", companyIds);
  await supabase
    .from("recycler_profiles")
    .delete()
    .in("company_id", companyIds);
  await supabase
    .from("processor_profiles")
    .delete()
    .in("company_id", companyIds);
  await supabase
    .from("logistics_profiles")
    .delete()
    .in("company_id", companyIds);

  if (agentIds.length > 0) {
    await supabase.from("agents").delete().in("id", agentIds);
  }
  await supabase.from("companies").delete().in("id", companyIds);
}

export async function POST(request: NextRequest) {
  try {
    const body = ((await request.json().catch(() => ({}))) ||
      {}) as SeedRequest;
    const reset = body.reset ?? true;
    const runCycle = body.run_cycle ?? true;

    if (reset) {
      await resetExistingSeedData();
    }

    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .insert(COMPANY_DEFS.map(({ key: _key, ...company }) => company))
      .select("id, name");

    if (companiesError)
      throw new Error(`Failed to insert companies: ${companiesError.message}`);
    const companyByName = new Map((companies || []).map((c) => [c.name, c.id]));
    const companyId = (key: string) => {
      const def = COMPANY_DEFS.find((c) => c.key === key);
      return must(
        def && companyByName.get(def.name),
        `Missing company ID for ${key}`,
      );
    };

    const agentDefs: Array<AgentInsert> = [
      {
        name: "Nexa-Demo Steel Stamping Works",
        company_id: companyId("pit_supplier"),
        agent_type: "local",
        locality: "pittsburgh",
        status: "active",
        constraints: { material_categories: ["ferrous-metals"] },
        performance: { seeded_by: DEMO_TAG },
      },
      {
        name: "Nexa-Demo Precision Cast Components",
        company_id: companyId("pit_buyer"),
        agent_type: "local",
        locality: "pittsburgh",
        status: "active",
        constraints: { material_categories: ["ferrous-metals"] },
        performance: { seeded_by: DEMO_TAG },
      },
      {
        name: "Nexa-Demo Industrial Cement Blend",
        company_id: companyId("pit_partner"),
        agent_type: "local",
        locality: "pittsburgh",
        status: "active",
        constraints: { material_categories: ["ferrous-metals"] },
        performance: { seeded_by: DEMO_TAG },
      },
      {
        name: "Nexa-Demo Detroit Fabrication Hub",
        company_id: companyId("det_buyer"),
        agent_type: "local",
        locality: "detroit",
        status: "active",
        constraints: { material_categories: ["ferrous-metals"] },
        performance: { seeded_by: DEMO_TAG },
      },
      {
        name: "Nexa-Demo Motor Frame Forge",
        company_id: companyId("det_supplier"),
        agent_type: "local",
        locality: "detroit",
        status: "active",
        constraints: { material_categories: ["ferrous-metals"] },
        performance: { seeded_by: DEMO_TAG },
      },
      {
        name: "NexaPrime Recycler - Ferrous",
        company_id: companyId("recycler_co"),
        agent_type: "specialist_recycler",
        locality: "global",
        status: "active",
        constraints: { accepted_material_categories: ["ferrous-metals"] },
        performance: { seeded_by: DEMO_TAG },
      },
      {
        name: "NexaPrime Processor - Alloy",
        company_id: companyId("processor_co"),
        agent_type: "specialist_processor",
        locality: "regional",
        status: "active",
        constraints: {
          input_materials: ["steel-scrap", "iron-scrap"],
          output_materials: ["recycled-steel"],
        },
        performance: { seeded_by: DEMO_TAG },
      },
      {
        name: "NexaPrime Logistics - Rust Belt",
        company_id: companyId("logistics_co"),
        agent_type: "specialist_logistics",
        locality: "regional",
        status: "active",
        constraints: { service_regions: ["pittsburgh", "detroit", "regional"] },
        performance: { seeded_by: DEMO_TAG },
      },
      {
        name: "NexaApex Pittsburgh",
        company_id: companyId("super_pit"),
        agent_type: "super",
        locality: "pittsburgh",
        status: "active",
        constraints: { can_coordinate_cross_locality: true },
        performance: { seeded_by: DEMO_TAG },
      },
      {
        name: "NexaApex Detroit",
        company_id: companyId("super_det"),
        agent_type: "super",
        locality: "detroit",
        status: "active",
        constraints: { can_coordinate_cross_locality: true },
        performance: { seeded_by: DEMO_TAG },
      },
    ];

    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .insert(agentDefs)
      .select("id, name, company_id, agent_type, locality");
    if (agentsError)
      throw new Error(`Failed to insert agents: ${agentsError.message}`);

    const findAgent = (agentName: string) =>
      must(
        agents?.find((a) => a.name === agentName)?.id,
        `Missing agent: ${agentName}`,
      );

    const localSupplierAgent = findAgent("Nexa-Demo Steel Stamping Works");
    const localBuyerAgent = findAgent("Nexa-Demo Precision Cast Components");
    const detBuyerAgent = findAgent("Nexa-Demo Detroit Fabrication Hub");
    const recyclerAgent = findAgent("NexaPrime Recycler - Ferrous");
    const processorAgent = findAgent("NexaPrime Processor - Alloy");
    const logisticsAgent = findAgent("NexaPrime Logistics - Rust Belt");
    const superPitAgent = findAgent("NexaApex Pittsburgh");
    const superDetAgent = findAgent("NexaApex Detroit");

    await supabase.from("recycler_profiles").insert({
      company_id: companyId("recycler_co"),
      accepted_material_categories: ["ferrous-metals"],
      processing_capacity_tons_month: 800,
      min_pickup_volume_tons: 8,
      max_contamination_tolerance: 12,
      buy_prices_per_ton: { "ferrous-metals": 215 },
      base_processing_fee_per_ton: { shredding: 35, sorting: 22 },
      processing_methods: ["sorting", "magnetic-separation", "shredding"],
      output_quality_tiers: [1, 2, 3],
      geographic_service_area: "national",
      is_setup_complete: true,
    } as any);

    await supabase.from("processor_profiles").insert({
      company_id: companyId("processor_co"),
      processing_capacity_tons_month: 650,
      current_utilization_percentage: 52,
      input_materials: ["steel-scrap", "iron-scrap"],
      output_materials: ["recycled-steel"],
      processing_services: ["melting", "alloy-blending", "casting"],
      processing_fee_per_ton: {
        melting: 70,
        "alloy-blending": 85,
        casting: 95,
      },
      output_quality_guarantee: { min_tier: 2, max_tier: 1 },
      value_share_model: "service_fee",
      geographic_service_area: "regional",
      is_setup_complete: true,
    } as any);

    await supabase.from("logistics_profiles").insert({
      company_id: companyId("logistics_co"),
      base_rate_per_ton_km: 0.16,
      consolidation_discount_percentage: 18,
      available_capacity_tons_week: 180,
      minimum_load_tons: 7,
      max_distance_km: 850,
      accepts_backhaul: true,
      optimization_priority: "cost",
      current_routes: ["pittsburgh-detroit", "detroit-pittsburgh"],
      service_regions: ["pittsburgh", "detroit", "regional"],
      vehicle_types: ["flatbed", "covered-truck"],
      material_specializations: ["ferrous-metals"],
      fleet_capacity: { trucks: 14, total_capacity_tons: 420 },
      is_setup_complete: true,
    } as any);

    const materialRows: MaterialInsert[] = [
      {
        company_id: companyId("pit_supplier"),
        category: "waste",
        material_type: "steel-turnings",
        material_category: "ferrous-metals",
        material_subtype: "steel-turnings",
        physical_form: "solid",
        monthly_volume: 120,
        unit: "tons",
        cost_per_unit: 70,
        technical_properties: { source_type: "waste", seed: DEMO_TAG },
      },
      {
        company_id: companyId("pit_buyer"),
        category: "input",
        material_type: "recycled-steel",
        material_category: "ferrous-metals",
        material_subtype: "recycled-steel",
        physical_form: "solid",
        monthly_volume: 90,
        unit: "tons",
        cost_per_unit: 260,
        technical_properties: { source_type: "requirement", seed: DEMO_TAG },
      },
      {
        company_id: companyId("pit_partner"),
        category: "input",
        material_type: "ferrous-fines",
        material_category: "ferrous-metals",
        material_subtype: "mill-scale",
        physical_form: "powder",
        monthly_volume: 40,
        unit: "tons",
        cost_per_unit: 180,
        technical_properties: { source_type: "requirement", seed: DEMO_TAG },
      },
      {
        company_id: companyId("det_supplier"),
        category: "waste",
        material_type: "steel-offcuts",
        material_category: "ferrous-metals",
        material_subtype: "steel-offcuts",
        physical_form: "solid",
        monthly_volume: 160,
        unit: "tons",
        cost_per_unit: 65,
        technical_properties: { source_type: "waste", seed: DEMO_TAG },
      },
      {
        company_id: companyId("det_buyer"),
        category: "input",
        material_type: "recycled-steel",
        material_category: "ferrous-metals",
        material_subtype: "recycled-steel",
        physical_form: "solid",
        monthly_volume: 140,
        unit: "tons",
        cost_per_unit: 285,
        technical_properties: { source_type: "requirement", seed: DEMO_TAG },
      },
    ];

    const { data: materials, error: materialsError } = await supabase
      .from("materials")
      .insert(materialRows as any)
      .select("id, company_id, material_subtype");
    if (materialsError)
      throw new Error(`Failed to insert materials: ${materialsError.message}`);

    const pitWasteMaterialId = must(
      materials?.find((m) => m.company_id === companyId("pit_supplier"))?.id,
      "Missing pit waste material",
    );
    const detWasteMaterialId = must(
      materials?.find((m) => m.company_id === companyId("det_supplier"))?.id,
      "Missing detroit waste material",
    );

    const wasteRows: WasteInsert[] = [
      {
        company_id: companyId("pit_supplier"),
        material_id: pitWasteMaterialId,
        classification: "ferrous-metals",
        monthly_volume: 120,
        quality_grade: "2",
        contamination_level: 6,
        potential_value: 22000,
        current_disposal_cost: 8400,
      },
      {
        company_id: companyId("det_supplier"),
        material_id: detWasteMaterialId,
        classification: "ferrous-metals",
        monthly_volume: 160,
        quality_grade: "2",
        contamination_level: 8,
        potential_value: 28800,
        current_disposal_cost: 11200,
      },
    ];

    const { data: wasteStreams, error: wasteError } = await supabase
      .from("waste_streams")
      .insert(wasteRows)
      .select("id, company_id");
    if (wasteError)
      throw new Error(`Failed to insert waste streams: ${wasteError.message}`);

    const pitWasteId = must(
      wasteStreams?.find((w) => w.company_id === companyId("pit_supplier"))?.id,
      "Missing pit waste stream",
    );
    const detWasteId = must(
      wasteStreams?.find((w) => w.company_id === companyId("det_supplier"))?.id,
      "Missing detroit waste stream",
    );

    const passportRows: PassportInsert[] = [
      {
        material_category: "ferrous-metals",
        material_subtype: "steel-turnings",
        physical_form: "solid",
        unit: "tons",
        volume: 120,
        quality_tier: 2,
        verification_status: "verified",
        verification_score: 88,
        current_owner_company_id: companyId("pit_supplier"),
        waste_stream_id: pitWasteId,
        technical_properties: { seeded: true, seed_tag: DEMO_TAG },
      },
      {
        material_category: "ferrous-metals",
        material_subtype: "steel-offcuts",
        physical_form: "solid",
        unit: "tons",
        volume: 160,
        quality_tier: 2,
        verification_status: "verified",
        verification_score: 84,
        current_owner_company_id: companyId("det_supplier"),
        waste_stream_id: detWasteId,
        technical_properties: { seeded: true, seed_tag: DEMO_TAG },
      },
    ];

    const { data: passports, error: passportsError } = await supabase
      .from("material_passports")
      .insert(passportRows)
      .select("id, current_owner_company_id");
    if (passportsError)
      throw new Error(`Failed to insert passports: ${passportsError.message}`);

    const pitPassportId = must(
      passports?.find(
        (p) => p.current_owner_company_id === companyId("pit_supplier"),
      )?.id,
      "Missing pit passport",
    );
    const detPassportId = must(
      passports?.find(
        (p) => p.current_owner_company_id === companyId("det_supplier"),
      )?.id,
      "Missing detroit passport",
    );

    await supabase
      .from("waste_streams")
      .update({ passport_id: pitPassportId })
      .eq("id", pitWasteId);
    await supabase
      .from("waste_streams")
      .update({ passport_id: detPassportId })
      .eq("id", detWasteId);

    const { data: offerPost } = await supabase
      .from("agent_feed")
      .insert({
        agent_id: localSupplierAgent,
        post_type: "offer",
        locality: "pittsburgh",
        visibility: "local",
        is_active: true,
        content: {
          material_category: "ferrous-metals",
          material_subtype: "steel-turnings",
          material: "steel-turnings",
          volume: 90,
          unit: "tons",
          price: 210,
          quality_tier: 2,
          passport_id: pitPassportId,
          seed_tag: DEMO_TAG,
        },
      })
      .select("id")
      .single();

    const offerId = must(offerPost?.id, "Failed to create seed offer");

    const { data: reply1 } = await supabase
      .from("agent_feed")
      .insert({
        agent_id: localBuyerAgent,
        post_type: "reply",
        parent_id: offerId,
        thread_root_id: offerId,
        locality: "pittsburgh",
        visibility: "local",
        content: {
          message: "Interested in your ferrous stream, sharing a counter.",
          counter_offer: { price: 222, volume: 70, terms: "30 days" },
          seed_tag: DEMO_TAG,
        },
      })
      .select("id")
      .single();

    const reply1Id = must(reply1?.id, "Failed to create first reply");

    const { data: reply2 } = await supabase
      .from("agent_feed")
      .insert({
        agent_id: localSupplierAgent,
        post_type: "reply",
        parent_id: reply1Id,
        thread_root_id: offerId,
        locality: "pittsburgh",
        visibility: "local",
        content: {
          message: "Counter accepted with updated terms.",
          counter_offer: { price: 218, volume: 70, terms: "EXW pickup" },
          seed_tag: DEMO_TAG,
        },
      })
      .select("id")
      .single();

    const negotiationLeafId = must(reply2?.id, "Failed to create second reply");

    const bilateralDeals: DealInsert[] = [
      {
        seller_agent_id: localSupplierAgent,
        buyer_agent_id: localBuyerAgent,
        seller_company_id: companyId("pit_supplier"),
        buyer_company_id: companyId("pit_buyer"),
        passport_id: pitPassportId,
        material_category: "ferrous-metals",
        material_subtype: "steel-turnings",
        volume: 70,
        unit: "tons",
        price_per_unit: 218,
        total_value: 15260,
        status: "pending_seller_approval",
        payment_terms: "30 days",
        delivery_terms: "EXW pickup",
        quality_tier: 2,
        duration_months: 3,
        negotiation_thread_id: offerId,
        agent_recommendation: "approved",
        agent_reasoning: `${DEMO_TAG}: bilateral negotiation converged quickly.`,
      },
      {
        seller_agent_id: findAgent("Nexa-Demo Motor Frame Forge"),
        buyer_agent_id: detBuyerAgent,
        seller_company_id: companyId("det_supplier"),
        buyer_company_id: companyId("det_buyer"),
        passport_id: detPassportId,
        material_category: "ferrous-metals",
        material_subtype: "steel-offcuts",
        volume: 60,
        unit: "tons",
        price_per_unit: 226,
        total_value: 13560,
        status: "pending_buyer_approval",
        payment_terms: "15 days",
        delivery_terms: "Delivered",
        quality_tier: 2,
        duration_months: 2,
        agent_recommendation: "approved",
        agent_reasoning: `${DEMO_TAG}: buyer-side pending approval scenario.`,
      },
      {
        seller_agent_id: localSupplierAgent,
        buyer_agent_id: detBuyerAgent,
        seller_company_id: companyId("pit_supplier"),
        buyer_company_id: companyId("det_buyer"),
        passport_id: pitPassportId,
        material_category: "ferrous-metals",
        material_subtype: "steel-turnings",
        volume: 85,
        unit: "tons",
        price_per_unit: 230,
        total_value: 19550,
        status: "approved_both_parties",
        payment_terms: "30 days",
        delivery_terms: "FOB origin",
        quality_tier: 2,
        duration_months: 6,
        agent_recommendation: "approved",
        agent_reasoning: `${DEMO_TAG}: approved deal for logistics consolidation.`,
      },
      {
        seller_agent_id: findAgent("Nexa-Demo Motor Frame Forge"),
        buyer_agent_id: localBuyerAgent,
        seller_company_id: companyId("det_supplier"),
        buyer_company_id: companyId("pit_buyer"),
        passport_id: detPassportId,
        material_category: "ferrous-metals",
        material_subtype: "steel-offcuts",
        volume: 50,
        unit: "tons",
        price_per_unit: 224,
        total_value: 11200,
        status: "pending_logistics",
        payment_terms: "30 days",
        delivery_terms: "Delivered",
        quality_tier: 2,
        duration_months: 4,
        agent_recommendation: "approved",
        agent_reasoning: `${DEMO_TAG}: waiting logistics assignment scenario.`,
      },
    ];

    const { data: createdDeals, error: dealsError } = await supabase
      .from("deals")
      .insert(bilateralDeals)
      .select("id");
    if (dealsError)
      throw new Error(
        `Failed to insert bilateral deals: ${dealsError.message}`,
      );
    const firstDealId = must(
      createdDeals?.[0]?.id,
      "Missing first bilateral deal",
    );

    await supabase.from("agent_feed").insert({
      agent_id: localBuyerAgent,
      post_type: "deal_proposal",
      parent_id: negotiationLeafId,
      thread_root_id: offerId,
      locality: "pittsburgh",
      visibility: "local",
      content: {
        deal_id: firstDealId,
        summary: "Deal proposed: 70 tons ferrous-metals @ EUR 218/ton",
        seed_tag: DEMO_TAG,
      },
    });

    await supabase.from("three_way_deals").insert({
      supplier_company_id: companyId("pit_supplier"),
      processor_company_id: companyId("processor_co"),
      buyer_company_id: companyId("det_buyer"),
      material_in: "steel-turnings",
      material_out: "recycled-steel",
      volume_tons_month: 45,
      supplier_price_per_ton: 210,
      processing_fee_per_ton: 72,
      buyer_price_per_ton: 298,
      processing_time_days: 8,
      total_value_annual: 160920,
      status: "proposed",
      supplier_approved: false,
      processor_approved: true,
      buyer_approved: false,
    });

    const { data: mpDeal, error: mpError } = await supabase
      .from("multi_party_deals")
      .insert({
        participating_company_ids: [
          companyId("pit_supplier"),
          companyId("pit_buyer"),
          companyId("pit_partner"),
        ],
        flows: [
          {
            seller_company_id: companyId("pit_supplier"),
            buyer_company_id: companyId("pit_buyer"),
            material_category: "ferrous-metals",
            material_subtype: "steel-turnings",
            volume: 40,
            price_per_unit: 216,
            passport_id: pitPassportId,
          },
          {
            seller_company_id: companyId("pit_buyer"),
            buyer_company_id: companyId("pit_partner"),
            material_category: "ferrous-metals",
            material_subtype: "mill-scale",
            volume: 20,
            price_per_unit: 185,
            passport_id: pitPassportId,
          },
        ],
        value_distribution: {
          [companyId("pit_supplier")]: 58000,
          [companyId("pit_buyer")]: 42000,
          [companyId("pit_partner")]: 26000,
        },
        approvals: {
          [companyId("pit_supplier")]: {
            approved: true,
            approved_at: new Date().toISOString(),
          },
          [companyId("pit_buyer")]: { approved: false },
          [companyId("pit_partner")]: { approved: false },
        },
        total_annual_value: 126000,
        carbon_savings_tons_year: 410,
        status: "partial_approval",
        coordination_fee_percentage: 5,
        coordinator_agent_id: superPitAgent,
        proposal_expires_at: new Date(
          Date.now() + 10 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      })
      .select("id")
      .single();
    if (mpError)
      throw new Error(`Failed to insert multi-party deal: ${mpError.message}`);

    const mpDealId = must(mpDeal?.id, "Missing multi-party deal ID");

    await supabase.from("deals").insert({
      seller_agent_id: localSupplierAgent,
      buyer_agent_id: localBuyerAgent,
      seller_company_id: companyId("pit_supplier"),
      buyer_company_id: companyId("pit_buyer"),
      passport_id: pitPassportId,
      material_category: "ferrous-metals",
      material_subtype: "steel-turnings",
      volume: 40,
      unit: "tons",
      price_per_unit: 216,
      total_value: 8640,
      status: "pending_multi_party_approval",
      multi_party_deal_id: mpDealId,
      duration_months: 12,
      quality_tier: 2,
      payment_terms: "30 days",
      delivery_terms: "Ex-works",
      agent_recommendation: "approved",
      agent_reasoning: `${DEMO_TAG}: linked bilateral flow for multi-party deal.`,
    });

    await supabase.from("cross_locality_deals").insert({
      source_locality: "pittsburgh",
      source_super_agent_id: superPitAgent,
      destination_locality: "detroit",
      destination_super_agent_id: superDetAgent,
      material_category: "ferrous-metals",
      volume_tons_month: 95,
      price_per_unit: 236,
      transport_cost_per_unit: 28,
      total_annual_value: 268920,
      participating_companies: {
        sellers: [companyId("pit_supplier")],
        buyers: [companyId("det_buyer")],
      },
      status: "agreed",
      coordination_fee_percentage: 3,
    });

    await supabase.from("agent_feed").insert([
      {
        agent_id: superPitAgent,
        post_type: "announcement",
        locality: "pittsburgh",
        visibility: "local",
        content: {
          type: "multi_party_deal_proposed",
          title: "Three-company ferrous loop identified",
          description:
            "NexaApex structured a multi-party deal linking stamping waste, casting demand, and mineral blending.",
          companies_involved: [
            "Demo Steel Stamping Works",
            "Demo Precision Cast Components",
            "Demo Industrial Cement Blend",
          ],
          estimated_value: 126000,
          carbon_saved: 410,
          annual_volume: 720,
          seed_tag: DEMO_TAG,
        },
      },
      {
        agent_id: superDetAgent,
        post_type: "announcement",
        locality: "detroit",
        visibility: "local",
        content: {
          type: "cross_locality_opportunity",
          title: "Cross-locality ferrous supply corridor",
          description:
            "NexaApex agreed a Pittsburgh to Detroit ferrous stream with transport optimization.",
          source_locality: "pittsburgh",
          destination_locality: "detroit",
          annual_value: 268920,
          volume: 95,
          price: 236,
          role: "buyer",
          seed_tag: DEMO_TAG,
        },
      },
      {
        agent_id: processorAgent,
        post_type: "announcement",
        locality: "regional",
        visibility: "public",
        content: {
          type: "three_way_processing_deal",
          title: "Processor structured three-way deal",
          description:
            "Supplier steel-turnings to processor to buyer recycled-steel flow proposed.",
          seed_tag: DEMO_TAG,
        },
      },
      {
        agent_id: logisticsAgent,
        post_type: "offer",
        locality: "regional",
        visibility: "public",
        content: {
          type: "backhaul_offer",
          route: "detroit-pittsburgh",
          available_capacity: 24,
          rate: 0.09,
          departure_window: "next week",
          discount_reason: "backhaul optimization",
          seed_tag: DEMO_TAG,
        },
      },
      {
        agent_id: recyclerAgent,
        post_type: "request",
        locality: "global",
        visibility: "public",
        content: {
          material_category: "ferrous-metals",
          volume_needed: 999999,
          max_price: 225,
          quality_tier_max: 3,
          min_volume: 8,
          seed_tag: DEMO_TAG,
        },
      },
    ]);

    let cycle: Awaited<ReturnType<typeof AgentRunner.runAllAgents>> | null =
      null;
    if (runCycle) {
      cycle = await AgentRunner.runAllAgents();
    }

    return NextResponse.json({
      success: true,
      seed_tag: DEMO_TAG,
      counts: {
        companies: COMPANY_DEFS.length,
        agents: agentDefs.length,
        materials: materialRows.length,
        waste_streams: wasteRows.length,
        passports: passportRows.length,
        bilateral_deals: bilateralDeals.length + 1,
      },
      cycle,
    });
  } catch (error: any) {
    console.error("Demo agent seed failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to seed demo data",
      },
      { status: 500 },
    );
  }
}
