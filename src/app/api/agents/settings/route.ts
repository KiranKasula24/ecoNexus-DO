import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  try {
    const accessToken = (await cookies()).get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { data: agent, error } = await supabase
      .from("agents")
      .select("*")
      .eq("company_id", company.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, agent });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch agent settings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = (await cookies()).get("sb-access-token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { constraints, status } = (await request.json()) as {
      constraints?: Record<string, unknown>;
      status?: "active" | "paused";
    };

    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("agents")
      .update({
        ...(constraints ? { constraints } : {}),
        ...(status ? { status } : {}),
      })
      .eq("company_id", company.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, agent: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update agent settings" },
      { status: 500 },
    );
  }
}
