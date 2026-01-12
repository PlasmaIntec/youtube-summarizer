/**
 * RUTHLESS D3 Graph Utils.
 * Node size = density. Node opacity = confidence.
 */
import * as d3 from "d3";
import type { GraphNode, GraphEdge, NodeLayer } from "../types/graph";

export interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  data: GraphNode;
}

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  data: GraphEdge;
}

// Layer colors: L1 = purple (core), L2 = green (support), L3 = amber (detail)
const LAYER_COLORS: Record<NodeLayer, string> = {
  L1: "#8b5cf6",
  L2: "#22c55e",
  L3: "#f59e0b",
};

// Size based on density
const DENSITY_RADIUS: Record<number, number> = {
  0.2: 12,
  0.5: 20,
  0.8: 32,
};

// Edge width based on weight
const WEIGHT_WIDTH: Record<number, number> = {
  0.3: 1,
  0.6: 2,
  0.9: 4,
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
        .distance(120)
        .strength((d) => d.data.weight * 0.3)
    )
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(centerX, centerY))
    .force(
      "collision",
      d3.forceCollide<D3Node>().radius((d) => getNodeRadius(d.data) + 10)
    );

  // Run to completion
  simulation.stop();
  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }

  return simulation;
}

export function getNodeRadius(node: GraphNode): number {
  return DENSITY_RADIUS[node.density] ?? 16;
}

export function getNodeColor(node: GraphNode): string {
  return LAYER_COLORS[node.layer];
}

export function getNodeOpacity(node: GraphNode): number {
  // Confidence: 0.3 → 0.4, 0.6 → 0.7, 0.9 → 1.0
  return 0.3 + node.confidence * 0.7;
}

export function getLinkWidth(edge: GraphEdge): number {
  return WEIGHT_WIDTH[edge.weight] ?? 2;
}

export function getLinkColor(edge: GraphEdge): string {
  const opacity = 0.3 + edge.weight * 0.4;
  return `rgba(150, 150, 150, ${opacity})`;
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
  height: number
) {
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 3])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Initial transform to center
  svg.call(
    zoom.transform,
    d3.zoomIdentity.translate(width / 2, height / 2).scale(0.7)
  );

  return zoom;
}
