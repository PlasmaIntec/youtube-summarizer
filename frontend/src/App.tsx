import { useState, useCallback } from "react";
import { TranscriptInput } from "./components/TranscriptInput";
import { GraphView } from "./components/GraphView";
import { NodeInspector } from "./components/NodeInspector";
import { LayerControls } from "./components/LayerControls";
import { Timeline } from "./components/Timeline";
import { compileTranscript } from "./services/api";
import type {
  TranscriptInput as TranscriptInputType,
  GraphOutput,
  GraphNode,
  NodeLayer,
  EdgeType,
  NodeRole,
} from "./types/graph";
import "./App.css";

const ALL_LAYERS: NodeLayer[] = ["L1_core", "L2_support", "L3_detail"];
const ALL_EDGE_TYPES: EdgeType[] = [
  "explains",
  "depends_on",
  "generalizes",
  "specializes",
  "instantiates",
  "contrasts",
  "qualifies",
  "leads_to",
  "supports",
];
const ALL_ROLES: NodeRole[] = [
  "claim",
  "definition",
  "transformation",
  "constraint",
  "assumption",
  "example",
  "counterpoint",
  "procedure",
  "result",
];

function App() {
  const [graph, setGraph] = useState<GraphOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<NodeLayer>>(
    new Set(ALL_LAYERS)
  );
  const [visibleEdgeTypes, setVisibleEdgeTypes] = useState<Set<EdgeType>>(
    new Set(ALL_EDGE_TYPES)
  );
  const [visibleRoles, setVisibleRoles] = useState<Set<NodeRole>>(
    new Set(ALL_ROLES)
  );
  const [highlightedTimeRange, setHighlightedTimeRange] = useState<{
    t0: number;
    t1: number;
  } | null>(null);

  const handleSubmit = async (input: TranscriptInputType) => {
    setIsLoading(true);
    setError(null);
    setGraph(null);
    setSelectedNode(null);

    try {
      const result = await compileTranscript(input);
      setGraph(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to compile transcript"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    setSelectedNode(node);
  }, []);

  const handleLayerToggle = useCallback((layer: NodeLayer) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  }, []);

  const handleEdgeTypeToggle = useCallback((type: EdgeType) => {
    setVisibleEdgeTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const handleRoleToggle = useCallback((role: NodeRole) => {
    setVisibleRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  }, []);

  const filteredNodes = graph
    ? graph.nodes.filter(
        (n) => visibleLayers.has(n.layer) && visibleRoles.has(n.role)
      )
    : [];

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  const filteredEdges = graph
    ? graph.edges.filter(
        (e) =>
          filteredNodeIds.has(e.source) &&
          filteredNodeIds.has(e.target) &&
          visibleEdgeTypes.has(e.type)
      )
    : [];

  const filteredGraph: GraphOutput | null = graph
    ? {
        ...graph,
        nodes: filteredNodes,
        edges: filteredEdges,
      }
    : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Transcript Graph Compiler</h1>
        {graph && (
          <div className="graph-stats">
            <span>{graph.nodes.length} nodes</span>
            <span>{graph.edges.length} edges</span>
            <span>{graph.clusters.length} clusters</span>
          </div>
        )}
      </header>

      <main className="app-main">
        {!graph && (
          <div className="input-panel">
            <TranscriptInput onSubmit={handleSubmit} isLoading={isLoading} />
            {error && <div className="error-panel">{error}</div>}
          </div>
        )}

        {graph && filteredGraph && (
          <>
            <aside className="controls-panel">
              <button className="new-btn" onClick={() => setGraph(null)}>
                New Transcript
              </button>
              <LayerControls
                visibleLayers={visibleLayers}
                onLayerToggle={handleLayerToggle}
                visibleEdgeTypes={visibleEdgeTypes}
                onEdgeTypeToggle={handleEdgeTypeToggle}
                visibleRoles={visibleRoles}
                onRoleToggle={handleRoleToggle}
              />
            </aside>

            <div className="graph-panel">
              <GraphView
                graph={filteredGraph}
                selectedNodeId={selectedNode?.id ?? null}
                onNodeSelect={handleNodeSelect}
                visibleLayers={visibleLayers}
                highlightedTimeRange={highlightedTimeRange}
              />
              <Timeline
                nodes={graph.nodes}
                coverage={graph.meta.transcript_coverage}
                highlightedRange={highlightedTimeRange}
                onRangeChange={setHighlightedTimeRange}
              />
            </div>

            <aside className="inspector-panel">
              <NodeInspector
                node={selectedNode}
                edges={graph.edges}
                nodes={graph.nodes}
                onNodeSelect={handleNodeSelect}
              />
            </aside>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
