export type NodeRole =
  | "claim"
  | "definition"
  | "transformation"
  | "constraint"
  | "assumption"
  | "example"
  | "counterpoint"
  | "procedure"
  | "result";

export type NodeLayer = "L1_core" | "L2_support" | "L3_detail";

export type EdgeType =
  | "explains"
  | "depends_on"
  | "generalizes"
  | "specializes"
  | "instantiates"
  | "contrasts"
  | "qualifies"
  | "leads_to"
  | "supports";

export type DisplayHint = "emphasized" | "default" | "collapsed";

export type IconType = "none" | "star" | "warning" | "info";

export interface TimeSpan {
  t0: number;
  t1: number;
}

export interface TranscriptQuote {
  t0: number;
  t1: number;
  quote: string;
}

export interface NodeAnchors {
  transcript_quotes: TranscriptQuote[];
}

export interface NodeUI {
  display_hint: DisplayHint;
  icon: IconType;
  tags: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  statement: string;
  role: NodeRole;
  layer: NodeLayer;
  time_spans: TimeSpan[];
  semantic_density: number;
  confidence: number;
  novelty: number;
  compression_notes: string[];
  keywords: string[];
  anchors: NodeAnchors;
  ui: NodeUI;
}

export interface EdgeUI {
  style: "solid" | "dashed";
  curvature: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  dependency_weight: number;
  evidence: TimeSpan[];
  ui: EdgeUI;
}

export interface GraphCluster {
  id: string;
  label: string;
  node_ids: string[];
  time_span: TimeSpan;
  summary: string;
}

export interface TranscriptCoverage {
  t0: number;
  t1: number;
}

export interface GraphMeta {
  title: string;
  source: string;
  language: string;
  transcript_coverage: TranscriptCoverage;
  notes: string[];
}

export interface ViewConfig {
  node_size: string;
  node_opacity: string;
  edge_width: string;
  time_highlight: boolean;
}

export interface GraphViews {
  default: ViewConfig;
}

export interface GraphOutput {
  version: string;
  meta: GraphMeta;
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
  views: GraphViews;
}

export interface TranscriptSegment {
  t0: number;
  t1: number;
  text: string;
}

export interface TranscriptInput {
  transcript: TranscriptSegment[];
  title?: string;
  description?: string;
  channel?: string;
}
