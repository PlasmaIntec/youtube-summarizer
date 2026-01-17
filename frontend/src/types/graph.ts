/**
 * RUTHLESS Graph Types.
 * Minimal schema - no elegance theater.
 */

export type NodeLayer = "L1" | "L2" | "L3";

// Only 3 edge types allowed
export type EdgeType = "explains" | "depends_on" | "qualifies";

// Discrete values only
export type Density = 0.2 | 0.5 | 0.8;
export type Confidence = 0.3 | 0.6 | 0.9;
export type EdgeWeight = 0.3 | 0.6 | 0.9;

export interface TimeSpan {
  t0: number;
  t1: number;
}

export interface GraphNode {
  id: string;
  statement: string;
  layer: NodeLayer;
  density: number; // 0.2 | 0.5 | 0.8
  confidence: number; // 0.3 | 0.6 | 0.9
  time_spans: TimeSpan[];
  tags: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  weight: number; // 0.3 | 0.6 | 0.9
}

export interface GraphMeta {
  title: string;
  duration_seconds: number;
}

export interface GraphOutput {
  nodes: GraphNode[];
  edges: GraphEdge[];
  meta: GraphMeta;
}

export interface TranscriptSegment {
  t0: number;
  t1: number;
  text: string;
}

export type Provider = "claude" | "chatgpt";

export interface TranscriptInput {
  transcript: TranscriptSegment[];
  title?: string;
  description?: string;
  channel?: string;
  provider?: Provider;
}

export interface YouTubeURLInput {
  url: string;
  provider?: Provider;
  languages?: string[];
}
