/**
 * RUTHLESS GraphView.
 * Click nodes to expand. Size = density. Opacity = confidence.
 */
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import type { GraphOutput, GraphNode } from "../types/graph";
import {
  transformToD3Data,
  createForceSimulation,
  setupZoom,
  getNodeRadius,
  getNodeColor,
  getNodeOpacity,
  getLinkWidth,
  getLinkColor,
} from "../utils/d3-graph";
import type { D3Node } from "../utils/d3-graph";

interface GraphViewProps {
  graph: GraphOutput;
  fullGraph: GraphOutput;
  selectedNodeId: string | null;
  expandedNodeIds: Set<string>;
  onNodeClick: (node: GraphNode) => void;
  onBackgroundClick: () => void;
  highlightedTimeRange: { t0: number; t1: number } | null;
}

export function GraphView({
  graph,
  fullGraph,
  selectedNodeId,
  expandedNodeIds,
  onNodeClick,
  onBackgroundClick,
  highlightedTimeRange,
}: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const isNodeInTimeRange = useCallback(
    (node: GraphNode) => {
      if (!highlightedTimeRange) return true;
      return node.time_spans.some(
        (span) =>
          span.t0 <= highlightedTimeRange.t1 &&
          span.t1 >= highlightedTimeRange.t0
      );
    },
    [highlightedTimeRange]
  );

  // Check if node has unexpanded neighbors
  const hasUnexpandedNeighbors = useCallback(
    (nodeId: string) => {
      for (const edge of fullGraph.edges) {
        if (edge.source === nodeId && !expandedNodeIds.has(edge.target)) {
          return true;
        }
        if (edge.target === nodeId && !expandedNodeIds.has(edge.source)) {
          return true;
        }
      }
      return false;
    },
    [fullGraph.edges, expandedNodeIds]
  );

  useEffect(() => {
    if (!svgRef.current || graph.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll("*").remove();

    const { d3Nodes, d3Links } = transformToD3Data(graph.nodes, graph.edges);
    const g = svg.append("g");

    setupZoom(svg, g, width, height);
    createForceSimulation(d3Nodes, d3Links, width / 2, height / 2);

    // Render links
    g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(d3Links)
      .join("line")
      .attr("stroke", (d) => getLinkColor(d.data))
      .attr("stroke-width", (d) => getLinkWidth(d.data))
      .attr("x1", (d) => (d.source as D3Node).x!)
      .attr("y1", (d) => (d.source as D3Node).y!)
      .attr("x2", (d) => (d.target as D3Node).x!)
      .attr("y2", (d) => (d.target as D3Node).y!);

    // Render nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(d3Nodes)
      .join("g")
      .attr("cursor", "pointer")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    // Node circles
    node
      .append("circle")
      .attr("r", (d) => getNodeRadius(d.data))
      .attr("fill", (d) => getNodeColor(d.data))
      .attr("opacity", (d) => {
        const baseOpacity = getNodeOpacity(d.data);
        const inTimeRange = isNodeInTimeRange(d.data);
        return inTimeRange ? baseOpacity : baseOpacity * 0.3;
      })
      .attr("stroke", (d) =>
        d.id === selectedNodeId ? "#fff" : "transparent"
      )
      .attr("stroke-width", 3);

    // Expansion indicator (+ sign for nodes with hidden neighbors)
    node
      .filter((d) => hasUnexpandedNeighbors(d.id))
      .append("text")
      .text("+")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", (d) => getNodeRadius(d.data) * 0.8)
      .attr("font-weight", "bold")
      .attr("fill", "#fff")
      .attr("pointer-events", "none");

    // Statement as label (truncated)
    node
      .append("text")
      .text((d) => {
        const stmt = d.data.statement;
        return stmt.length > 30 ? stmt.slice(0, 30) + "…" : stmt;
      })
      .attr("x", (d) => getNodeRadius(d.data) + 6)
      .attr("y", 4)
      .attr("font-size", "11px")
      .attr("fill", "#e5e7eb")
      .attr("opacity", (d) => (isNodeInTimeRange(d.data) ? 0.9 : 0.3));

    // Tooltip
    node
      .append("title")
      .text(
        (d) =>
          `${d.data.statement}\n\nLayer: ${d.data.layer}\nDensity: ${d.data.density}\nConfidence: ${d.data.confidence}\nTags: ${d.data.tags.join(", ") || "none"}`
      );

    // Click handler
    node.on("click", (event, d) => {
      event.stopPropagation();
      onNodeClick(d.data);
    });

    // Background click
    svg.on("click", () => {
      onBackgroundClick();
    });
  }, [
    graph,
    selectedNodeId,
    onNodeClick,
    onBackgroundClick,
    isNodeInTimeRange,
    hasUnexpandedNeighbors,
  ]);

  // Update selection highlight without full redraw
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll(".nodes circle").attr("stroke", function () {
      const d = d3.select(this.parentNode).datum() as D3Node;
      return d.id === selectedNodeId ? "#fff" : "transparent";
    });
  }, [selectedNodeId]);

  return (
    <svg
      ref={svgRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#111827",
      }}
    />
  );
}
