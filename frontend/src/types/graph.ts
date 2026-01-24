/**
 * Graph Types - Simplified.
 * Facts connected by causal relationships.
 */

export interface GraphNode {
  id: string;
  fact: string;
  timestamp: number;
}

export type Relationship = "causes" | "enables" | "contradicts" | "supports";

export interface GraphEdge {
  source: string;
  target: string;
  relationship: Relationship;
}

export interface TranscriptSegment {
  t0: number;
  t1: number;
  text: string;
}

export interface GraphOutput {
  nodes: GraphNode[];
  edges: GraphEdge[];
  title: string;
  transcript?: TranscriptSegment[];
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
