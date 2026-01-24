/**
 * RUTHLESS App.
 * L1 only on load. Click → expand neighbors.
 */
import { useState, useCallback } from "react";
import { TranscriptInput } from "./components/TranscriptInput";
import { GraphView } from "./components/GraphView";
import { NodeInspector } from "./components/NodeInspector";
import { Timeline } from "./components/Timeline";
import { compileTranscript, compileFromUrl } from "./services/api";
import type {
  TranscriptInput as TranscriptInputType,
  YouTubeURLInput,
  GraphOutput,
  GraphNode,
} from "./types/graph";
import "./App.css";

export type LoadingStage = "idle" | "fetching" | "generating" | "validating";

function App() {
  const [graph, setGraph] = useState<GraphOutput | null>(null);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Expanded nodes: starts with L1 only, expands on click
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    new Set()
  );

  const [highlightedTimeRange, setHighlightedTimeRange] = useState<{
    t0: number;
    t1: number;
  } | null>(null);

  const handleSubmit = async (input: TranscriptInputType) => {
    setLoadingStage("generating");
    setError(null);
    setGraph(null);
    setSelectedNode(null);
    setExpandedNodeIds(new Set());

    try {
      const result = await compileTranscript(input);
      setLoadingStage("validating");
      // Brief pause to show validation stage
      await new Promise((resolve) => setTimeout(resolve, 500));
      setGraph(result);

      // Start with L1 nodes expanded (visible)
      const l1Ids = new Set(
        result.nodes.filter((n) => n.layer === "L1").map((n) => n.id)
      );
      setExpandedNodeIds(l1Ids);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to compile transcript"
      );
    } finally {
      setLoadingStage("idle");
    }
  };

  const handleSubmitUrl = async (input: YouTubeURLInput) => {
    setLoadingStage("fetching");
    setError(null);
    setGraph(null);
    setSelectedNode(null);
    setExpandedNodeIds(new Set());

    try {
      // Simulate stage transitions since backend doesn't stream progress
      // The actual fetch + compile happens in one API call
      const fetchTimeout = setTimeout(() => setLoadingStage("generating"), 3000);
      const generateTimeout = setTimeout(() => setLoadingStage("validating"), 8000);

      const result = await compileFromUrl(input);

      clearTimeout(fetchTimeout);
      clearTimeout(generateTimeout);

      setGraph(result);

      // Start with L1 nodes expanded (visible)
      const l1Ids = new Set(
        result.nodes.filter((n) => n.layer === "L1").map((n) => n.id)
      );
      setExpandedNodeIds(l1Ids);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to compile from YouTube URL"
      );
    } finally {
      setLoadingStage("idle");
    }
  };

  // Click node → expand its neighbors
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node);

      if (!graph) return;

      // Find all neighbors of clicked node
      const neighborIds = new Set<string>();
      for (const edge of graph.edges) {
        if (edge.source === node.id) {
          neighborIds.add(edge.target);
        }
        if (edge.target === node.id) {
          neighborIds.add(edge.source);
        }
      }

      // Expand neighbors
      setExpandedNodeIds((prev) => {
        const next = new Set(prev);
        next.add(node.id);
        neighborIds.forEach((id) => next.add(id));
        return next;
      });
    },
    [graph]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Reset to L1 only
  const handleReset = useCallback(() => {
    if (!graph) return;
    const l1Ids = new Set(
      graph.nodes.filter((n) => n.layer === "L1").map((n) => n.id)
    );
    setExpandedNodeIds(l1Ids);
    setSelectedNode(null);
  }, [graph]);

  // Expand all
  const handleExpandAll = useCallback(() => {
    if (!graph) return;
    setExpandedNodeIds(new Set(graph.nodes.map((n) => n.id)));
  }, [graph]);

  // Visible nodes = expanded nodes only
  const visibleNodes = graph
    ? graph.nodes.filter((n) => expandedNodeIds.has(n.id))
    : [];

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  const visibleEdges = graph
    ? graph.edges.filter(
        (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
      )
    : [];

  const visibleGraph: GraphOutput | null = graph
    ? {
        ...graph,
        nodes: visibleNodes,
        edges: visibleEdges,
      }
    : null;

  const l1Count = graph?.nodes.filter((n) => n.layer === "L1").length ?? 0;
  const l2Count = graph?.nodes.filter((n) => n.layer === "L2").length ?? 0;
  const l3Count = graph?.nodes.filter((n) => n.layer === "L3").length ?? 0;

  return (
    <div className="app">
      <header className="app-header">
        <h1>RUTHLESS Graph Compiler</h1>
        {graph && (
          <div className="graph-stats">
            <span>L1: {l1Count}</span>
            <span>L2: {l2Count}</span>
            <span>L3: {l3Count}</span>
            <span>Visible: {visibleNodes.length}</span>
          </div>
        )}
      </header>

      <main className="app-main">
        {!graph && (
          <div className="input-panel">
            <TranscriptInput
              onSubmit={handleSubmit}
              onSubmitUrl={handleSubmitUrl}
              loadingStage={loadingStage}
            />
            {error && <div className="error-panel">{error}</div>}
          </div>
        )}

        {graph && visibleGraph && (
          <>
            <aside className="controls-panel">
              <button className="new-btn" onClick={() => setGraph(null)}>
                New Transcript
              </button>
              <button className="reset-btn" onClick={handleReset}>
                Reset to L1
              </button>
              <button className="expand-btn" onClick={handleExpandAll}>
                Expand All
              </button>
              <div className="hint">Click nodes to expand neighbors</div>
            </aside>

            <div className="graph-panel">
              <GraphView
                graph={visibleGraph}
                fullGraph={graph}
                selectedNodeId={selectedNode?.id ?? null}
                expandedNodeIds={expandedNodeIds}
                onNodeClick={handleNodeClick}
                onBackgroundClick={handleBackgroundClick}
                highlightedTimeRange={highlightedTimeRange}
              />
              <Timeline
                nodes={graph.nodes}
                duration={graph.meta.duration_seconds}
                highlightedRange={highlightedTimeRange}
                onRangeChange={setHighlightedTimeRange}
              />
            </div>

            <aside className="inspector-panel">
              <NodeInspector
                node={selectedNode}
                edges={graph.edges}
                nodes={graph.nodes}
                expandedNodeIds={expandedNodeIds}
                onNodeClick={handleNodeClick}
              />
            </aside>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
