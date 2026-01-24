/**
 * D3 Graph Utils - Simplified.
 * Facts connected by causal relationships.
 */
import * as d3 from "d3";
import type { GraphNode, GraphEdge, Relationship } from "../types/graph";

export interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  data: GraphNode;
}

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  data: GraphEdge;
}

// Relationship colors
const RELATIONSHIP_COLORS: Record<Relationship, string> = {
  causes: "#ef4444",      // red
  enables: "#22c55e",     // green
  contradicts: "#f59e0b", // amber
  supports: "#6366f1",    // indigo
};

export function createForceSimulation(
  nodes: D3Node[],
  links: D3Link[],
  centerX: number,
  centerY: number
) {
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink<D3Node, D3Link>(links)
        .id((d) => d.id)
        .distance(150)
        .strength(0.5)
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(centerX, centerY))
    .force(
      "collision",
      d3.forceCollide<D3Node>().radius(40)
    );

  // Run to completion
  simulation.stop();
  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }

  return simulation;
}

export function getNodeRadius(): number {
  return 20;
}

export function getNodeColor(): string {
  return "#6366f1"; // indigo
}

export function getLinkColor(edge: GraphEdge): string {
  return RELATIONSHIP_COLORS[edge.relationship] || "#666";
}

export function transformToD3Data(
  nodes: GraphNode[],
  edges: GraphEdge[]
): { d3Nodes: D3Node[]; d3Links: D3Link[] } {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const d3Nodes: D3Node[] = nodes.map((node) => ({
    id: node.id,
    data: node,
  }));

  const d3Links: D3Link[] = edges
    .filter((edge) => nodeMap.has(edge.source) && nodeMap.has(edge.target))
    .map((edge) => ({
      source: edge.source,
      target: edge.target,
      data: edge,
    }));

  return { d3Nodes, d3Links };
}

export function setupZoom(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  height: number,
  initialTransform?: d3.ZoomTransform
) {
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 3])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  const transform = initialTransform || d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8);
  svg.call(zoom.transform, transform);

  return zoom;
}

export function getCurrentTransform(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
): d3.ZoomTransform | undefined {
  try {
    return d3.zoomTransform(svg.node()!);
  } catch {
    return undefined;
  }
}
