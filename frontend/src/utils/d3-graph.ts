import * as d3 from "d3";
import type { GraphNode, GraphEdge, NodeLayer } from "../types/graph";

export interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  data: GraphNode;
}

export interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  id: string;
  data: GraphEdge;
}

const LAYER_COLORS: Record<NodeLayer, string> = {
  L1_core: "#6366f1",
  L2_support: "#22c55e",
  L3_detail: "#f59e0b",
};

const MIN_NODE_RADIUS = 8;
const MAX_NODE_RADIUS = 32;
const MIN_LINK_WIDTH = 1;
const MAX_LINK_WIDTH = 6;

export function createForceSimulation(
  nodes: D3Node[],
  links: D3Link[],
  width: number,
  height: number
) {
  return d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink<D3Node, D3Link>(links)
        .id((d) => d.id)
        .distance(100)
        .strength((d) => d.data.dependency_weight * 0.5)
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force(
      "collision",
      d3.forceCollide<D3Node>().radius((d) => getNodeRadius(d.data) + 5)
    );
}

export function getNodeRadius(node: GraphNode): number {
  return (
    MIN_NODE_RADIUS +
    node.semantic_density * (MAX_NODE_RADIUS - MIN_NODE_RADIUS)
  );
}

export function getNodeColor(node: GraphNode): string {
  return LAYER_COLORS[node.layer];
}

export function getNodeOpacity(node: GraphNode): number {
  return 0.3 + node.confidence * 0.7;
}

export function getLinkWidth(edge: GraphEdge): number {
  return (
    MIN_LINK_WIDTH + edge.dependency_weight * (MAX_LINK_WIDTH - MIN_LINK_WIDTH)
  );
}

export function getLinkColor(edge: GraphEdge): string {
  const opacity = 0.3 + edge.dependency_weight * 0.5;
  return `rgba(100, 100, 100, ${opacity})`;
}

export function getLinkStyle(edge: GraphEdge): string {
  return edge.ui.style === "dashed" ? "4,4" : "none";
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
      id: edge.id,
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
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  svg.call(
    zoom.transform,
    d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8)
  );

  return zoom;
}

export function setupDrag(
  simulation: d3.Simulation<D3Node, D3Link>
): d3.DragBehavior<Element, D3Node, D3Node | d3.SubjectPosition> {
  function dragstarted(
    event: d3.D3DragEvent<Element, D3Node, D3Node>,
    d: D3Node
  ) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: d3.D3DragEvent<Element, D3Node, D3Node>, d: D3Node) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(
    event: d3.D3DragEvent<Element, D3Node, D3Node>,
    d: D3Node
  ) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3
    .drag<Element, D3Node>()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}
