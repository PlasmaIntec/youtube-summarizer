import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import type { GraphOutput, GraphNode, NodeLayer } from "../types/graph";
import {
  transformToD3Data,
  createForceSimulation,
  setupZoom,
  setupDrag,
  getNodeRadius,
  getNodeColor,
  getNodeOpacity,
  getLinkWidth,
  getLinkColor,
  getLinkStyle,
} from "../utils/d3-graph";
import type { D3Node, D3Link } from "../utils/d3-graph";

interface GraphViewProps {
  graph: GraphOutput;
  selectedNodeId: string | null;
  onNodeSelect: (node: GraphNode | null) => void;
  visibleLayers: Set<NodeLayer>;
  highlightedTimeRange: { t0: number; t1: number } | null;
}

export function GraphView({
  graph,
  selectedNodeId,
  onNodeSelect,
  visibleLayers,
  highlightedTimeRange,
}: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);

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

  useEffect(() => {
    if (!svgRef.current || graph.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll("*").remove();

    const filteredNodes = graph.nodes.filter((n) => visibleLayers.has(n.layer));
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = graph.edges.filter(
      (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );

    const { d3Nodes, d3Links } = transformToD3Data(filteredNodes, filteredEdges);

    const g = svg.append("g");

    setupZoom(svg, g, width, height);

    const simulation = createForceSimulation(d3Nodes, d3Links, width / 2, height / 2);
    simulationRef.current = simulation;

    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(d3Links)
      .join("line")
      .attr("stroke", (d) => getLinkColor(d.data))
      .attr("stroke-width", (d) => getLinkWidth(d.data))
      .attr("stroke-dasharray", (d) => getLinkStyle(d.data));

    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(d3Nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(setupDrag(simulation) as any);

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

    node
      .append("text")
      .text((d) => d.data.label)
      .attr("x", (d) => getNodeRadius(d.data) + 4)
      .attr("y", 4)
      .attr("font-size", "12px")
      .attr("fill", "#e5e7eb")
      .attr("opacity", (d) => (isNodeInTimeRange(d.data) ? 1 : 0.3));

    node
      .append("title")
      .text(
        (d) =>
          `${d.data.label}\n${d.data.statement}\nDensity: ${d.data.semantic_density.toFixed(2)}\nConfidence: ${d.data.confidence.toFixed(2)}`
      );

    node.on("click", (event, d) => {
      event.stopPropagation();
      onNodeSelect(d.data);
    });

    svg.on("click", () => {
      onNodeSelect(null);
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as D3Node).x!)
        .attr("y1", (d) => (d.source as D3Node).y!)
        .attr("x2", (d) => (d.target as D3Node).x!)
        .attr("y2", (d) => (d.target as D3Node).y!);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graph, visibleLayers, selectedNodeId, onNodeSelect, isNodeInTimeRange]);

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
        background: "#1f2937",
      }}
    />
  );
}
