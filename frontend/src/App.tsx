/**
 * RUTHLESS App.
 * L1 only on load. Click → expand neighbors.
 */
import { useState, useCallback, useRef } from "react";
import { TranscriptInput } from "./components/TranscriptInput";
import { GraphView } from "./components/GraphView";
import { NodeInspector } from "./components/NodeInspector";
import { Timeline } from "./components/Timeline";
import { YouTubePlayer, type YouTubePlayerRef } from "./components/YouTubePlayer";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { compileTranscript, compileFromUrl, fetchTranscript } from "./services/api";
import type {
  TranscriptInput as TranscriptInputType,
  YouTubeURLInput,
  GraphOutput,
  GraphNode,
  TranscriptSegment,
} from "./types/graph";
import "./App.css";

function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

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

  const [videoId, setVideoId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[] | null>(null);
  const playerRef = useRef<YouTubePlayerRef>(null);

  const handleSeek = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
  }, []);

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
    setTranscript(null);

    // Extract video ID for player - shows immediately
    const vid = extractYoutubeVideoId(input.url);
    setVideoId(vid);

    try {
      // Fetch transcript first (fast) - shows incrementally
      const transcriptPromise = fetchTranscript(input);

      // Start compilation in parallel (slow)
      const compilePromise = compileFromUrl(input);

      // Show transcript as soon as it's ready
      transcriptPromise.then((transcriptResult) => {
        setTranscript(transcriptResult.transcript);
        setLoadingStage("generating");
      }).catch(() => {
        // Transcript fetch failed, continue with compilation
        setLoadingStage("generating");
      });

      // Wait for compilation to complete
      const result = await compilePromise;

      setLoadingStage("validating");
      await new Promise((resolve) => setTimeout(resolve, 300));

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
      {graph && (
        <header className="app-header">
          <div className="graph-stats">
            <span>L1: {l1Count}</span>
            <span>L2: {l2Count}</span>
            <span>L3: {l3Count}</span>
            <span>Visible: {visibleNodes.length}</span>
          </div>
        </header>
      )}

      <main className="app-main">
        {!graph && !videoId && (
          <div className="input-panel">
            <TranscriptInput
              onSubmit={handleSubmit}
              onSubmitUrl={handleSubmitUrl}
              loadingStage={loadingStage}
            />
            {error && <div className="error-panel">{error}</div>}
          </div>
        )}

        {!graph && videoId && (
          <>
            <aside className="controls-panel">
              <YouTubePlayer ref={playerRef} videoId={videoId} />
              <button className="new-btn" onClick={() => { setVideoId(null); setTranscript(null); setLoadingStage("idle"); }}>
                Cancel
              </button>
              {transcript && <TranscriptPanel transcript={transcript} onSeek={handleSeek} />}
            </aside>
            <div className="graph-panel loading-panel">
              <div className="loading-message">
                {loadingStage === "fetching" && "Fetching transcript..."}
                {loadingStage === "generating" && "Generating graph..."}
                {loadingStage === "validating" && "Validating..."}
              </div>
              {error && <div className="error-panel">{error}</div>}
            </div>
          </>
        )}

        {graph && visibleGraph && (
          <>
            <aside className="controls-panel">
              {videoId && <YouTubePlayer ref={playerRef} videoId={videoId} />}
              <button className="new-btn" onClick={() => { setGraph(null); setVideoId(null); setTranscript(null); }}>
                New Transcript
              </button>
              <button className="reset-btn" onClick={handleReset}>
                Reset to L1
              </button>
              <button className="expand-btn" onClick={handleExpandAll}>
                Expand All
              </button>
              <div className="hint">Click nodes to expand neighbors</div>
              {transcript && <TranscriptPanel transcript={transcript} onSeek={handleSeek} />}
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
