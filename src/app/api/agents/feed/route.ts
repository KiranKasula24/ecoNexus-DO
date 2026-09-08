import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { cookies } from "next/headers";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(request: NextRequest) {
  const { admin, user } = await resolveUserFromRequest(request);
  const { searchParams } = new URL(request.url);
  const localityParam = searchParams.get("locality");
  const bypassLocality = searchParams.get("bypass_locality") === "1";
  const postType = searchParams.get("post_type");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 150);

  let query = admin
    .from("agent_feed")
    .select(
      `
      *,
      agent:agent_id (
        id,
        name,
        agent_type,
        company_id
      )
    `,
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (postType) query = query.eq("post_type", postType);

  const { data: rawPosts, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let userLocality: string | null = null;
  if (user?.id) {
    const { data: userCompany } = await admin
      .from("companies")
      .select("locality")
      .eq("user_id", user.id)
      .single();
    userLocality = userCompany?.locality || null;
  }

  const normalizeLocality = (value: string | null | undefined) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

  const normalizedUserLocality = normalizeLocality(userLocality);
  const normalizedLocalityParam = normalizeLocality(localityParam);

  const visiblePosts = (rawPosts || []).filter((post: any) => {
    const postLocality = normalizeLocality(post.locality);
    if (localityParam) return postLocality === normalizedLocalityParam;
    if (post.visibility === "public" || post.visibility === "regional") return true;
    if (post.visibility === "local") {
      if (bypassLocality) return true;
      return !!normalizedUserLocality && postLocality === normalizedUserLocality;
    }
    return false;
  });

  const companyIds = Array.from(
    new Set(
      visiblePosts
        .map((post: any) => post.agent?.company_id)
        .filter((id: string | undefined) => !!id),
    ),
  );

  let companyMap = new Map<string, { name: string; entity_type: string | null }>();
  if (companyIds.length > 0) {
    const { data: companies } = await admin
      .from("companies")
      .select("id, name, entity_type")
      .in("id", companyIds);
    companyMap = new Map(
      (companies || []).map((company) => [
        company.id,
        { name: company.name, entity_type: company.entity_type },
      ]),
    );
  }

  let posts = visiblePosts.map((post: any) => ({
    ...post,
    company: companyMap.get(post.agent?.company_id) || {
      name: "Unknown",
      entity_type: "unknown",
    },
  }));

  // Fallback: if strict locality yielded no rows, return public/regional + local rows.
  if (posts.length === 0 && !localityParam) {
    posts = (rawPosts || [])
      .filter(
        (post: any) =>
          post.visibility === "public" ||
          post.visibility === "regional" ||
          post.visibility === "local",
      )
      .map((post: any) => ({
        ...post,
        company: companyMap.get(post.agent?.company_id) || {
          name: "Unknown",
          entity_type: "unknown",
        },
      }));
  }

  return NextResponse.json({ success: true, posts });
}

type SellPostBody = {
  mode?: "sell_offer" | "nexaprime_request";
  passport_id?: string;
  price?: number;
  volume?: number;
  visibility?: "local" | "public" | "regional";
  target_specialist_type?:
    | "specialist_recycler"
    | "specialist_processor"
    | "specialist_logistics";
  material_category?: string;
  quality_tier_max?: number;
  max_price?: number;
  message?: string;
};

async function resolveUserFromRequest(request: NextRequest) {
  const admin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const authHeader = request.headers.get("authorization");
  let token: string | null = null;
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("sb-access-token")?.value || null;
    if (!token) {
      for (const c of cookieStore.getAll()) {
        if (c.name.includes("auth-token")) {
          try {
            const parsed = JSON.parse(c.value);
            if (Array.isArray(parsed) && typeof parsed[0] === "string") {
              token = parsed[0];
              break;
            }
          } catch {
            // noop
          }
        }
      }
    }
  }

  if (!token) return { admin, user: null };
  const {
    data: { user },
  } = await admin.auth.getUser(token);
  return { admin, user };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SellPostBody;

    const { admin, user } = await resolveUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: company } = await admin
      .from("companies")
      .select("id, locality")
      .eq("user_id", user.id)
      .single();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { data: sellerAgent } = await admin
      .from("agents")
      .select("id")
      .eq("company_id", company.id)
      .single();
    if (!sellerAgent?.id) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (body.mode === "nexaprime_request") {
      if (!body.target_specialist_type || !body.material_category || !body.volume) {
        return NextResponse.json(
          {
            error:
              "target_specialist_type, material_category and volume are required for NexaPrime requests",
          },
          { status: 400 },
        );
      }

      const { data: requestPost, error: requestError } = await admin
        .from("agent_feed")
        .insert({
          agent_id: sellerAgent.id,
          post_type: "request",
          locality: company.locality || "unknown",
          visibility: body.visibility || "local",
          is_active: true,
          content: {
            material_category: body.material_category,
            volume_needed: Number(body.volume),
            max_price: Number(body.max_price || 0),
            quality_tier_max: Number(body.quality_tier_max || 3),
            min_volume: Math.max(1, Math.floor(Number(body.volume || 0) * 0.2)),
            target_specialist_type: body.target_specialist_type,
            request_scope: "nexaprime",
            message:
              body.message ||
              `Seeking ${body.target_specialist_type} support for ${body.material_category}`,
          },
        })
        .select("id")
        .single();

      if (requestError || !requestPost?.id) {
        return NextResponse.json(
          { error: requestError?.message || "Failed to create NexaPrime request" },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true, post_id: requestPost.id });
    }

    if (!body.passport_id) {
      return NextResponse.json(
        { error: "passport_id is required for sell offers" },
        { status: 400 },
      );
    }

    const { data: passport } = await admin
      .from("material_passports")
      .select("*")
      .eq("id", body.passport_id)
      .eq("current_owner_company_id", company.id)
      .single();
    if (!passport) {
      return NextResponse.json(
        { error: "Passport not found or not owned by your company" },
        { status: 404 },
      );
    }

    const volume = Math.min(
      Number(body.volume || passport.volume || 0),
      Number(passport.volume || 0),
    );
    const price = Number(body.price || 0);
    if (!volume || !price) {
      return NextResponse.json(
        { error: "Valid price and volume are required" },
        { status: 400 },
      );
    }

    const { data: post, error } = await admin
      .from("agent_feed")
      .insert({
        agent_id: sellerAgent.id,
        post_type: "offer",
        locality: company.locality || "unknown",
        visibility: body.visibility || "local",
        is_active: true,
        content: {
          passport_id: passport.id,
          material_category: passport.material_category,
          material_subtype: passport.material_subtype,
          material: passport.material_subtype,
          quality_tier: passport.quality_tier || 2,
          volume,
          unit: passport.unit || "tons",
          price,
        },
      })
      .select("id")
      .single();

    if (error || !post?.id) {
      return NextResponse.json(
        { error: error?.message || "Failed to create sell offer" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, post_id: post.id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create sell post" },
      { status: 500 },
    );
  }
}
