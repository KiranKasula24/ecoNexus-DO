import { supabase } from "@/lib/database/supabase";
import { ensureSuperAgentForLocality } from "@/lib/agents/super-agent-registry";

export async function signUp(
  email: string,
  password: string,
  companyData: {
    name: string;
    industry: string;
    entity_type:
      | "manufacturer"
      | "recycler"
      | "processor"
      | "logistics"
      | "energy_recovery";
    address: string;
    city: string;
    country: string;
  },
) {
  try {
    console.log("1. Starting signup...");

    // 1️⃣ Try creating auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    // If user already exists → recover by signing in
    if (authError) {
      if (authError.message.includes("User already registered")) {
        console.warn("User already exists. Attempting recovery via sign in...");
        return await signIn(email, password);
      }

      console.error("Auth error:", authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error("User creation failed - no user returned");
    }

    const userId = authData.user.id;

    // 2️⃣ Determine locality
    const locality = companyData.city.toLowerCase().replace(/\s+/g, "-");

    console.log("2. Creating company for user:", userId);

    // 3️⃣ Create company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        user_id: userId,
        name: companyData.name,
        industry: companyData.industry,
        entity_type: companyData.entity_type,
        locality,
        location: {
          address: companyData.address,
          city: companyData.city,
          country: companyData.country,
          lat: 48.1351,
          lng: 11.582,
        },
      })
      .select()
      .single();

    if (companyError) {
      console.error("Company creation error:", companyError);
      throw new Error(`Company creation failed: ${companyError.message}`);
    }

    if (!company) {
      throw new Error("Company creation returned no data");
    }

    console.log("3. Creating agent for company:", company.id);

    // 4️⃣ Create agent
    const agentType =
      companyData.entity_type === "recycler"
        ? "specialist_recycler"
        : companyData.entity_type === "processor" ||
            companyData.entity_type === "energy_recovery"
          ? "specialist_processor"
          : companyData.entity_type === "logistics"
            ? "specialist_logistics"
            : "local";

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .insert({
        company_id: company.id,
        name: `Agent-${companyData.name}`,
        agent_type: agentType,
        locality,
        status: "active",
      })
      .select()
      .single();

    if (agentError) {
      console.warn(
        "Agent creation failed. It will be retried on first login:",
        agentError,
      );
    }

    await ensureSuperAgentForLocality({
      locality,
      city: companyData.city,
      country: companyData.country,
    });

    console.log("Signup complete!");

    return {
      user: authData.user,
      company,
      agent: agent || null,
      session: authData.session,
    };
  } catch (error) {
    console.error("SIGNUP FAILED:", error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log("1. Starting sign in...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("Login failed");

    const userId = data.user.id;

    console.log("2. Fetching company...");

    // ✅ Use maybeSingle instead of single
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (companyError) {
      console.error("Company fetch error:", companyError);
      throw companyError;
    }

    // If company missing → incomplete registration state
    if (!company) {
      throw new Error(
        "Account exists but company setup is incomplete. Please complete registration.",
      );
    }

    console.log("3. Checking for agent...");

    const { data: existingAgent, error: agentFetchError } = await supabase
      .from("agents")
      .select("id")
      .eq("company_id", company.id)
      .maybeSingle();

    if (agentFetchError) {
      console.warn("Agent fetch warning:", agentFetchError);
    }

    if (!existingAgent) {
      console.log("4. Creating agent on first login...");

      const agentType =
        company.entity_type === "recycler"
          ? "specialist_recycler"
          : company.entity_type === "processor" ||
              company.entity_type === "energy_recovery"
            ? "specialist_processor"
            : company.entity_type === "logistics"
              ? "specialist_logistics"
              : "local";

      const { error: agentCreateError } = await supabase.from("agents").insert({
        company_id: company.id,
        name: `Agent-${company.name}`,
        agent_type: agentType,
        locality: company.locality || "unknown",
        status: "active",
      });

      if (agentCreateError) {
        console.warn("Agent creation on login failed:", agentCreateError);
      }
    }

    const companyLocation = (company.location || {}) as {
      city?: string;
      country?: string;
    };
    await ensureSuperAgentForLocality({
      locality: company.locality,
      city: companyLocation.city,
      country: companyLocation.country,
    });

    return {
      user: data.user,
      company,
      session: data.session,
    };
  } catch (error) {
    console.error("SIGN IN FAILED:", error);
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (companyError || !company) return null;

    return {
      user,
      company,
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

