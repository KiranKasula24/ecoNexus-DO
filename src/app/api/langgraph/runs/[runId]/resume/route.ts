import { NextRequest, NextResponse } from "next/server";

const agentUrl = process.env.LANGGRAPH_AGENT_URL ?? "http://localhost:8001";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;
  try {
    const response = await fetch(`${agentUrl}/runs/${encodeURIComponent(runId)}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to resume LangGraph run." },
      { status: 503 },
    );
  }
}
