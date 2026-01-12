"""
RUTHLESS Validator.
Binary quality gate per RUTHLESS_SPEC.md - if any fail, revise.
"""
from dataclasses import dataclass
from statistics import median
from app.models.graph import GraphOutput, NodeLayer


@dataclass
class ValidationResult:
    valid: bool
    errors: list[str]


class ValidationError(Exception):
    """Raised when output fails ruthless quality gates."""
    def __init__(self, errors: list[str]):
        self.errors = errors
        super().__init__(f"RUTHLESS FAIL: {len(errors)} violations")


def validate_ruthless(output: GraphOutput) -> ValidationResult:
    """
    Binary quality gate. ALL must pass.
    """
    errors = []
    node_ids = set(n.id for n in output.nodes)

    l1_nodes = [n for n in output.nodes if n.layer == NodeLayer.L1]
    l2_nodes = [n for n in output.nodes if n.layer == NodeLayer.L2]
    l3_nodes = [n for n in output.nodes if n.layer == NodeLayer.L3]
    non_l1_nodes = l2_nodes + l3_nodes

    # === GATE 1: L1 count ≤ 12 ===
    if len(l1_nodes) > 12:
        errors.append(f"[L1_OVERFLOW] {len(l1_nodes)} L1 nodes, max 12")

    # === GATE 2: Total nodes ≤ 60 ===
    if len(output.nodes) > 60:
        errors.append(f"[NODE_OVERFLOW] {len(output.nodes)} total nodes, max 60")

    # === GATE 3: ≥ 70% of non-L1 nodes depend on L1 ===
    if non_l1_nodes:
        l1_ids = {n.id for n in l1_nodes}
        non_l1_connected_to_l1 = set()

        for edge in output.edges:
            # Check if non-L1 node connects to L1 (either direction)
            if edge.source in l1_ids and edge.target not in l1_ids:
                non_l1_connected_to_l1.add(edge.target)
            if edge.target in l1_ids and edge.source not in l1_ids:
                non_l1_connected_to_l1.add(edge.source)

        non_l1_ids = {n.id for n in non_l1_nodes}
        connected_ratio = len(non_l1_connected_to_l1 & non_l1_ids) / len(non_l1_ids)
        if connected_ratio < 0.7:
            errors.append(
                f"[L1_DEPENDENCY] Only {connected_ratio:.0%} of non-L1 nodes connect to L1, need ≥70%"
            )

    # === GATE 4: Top 3 L1 nodes explain ≥ 30% of graph ===
    if l1_nodes and output.edges:
        # Count outgoing edges per L1 node (explains relationship)
        l1_outgoing = {n.id: 0 for n in l1_nodes}
        for edge in output.edges:
            if edge.source in l1_outgoing:
                l1_outgoing[edge.source] += 1

        top3_edges = sum(sorted(l1_outgoing.values(), reverse=True)[:3])
        total_nodes = len(output.nodes)
        coverage = top3_edges / total_nodes if total_nodes else 0

        if coverage < 0.3:
            errors.append(
                f"[BACKBONE_WEAK] Top 3 L1 nodes explain {coverage:.0%} of graph, need ≥30%"
            )

    # === GATE 5: Median L1 density > median L2 density ===
    if l1_nodes and l2_nodes:
        l1_densities = [n.density for n in l1_nodes]
        l2_densities = [n.density for n in l2_nodes]
        l1_median = median(l1_densities)
        l2_median = median(l2_densities)

        if l1_median <= l2_median:
            errors.append(
                f"[DENSITY_INVERSION] L1 median density ({l1_median}) ≤ L2 median ({l2_median})"
            )

    # === GATE 6: No orphan nodes ===
    connected = set()
    for edge in output.edges:
        connected.add(edge.source)
        connected.add(edge.target)

    orphans = node_ids - connected
    if orphans:
        errors.append(f"[ORPHAN_NODES] {len(orphans)} disconnected: {list(orphans)[:5]}")

    # === GATE 7: No edge hairballs (>6 edges per node) ===
    edge_count = {}
    for edge in output.edges:
        edge_count[edge.source] = edge_count.get(edge.source, 0) + 1
        edge_count[edge.target] = edge_count.get(edge.target, 0) + 1

    hairballs = [nid for nid, count in edge_count.items() if count > 6]
    if hairballs:
        errors.append(f"[HAIRBALL] Nodes with >6 edges: {hairballs}")

    # === GATE 8: Edge integrity ===
    for edge in output.edges:
        if edge.source not in node_ids:
            errors.append(f"[DANGLING] Edge source '{edge.source}' missing")
        if edge.target not in node_ids:
            errors.append(f"[DANGLING] Edge target '{edge.target}' missing")

    # === GATE 9: Every node has timestamps ===
    for node in output.nodes:
        if not node.time_spans:
            errors.append(f"[NO_TIME] {node.id} missing time_spans")

    # === GATE 10: L1 must have high density (0.5 or 0.8) ===
    for node in l1_nodes:
        if node.density < 0.5:
            errors.append(f"[L1_LOW_DENSITY] {node.id} has density {node.density}, L1 needs ≥0.5")

    # === GATE 11: If L1 has tag "core", must have outgoing edges ===
    l1_ids = {n.id for n in l1_nodes}
    for node in l1_nodes:
        outgoing = sum(1 for e in output.edges if e.source == node.id)
        if outgoing == 0:
            errors.append(f"[L1_NO_EXPLAINS] {node.id} is L1 but explains nothing")

    return ValidationResult(valid=len(errors) == 0, errors=errors)


def validate_or_raise(output: GraphOutput) -> None:
    """Validate and raise if ruthless gates fail."""
    result = validate_ruthless(output)
    if not result.valid:
        raise ValidationError(result.errors)
