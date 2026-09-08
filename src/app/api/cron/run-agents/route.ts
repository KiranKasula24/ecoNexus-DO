import { NextResponse } from "next/server";
import { AgentRunner } from "@/lib/agents/agent-runner";

export const dynamic = "force-dynamic";
export const maxDuration = 10; // Hobby/free-tier friendly timeout

const isCronEnabled = process.env.ENABLE_AGENT_CRON === "true";

export async function GET() {
  if (!isCronEnabled) {
    return NextResponse.json(
      {
        success: false,
        error: "Agent cron is disabled",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }

  console.log(" CRON: Starting agent cycle...");

  try {
    const result = await AgentRunner.runAllAgents();

    console.log(" CRON: Agent cycle complete", result.stats);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: result.stats,
    });
  } catch (error: any) {
    console.error(" CRON: Agent cycle failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Allow POST as well for manual triggers
export async function POST() {
  return GET();
}
