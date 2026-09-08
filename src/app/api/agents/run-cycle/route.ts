import { NextResponse } from "next/server";
import { AgentRunner } from "@/lib/agents/agent-runner";

export async function POST() {
  try {
    console.log(" API: Starting agent cycle...");

    const result = await AgentRunner.runAllAgents();

    return NextResponse.json({
      success: result.success,
      stats: result.stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(" API: Agent cycle failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stats: {
          total_agents: 0,
          agents_run: 0,
          nexa_run: 0,
          nexaprime_run: 0,
          nexaapex_run: 0,
          total_actions: 0,
          errors: [error.message],
        },
      },
      { status: 500 },
    );
  }
}

