/**
 * RUTHLESS NodeInspector.
 * Shows node details and connections. Click neighbors to expand.
 */
import type { GraphNode, GraphEdge } from "../types/graph";

interface NodeInspectorProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  nodes: GraphNode[];
  expandedNodeIds: Set<string>;
  onNodeClick: (node: GraphNode) => void;
}

const EDGE_TYPE_LABELS: Record<string, string> = {
  explains: "explains",
  depends_on: "depends on",
  qualifies: "qualifies",
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

  // Edges where this node is the source (it explains/qualifies others)
  const outgoingEdges = edges.filter((e) => e.source === node.id);
  // Edges where this node is the target (others explain/qualify it)
  const incomingEdges = edges.filter((e) => e.target === node.id);

  return (
    <div className="node-inspector">
      <div className="inspector-header">
        <span className={`layer-badge ${node.layer}`}>{node.layer}</span>
      </div>

      <div className="inspector-section">
        <p className="statement">{node.statement}</p>
      </div>

      <div className="inspector-section">
        <div className="properties-grid">
          <div className="property">
            <label>Density</label>
            <span className="value">{node.density}</span>
          </div>
          <div className="property">
            <label>Confidence</label>
            <span className="value">{node.confidence}</span>
          </div>
        </div>
      </div>

      {node.tags.length > 0 && (
        <div className="inspector-section">
          <div className="tags">
            {node.tags.map((tag) => (
              <span key={tag} className={`tag ${tag}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="inspector-section">
        <div className="time-spans">
          {node.time_spans.map((span, i) => (
            <span key={i} className="time-span">
              {formatTime(span.t0)} → {formatTime(span.t1)}
            </span>
          ))}
        </div>
      </div>

      {outgoingEdges.length > 0 && (
        <div className="inspector-section">
          <h4>This node explains:</h4>
          <ul className="edge-list">
            {outgoingEdges
              .sort((a, b) => b.weight - a.weight)
              .map((edge) => {
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
                        {targetNode.statement.slice(0, 40)}
                        {targetNode.statement.length > 40 ? "…" : ""}
                      </span>
                    </button>
                    <span className="edge-meta">
                      <span className="edge-type">
                        {EDGE_TYPE_LABELS[edge.type]}
                      </span>
                      <span className="edge-weight">{edge.weight}</span>
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {incomingEdges.length > 0 && (
        <div className="inspector-section">
          <h4>Explained by:</h4>
          <ul className="edge-list">
            {incomingEdges
              .sort((a, b) => b.weight - a.weight)
              .map((edge) => {
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
                        {sourceNode.statement.slice(0, 40)}
                        {sourceNode.statement.length > 40 ? "…" : ""}
                      </span>
                    </button>
                    <span className="edge-meta">
                      <span className="edge-type">
                        {EDGE_TYPE_LABELS[edge.type]}
                      </span>
                      <span className="edge-weight">{edge.weight}</span>
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
