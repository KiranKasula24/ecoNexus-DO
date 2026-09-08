import { NextRequest, NextResponse } from "next/server";

const agentUrl = process.env.LANGGRAPH_AGENT_URL ?? "http://localhost:8001";

export async function GET() {
  try {
    const response = await fetch(`${agentUrl}/health`, { cache: "no-store" });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json(
      { status: "unavailable", message: "LangGraph service is not reachable." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const response = await fetch(`${agentUrl}/runs/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start LangGraph run." },
      { status: 503 },
    );
  }
}
