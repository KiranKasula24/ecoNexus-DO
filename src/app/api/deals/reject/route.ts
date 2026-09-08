import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dealId = body?.deal_id as string | undefined;
    if (!dealId) {
      return NextResponse.json({ error: "deal_id is required" }, { status: 400 });
    }

    const response = await fetch(new URL("/api/deals/approve", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({ deal_id: dealId, action: "reject" }),
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to reject deal" },
      { status: 500 },
    );
  }
}
