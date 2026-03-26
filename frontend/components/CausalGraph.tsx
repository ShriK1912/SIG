"use client";

import "reactflow/dist/style.css";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Node,
  type Edge,
} from "reactflow";

type CausalGraphProps = {
  graph: {
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  };
  anomalousNodes: string[];
};

// Correct fallback — mirrors causal_graph.py exactly.
// Used only before the first SSE tick delivers live graph data.
const FALLBACK_NODES = [
  { id: "db_conn_pool",       label: "DB_CONN_POOL",     position: { x: 90,  y: 190 } },
  { id: "auth_cpu",           label: "AUTH_CPU",          position: { x: 90,  y: 90  } },
  { id: "auth_latency_ms",    label: "AUTH_LATENCY",      position: { x: 340, y: 90  } },
  { id: "payment_latency_ms", label: "PAYMENT_LATENCY",   position: { x: 340, y: 230 } },
  { id: "payment_error_rate", label: "PAYMENT_ERRORS",    position: { x: 600, y: 190 } },
  { id: "notif_queue_depth",  label: "NOTIF_QUEUE",       position: { x: 600, y: 300 } },
  { id: "notif_cpu",          label: "NOTIF_CPU",         position: { x: 600, y: 70  } },
];

const FALLBACK_EDGES = [
  { source: "db_conn_pool",       target: "auth_latency_ms"    },
  { source: "db_conn_pool",       target: "payment_latency_ms" },
  { source: "auth_cpu",           target: "auth_latency_ms"    },
  { source: "auth_latency_ms",    target: "payment_latency_ms" },
  { source: "payment_latency_ms", target: "payment_error_rate" },
  { source: "payment_error_rate", target: "notif_queue_depth"  },
  { source: "auth_cpu",           target: "notif_cpu"          },
];

function AnimatedEdge(props: EdgeProps) {
  const [path] = getBezierPath(props);
  return (
    <>
      <BaseEdge
        path={path}
        style={{ stroke: "#3adffa", strokeWidth: 2, strokeDasharray: 4, opacity: 0.4 }}
      />
      <EdgeLabelRenderer>{null}</EdgeLabelRenderer>
    </>
  );
}

function AnomalousEdge(props: EdgeProps) {
  const [path] = getBezierPath(props);
  return (
    <>
      <BaseEdge
        path={path}
        style={{ stroke: "#ff716a", strokeWidth: 2.5, strokeDasharray: 6, opacity: 0.8 }}
      />
      <EdgeLabelRenderer>{null}</EdgeLabelRenderer>
    </>
  );
}

export function CausalGraph({ graph, anomalousNodes }: CausalGraphProps) {
  const rawNodes = graph.nodes.length ? graph.nodes : FALLBACK_NODES;
  const rawEdges = graph.edges.length ? graph.edges : FALLBACK_EDGES;

  const nodes = useMemo<Node[]>(
    () =>
      rawNodes.map((node) => {
        const id = String(node.id);
        const isAnomalous = anomalousNodes.includes(id);

        // Backend serialises node attrs flat alongside id, so `label` is a
        // top-level key on the object (e.g. { id: "db_conn_pool", label: "DB_CONN_POOL", ... })
        const label = String(node.label ?? id.toUpperCase());

        // Position comes from causal_graph.py position metadata
        const position = (node.position as { x: number; y: number }) ?? { x: 0, y: 0 };

        return {
          id,
          position,
          data: { label },
          style: {
            width: 110,
            height: 48,
            borderRadius: 0,
            borderLeft: `3px solid ${isAnomalous ? "#ff716a" : "#69f6b8"}`,
            color: isAnomalous ? "#ff716a" : "#69f6b8",
            background: isAnomalous ? "#2a1a1a" : "#262626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-jetbrains-mono, monospace)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.05em",
            boxShadow: isAnomalous
              ? "0 0 16px rgba(255,113,106,0.35)"
              : "0 0 8px rgba(105,246,184,0.12)",
            transition: "all 0.4s ease",
          },
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(anomalousNodes), JSON.stringify(rawNodes)]
  );

  const edges = useMemo<Edge[]>(
    () =>
      rawEdges.map((edge, index) => {
        const source = String(edge.source);
        const target = String(edge.target);
        // An edge is "hot" if both endpoints are anomalous
        const isHot = anomalousNodes.includes(source) && anomalousNodes.includes(target);
        return {
          id: `${source}-${target}-${index}`,
          source,
          target,
          type: isHot ? "anomalousEdge" : "animatedEdge",
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(anomalousNodes), JSON.stringify(rawEdges)]
  );

  return (
    <section className="col-span-12 flex h-[500px] flex-col overflow-hidden bg-surface-container lg:col-span-8">
      <div className="flex items-center justify-between border-b border-outline-variant/10 p-4">
        <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-zinc-400">
          CAUSAL_DEPENDENCY_GRAPH
        </h3>
        <div className="flex items-center gap-4">
          {anomalousNodes.length > 0 && (
            <span className="animate-pulse font-mono text-[10px] font-bold text-red-400">
              {anomalousNodes.length} ANOMALOUS NODE{anomalousNodes.length > 1 ? "S" : ""}
            </span>
          )}
          <span className="font-mono text-[10px] text-primary">
            NODES: {nodes.length} | EDGES: {edges.length}
          </span>
        </div>
      </div>

      <div className="relative flex-1 bg-surface-container-lowest">
        <ReactFlow
          fitView
          nodes={nodes}
          edges={edges}
          edgeTypes={{ animatedEdge: AnimatedEdge, anomalousEdge: AnomalousEdge }}
          minZoom={0.5}
          maxZoom={1.4}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          className="!bg-surface-container-lowest"
        >
          <Background gap={30} color="#262626" />
        </ReactFlow>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 rounded border border-outline-variant/10 bg-surface-container/90 p-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#69f6b8]" />
            <span className="font-mono text-[9px] text-zinc-500">HEALTHY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff716a]" />
            <span className="font-mono text-[9px] text-zinc-500">ANOMALOUS</span>
          </div>
        </div>
      </div>
    </section>
  );
}
