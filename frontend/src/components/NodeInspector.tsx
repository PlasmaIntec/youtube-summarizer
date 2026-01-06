import type { GraphNode, GraphEdge } from "../types/graph";

interface NodeInspectorProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  nodes: GraphNode[];
  onNodeSelect: (node: GraphNode) => void;
}

const ROLE_LABELS: Record<string, string> = {
  claim: "Claim",
  definition: "Definition",
  transformation: "Transformation",
  constraint: "Constraint",
  assumption: "Assumption",
  example: "Example",
  counterpoint: "Counterpoint",
  procedure: "Procedure",
  result: "Result",
};

const EDGE_TYPE_LABELS: Record<string, string> = {
  explains: "Explains",
  depends_on: "Depends on",
  generalizes: "Generalizes",
  specializes: "Specializes",
  instantiates: "Instantiates",
  contrasts: "Contrasts",
  qualifies: "Qualifies",
  leads_to: "Leads to",
  supports: "Supports",
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
  onNodeSelect,
}: NodeInspectorProps) {
  if (!node) {
    return (
      <div className="node-inspector empty">
        <p>Select a node to inspect its details</p>
      </div>
    );
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const incomingEdges = edges.filter((e) => e.target === node.id);
  const outgoingEdges = edges.filter((e) => e.source === node.id);

  return (
    <div className="node-inspector">
      <div className="inspector-header">
        <h3>{node.label}</h3>
        <span className={`layer-badge ${node.layer}`}>{node.layer}</span>
      </div>

      <div className="inspector-section">
        <h4>Statement</h4>
        <p className="statement">{node.statement}</p>
      </div>

      <div className="inspector-section">
        <h4>Properties</h4>
        <div className="properties-grid">
          <div className="property">
            <label>Role</label>
            <span>{ROLE_LABELS[node.role] || node.role}</span>
          </div>
          <div className="property">
            <label>Density</label>
            <div className="score-bar">
              <div
                className="score-fill density"
                style={{ width: `${node.semantic_density * 100}%` }}
              />
              <span>{node.semantic_density.toFixed(2)}</span>
            </div>
          </div>
          <div className="property">
            <label>Confidence</label>
            <div className="score-bar">
              <div
                className="score-fill confidence"
                style={{ width: `${node.confidence * 100}%` }}
              />
              <span>{node.confidence.toFixed(2)}</span>
            </div>
          </div>
          {node.novelty > 0 && (
            <div className="property">
              <label>Novelty</label>
              <div className="score-bar">
                <div
                  className="score-fill novelty"
                  style={{ width: `${node.novelty * 100}%` }}
                />
                <span>{node.novelty.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {node.ui.tags.length > 0 && (
        <div className="inspector-section">
          <h4>Tags</h4>
          <div className="tags">
            {node.ui.tags.map((tag) => (
              <span key={tag} className={`tag ${tag}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="inspector-section">
        <h4>Time Spans</h4>
        <div className="time-spans">
          {node.time_spans.map((span, i) => (
            <span key={i} className="time-span">
              {formatTime(span.t0)} - {formatTime(span.t1)}
            </span>
          ))}
        </div>
      </div>

      {node.anchors.transcript_quotes.length > 0 && (
        <div className="inspector-section">
          <h4>Quotes</h4>
          <div className="quotes">
            {node.anchors.transcript_quotes.map((quote, i) => (
              <blockquote key={i}>
                <p>"{quote.quote}"</p>
                <cite>
                  {formatTime(quote.t0)} - {formatTime(quote.t1)}
                </cite>
              </blockquote>
            ))}
          </div>
        </div>
      )}

      {node.compression_notes.length > 0 && (
        <div className="inspector-section">
          <h4>Compression Notes</h4>
          <ul className="compression-notes">
            {node.compression_notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {incomingEdges.length > 0 && (
        <div className="inspector-section">
          <h4>Depends On</h4>
          <ul className="edge-list">
            {incomingEdges.map((edge) => {
              const sourceNode = nodeMap.get(edge.source);
              if (!sourceNode) return null;
              return (
                <li key={edge.id}>
                  <button onClick={() => onNodeSelect(sourceNode)}>
                    {sourceNode.label}
                  </button>
                  <span className="edge-type">
                    {EDGE_TYPE_LABELS[edge.type] || edge.type}
                  </span>
                  <span className="edge-weight">
                    {edge.dependency_weight.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {outgoingEdges.length > 0 && (
        <div className="inspector-section">
          <h4>Supports</h4>
          <ul className="edge-list">
            {outgoingEdges.map((edge) => {
              const targetNode = nodeMap.get(edge.target);
              if (!targetNode) return null;
              return (
                <li key={edge.id}>
                  <button onClick={() => onNodeSelect(targetNode)}>
                    {targetNode.label}
                  </button>
                  <span className="edge-type">
                    {EDGE_TYPE_LABELS[edge.type] || edge.type}
                  </span>
                  <span className="edge-weight">
                    {edge.dependency_weight.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {node.keywords.length > 0 && (
        <div className="inspector-section">
          <h4>Keywords</h4>
          <div className="keywords">
            {node.keywords.map((kw) => (
              <span key={kw} className="keyword">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
