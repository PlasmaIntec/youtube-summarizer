/**
 * NodeInspector - Simplified.
 * Shows fact details and causal connections.
 */
import type { GraphNode, GraphEdge, Relationship } from "../types/graph";

interface NodeInspectorProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  nodes: GraphNode[];
  expandedNodeIds: Set<string>;
  onNodeClick: (node: GraphNode) => void;
}

const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  causes: "causes",
  enables: "enables",
  contradicts: "contradicts",
  supports: "supports",
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function NodeInspector({
  node,
  edges,
  nodes,
  expandedNodeIds,
  onNodeClick,
}: NodeInspectorProps) {
  if (!node) {
    return (
      <div className="node-inspector empty">
        <p>Click a node to inspect</p>
      </div>
    );
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Outgoing: this node causes/enables/etc. others
  const outgoingEdges = edges.filter((e) => e.source === node.id);
  // Incoming: others cause/enable/etc. this node
  const incomingEdges = edges.filter((e) => e.target === node.id);

  return (
    <div className="node-inspector">
      <div className="inspector-section">
        <p className="statement">{node.fact || ""}</p>
      </div>

      <div className="inspector-section">
        <div className="time-spans">
          <span className="time-span">{formatTime(node.timestamp || 0)}</span>
        </div>
      </div>

      {outgoingEdges.length > 0 && (
        <div className="inspector-section">
          <h4>This fact:</h4>
          <ul className="edge-list">
            {outgoingEdges.map((edge) => {
              const targetNode = nodeMap.get(edge.target);
              if (!targetNode) return null;
              const isExpanded = expandedNodeIds.has(edge.target);
              return (
                <li key={`${edge.source}-${edge.target}`}>
                  <button
                    onClick={() => onNodeClick(targetNode)}
                    className={isExpanded ? "expanded" : "collapsed"}
                  >
                    {!isExpanded && <span className="expand-hint">+</span>}
                    <span className="node-statement">
                      {(targetNode.fact || "").slice(0, 40)}
                      {(targetNode.fact || "").length > 40 ? "…" : ""}
                    </span>
                  </button>
                  <span className="edge-meta">
                    <span className="edge-type">
                      {RELATIONSHIP_LABELS[edge.relationship]}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {incomingEdges.length > 0 && (
        <div className="inspector-section">
          <h4>Connected from:</h4>
          <ul className="edge-list">
            {incomingEdges.map((edge) => {
              const sourceNode = nodeMap.get(edge.source);
              if (!sourceNode) return null;
              const isExpanded = expandedNodeIds.has(edge.source);
              return (
                <li key={`${edge.source}-${edge.target}`}>
                  <button
                    onClick={() => onNodeClick(sourceNode)}
                    className={isExpanded ? "expanded" : "collapsed"}
                  >
                    {!isExpanded && <span className="expand-hint">+</span>}
                    <span className="node-statement">
                      {(sourceNode.fact || "").slice(0, 40)}
                      {(sourceNode.fact || "").length > 40 ? "…" : ""}
                    </span>
                  </button>
                  <span className="edge-meta">
                    <span className="edge-type">
                      {RELATIONSHIP_LABELS[edge.relationship]}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
