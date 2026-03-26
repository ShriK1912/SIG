"use client";

import type { AgentDecision } from "../lib/dashboard";

// Static historical entries shown below the live decision for visual depth
const HISTORY_FEED = [
  {
    title: "[HISTORY] AUTO_RECOVERY",
    timestamp: "prev",
    target: "auth-db-replica-01",
    body: "Flushed idle connection pool. Re-balanced node-04 traffic.",
    accent: "border-secondary text-secondary",
    footer: "OUTCOME: SUCCESS",
    predictions: null,
  },
  {
    title: "[HISTORY] ESCALATION_REQ",
    timestamp: "prev",
    target: "human-operator",
    body: "Anomaly in encrypted payload header. Confidence below 80% threshold.",
    accent: "border-tertiary text-tertiary",
    footer: "CONFIDENCE: 72.1%",
    predictions: null,
  },
];

type Prediction = {
  node: string;
  service: string;
  eta_seconds: number;
  probability: number;
};

function cleanReasoning(raw: string): string {
  // Convert Python-style repr like "['db_conn_pool', 'auth_latency_ms']"
  // into a readable string like "db_conn_pool → auth_latency_ms"
  return raw
    .replace(/\[['"]?(.+?)['"]?\]/g, (_, inner: string) =>
      inner
        .split(/['"]\s*,\s*['"]/)
        .map((s: string) => s.replace(/['"]/g, "").trim())
        .join(" → ")
    )
    .replace(/_/g, " ");
}

export function AgentReasonTrace({ decision }: { decision: AgentDecision | null }) {
  const livePredictions = (decision?.predictions ?? []) as Prediction[];
  const topPredictions = livePredictions
    .filter((p) => p.eta_seconds > 0)
    .slice(0, 3);

  const liveEntry = decision
    ? {
        title: `[ACTION] ${decision.action.toUpperCase().replace(/_/g, " ")}`,
        timestamp: new Date().toLocaleTimeString("en-US", { hour12: false }),
        target: decision.target,
        body: cleanReasoning(decision.reasoning),
        accent: decision.requires_approval
          ? "border-tertiary text-tertiary"
          : "border-primary text-primary",
        footer: `CONFIDENCE: ${(decision.confidence * 100).toFixed(1)}%  |  ${
          decision.requires_approval ? "AWAITING HUMAN APPROVAL" : "AUTO-EXECUTING"
        }`,
        predictions: topPredictions,
      }
    : null;

  const feed = liveEntry ? [liveEntry, ...HISTORY_FEED] : HISTORY_FEED;

  return (
    <section className="col-span-12 flex h-[500px] flex-col bg-surface-container lg:col-span-4">
      <div className="border-b border-outline-variant/10 p-4">
        <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-zinc-400">
          AGENT_LOGIC_FEED
        </h3>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 font-mono text-[11px]">
        {feed.map((item, i) => (
          <div
            key={`${item.title}-${i}`}
            className={`border-l-2 bg-surface-container-low p-3 transition-opacity duration-300 ${item.accent} ${
              i > 0 ? "opacity-50" : "opacity-100"
            }`}
          >
            <div className="mb-1 flex justify-between">
              <span className="font-bold">{item.title}</span>
              <span className="text-zinc-600">{item.timestamp}</span>
            </div>

            <p className="mb-2 text-zinc-500">
              TARGET:{" "}
              <span className="text-zinc-300">{item.target.toUpperCase()}</span>
            </p>

            <div className="bg-surface-container-highest p-2 text-zinc-300 leading-relaxed">
              {item.body}
            </div>

            {/* Forward inference predictions — the proactive cascade prevention panel */}
            {item.predictions && item.predictions.length > 0 && (
              <div className="mt-2 border border-outline-variant/10 bg-surface-container-highest p-2">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                  CASCADE_PREDICTIONS (forward inference)
                </p>
                <div className="space-y-1">
                  {item.predictions.map((pred) => (
                    <div
                      key={pred.node}
                      className="flex items-center justify-between text-[10px]"
                    >
                      <span className="text-zinc-400">
                        {pred.node.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-600">ETA {pred.eta_seconds}s</span>
                        <span
                          className={
                            pred.probability >= 0.7
                              ? "text-tertiary"
                              : "text-zinc-500"
                          }
                        >
                          {(pred.probability * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-2 font-bold">{item.footer}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
