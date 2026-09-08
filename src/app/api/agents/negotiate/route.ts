import { NextResponse } from "next/server";
import { AgentRunner } from "@/lib/agents/agent-runner";

export async function POST() {
  try {
    const result = await AgentRunner.runAllAgents();
    return NextResponse.json({ success: true, stats: result.stats });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Negotiation cycle failed" },
      { status: 500 },
    );
  }
}
