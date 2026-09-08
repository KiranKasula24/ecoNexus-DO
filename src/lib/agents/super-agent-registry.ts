import { supabase } from "@/lib/database/supabase";

type EnsureSuperAgentInput = {
  locality: string | null | undefined;
  city?: string | null;
  country?: string | null;
};

function normalizeLocality(locality: string): string {
  return locality.trim().toLowerCase().replace(/\s+/g, "-");
}

export async function ensureSuperAgentForLocality(
  input: EnsureSuperAgentInput,
): Promise<{ created: boolean; agentId?: string }> {
  if (!input.locality) return { created: false };

  const locality = normalizeLocality(input.locality);
  const sb = supabase as any;

  const { data: existingAgent } = await sb
    .from("agents")
    .select("id, company_id")
    .eq("agent_type", "super")
    .eq("locality", locality)
    .maybeSingle();

  if (existingAgent?.id) {
    try {
      await sb.from("super_agents").upsert(
        {
          locality,
          super_agent_id: existingAgent.id,
          company_id: existingAgent.company_id,
          status: "active",
        },
        { onConflict: "locality" },
      );
    } catch {
      // super_agents table may not exist yet; keep runtime resilient.
    }
    return { created: false, agentId: existingAgent.id };
  }

  const coordinatorName = `NexaApex ${locality}`;
  let companyId: string | undefined;

  const { data: existingCompany } = await sb
    .from("companies")
    .select("id")
    .eq("name", coordinatorName)
    .maybeSingle();
  companyId = existingCompany?.id;

  if (!companyId) {
    const { data: createdCompany, error: companyError } = await sb
      .from("companies")
      .insert({
        name: coordinatorName,
        industry: "coordination",
        entity_type: "manufacturer",
        locality,
        is_setup_complete: true,
        location: {
          city: input.city || locality,
          country: input.country || "unknown",
        },
      })
      .select("id")
      .single();

    if (companyError || !createdCompany?.id) {
      throw new Error(
        `Failed to create super-agent company for locality ${locality}: ${companyError?.message || "unknown error"}`,
      );
    }
    companyId = createdCompany.id;
  }

  const { data: createdAgent, error: agentError } = await sb
    .from("agents")
    .insert({
      company_id: companyId,
      name: `NexaApex-${locality}`,
      agent_type: "super",
      locality,
      status: "active",
      constraints: { auto_generated: true },
    })
    .select("id")
    .single();

  if (agentError || !createdAgent?.id) {
    throw new Error(
      `Failed to create super agent for locality ${locality}: ${agentError?.message || "unknown error"}`,
    );
  }

  try {
    await sb.from("super_agents").upsert(
      {
        locality,
        super_agent_id: createdAgent.id,
        company_id: companyId,
        status: "active",
      },
      { onConflict: "locality" },
    );
  } catch {
    // Optional table.
  }

  return { created: true, agentId: createdAgent.id };
}
