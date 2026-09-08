/**
 * CLIENT-SIDE AGENT SCHEDULER
 * Runs agents every 3 minutes while user has the app open
 */

let intervalId: NodeJS.Timeout | null = null;

export function startAgentScheduler() {
  if (intervalId) {
    console.log("⚠️ Agent scheduler already running");
    return;
  }

  console.log("🚀 Starting agent scheduler (every 3 minutes)");

  // Run immediately
  runAgentCycle();

  // Then run every 3 minutes
  intervalId = setInterval(
    () => {
      runAgentCycle();
    },
    3 * 60 * 1000,
  ); // 3 minutes
}

export function stopAgentScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("🛑 Stopped agent scheduler");
  }
}

async function runAgentCycle() {
  console.log("🤖 Running agent cycle...");

  try {
    const response = await fetch("/api/cron/run-agents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Agent cycle complete:", result.stats);

      // Dispatch event so components can refresh
      window.dispatchEvent(
        new CustomEvent("agent-cycle-complete", {
          detail: result.stats,
        }),
      );
    } else {
      console.error("❌ Agent cycle failed:", result.error);
    }
  } catch (error) {
    console.error("❌ Error running agent cycle:", error);
  }
}
