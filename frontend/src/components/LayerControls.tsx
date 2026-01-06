import type { NodeLayer, EdgeType, NodeRole } from "../types/graph";

interface LayerControlsProps {
  visibleLayers: Set<NodeLayer>;
  onLayerToggle: (layer: NodeLayer) => void;
  visibleEdgeTypes: Set<EdgeType>;
  onEdgeTypeToggle: (type: EdgeType) => void;
  visibleRoles: Set<NodeRole>;
  onRoleToggle: (role: NodeRole) => void;
}

const LAYERS: { id: NodeLayer; label: string; color: string }[] = [
  { id: "L1_core", label: "Core", color: "#6366f1" },
  { id: "L2_support", label: "Support", color: "#22c55e" },
  { id: "L3_detail", label: "Detail", color: "#f59e0b" },
];

const EDGE_TYPES: { id: EdgeType; label: string }[] = [
  { id: "explains", label: "Explains" },
  { id: "depends_on", label: "Depends on" },
  { id: "generalizes", label: "Generalizes" },
  { id: "specializes", label: "Specializes" },
  { id: "instantiates", label: "Instantiates" },
  { id: "contrasts", label: "Contrasts" },
  { id: "qualifies", label: "Qualifies" },
  { id: "leads_to", label: "Leads to" },
  { id: "supports", label: "Supports" },
];

const ROLES: { id: NodeRole; label: string }[] = [
  { id: "claim", label: "Claim" },
  { id: "definition", label: "Definition" },
  { id: "transformation", label: "Transform" },
  { id: "constraint", label: "Constraint" },
  { id: "assumption", label: "Assumption" },
  { id: "example", label: "Example" },
  { id: "counterpoint", label: "Counter" },
  { id: "procedure", label: "Procedure" },
  { id: "result", label: "Result" },
];

export function LayerControls({
  visibleLayers,
  onLayerToggle,
  visibleEdgeTypes,
  onEdgeTypeToggle,
  visibleRoles,
  onRoleToggle,
}: LayerControlsProps) {
  return (
    <div className="layer-controls">
      <div className="control-section">
        <h4>Layers</h4>
        <div className="layer-buttons">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              className={`layer-btn ${visibleLayers.has(layer.id) ? "active" : ""}`}
              style={{
                borderColor: layer.color,
                backgroundColor: visibleLayers.has(layer.id)
                  ? layer.color
                  : "transparent",
              }}
              onClick={() => onLayerToggle(layer.id)}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h4>Edge Types</h4>
        <div className="filter-chips">
          {EDGE_TYPES.map((type) => (
            <button
              key={type.id}
              className={`chip ${visibleEdgeTypes.has(type.id) ? "active" : ""}`}
              onClick={() => onEdgeTypeToggle(type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-section">
        <h4>Node Roles</h4>
        <div className="filter-chips">
          {ROLES.map((role) => (
            <button
              key={role.id}
              className={`chip ${visibleRoles.has(role.id) ? "active" : ""}`}
              onClick={() => onRoleToggle(role.id)}
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
