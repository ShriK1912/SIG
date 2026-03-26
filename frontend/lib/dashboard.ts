export type MetricSeries = { t: number; actual: number; projected: number };

export type DashboardSnapshot = {
  tick: number;
  scenario: string | null;
  metrics: Record<string, number>;
  anomalous_nodes: string[];
  pending_approval: AgentDecision | null;
  decision: AgentDecision | null;
  graph: {
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  };
};

export type AgentDecision = {
  action: string;
  target: string;
  confidence: number;
  reasoning: string;
  requires_approval: boolean;
  root_cause?: string;
  // List of anomalous metric nodes at the time of decision
  anomalous_nodes?: string[];
  // Forward inference — predicted downstream impacts with eta + probability
  predictions?: Array<{
    node: string;
    service: string;
    eta_seconds: number;
    probability: number;
    current_value?: number;
    threshold?: number;
    path?: string[];
  }>;
  // Counterfactual — projected health trajectory without intervention
  counterfactual?: MetricSeries[];
};

export const defaultSnapshot: DashboardSnapshot = {
  tick: 0,
  scenario: null,
  metrics: {
    db_conn_pool: 42,
    auth_cpu: 28,
    auth_latency_ms: 38,
    payment_latency_ms: 41,
    payment_error_rate: 0.1,
    notif_queue_depth: 118,
    notif_cpu: 22,
  },
  anomalous_nodes: [],
  pending_approval: null,
  decision: null,
  graph: { nodes: [], edges: [] },
};

export function shouldShowApprovalModal(snapshot: DashboardSnapshot) {
  return Boolean(
    snapshot.pending_approval &&
      snapshot.pending_approval.requires_approval === true &&
      snapshot.pending_approval.confidence < 0.8 &&
      snapshot.anomalous_nodes.length > 0 &&
      snapshot.scenario !== null
  );
}

export function formatMetric(metric: string, value: number) {
  if (metric.includes("latency")) {
    return `${Math.round(value)}ms`;
  }
  if (metric.includes("rate") || metric.includes("cpu") || metric.includes("pool")) {
    return `${value.toFixed(1)}%`;
  }
  if (metric.includes("queue")) {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)}`;
  }
  return `${value}`;
}
