"""
Graph Validator - Simplified.
Just structural integrity, no quality gates.
"""
from app.models.graph import GraphOutput


def validate_and_fix(output: GraphOutput) -> GraphOutput:
    """
    Fix structural issues rather than failing.
    Returns a cleaned graph.
    """
    node_ids = {n.id for n in output.nodes}

    # Remove edges with missing nodes
    valid_edges = [
        e for e in output.edges
        if e.source in node_ids and e.target in node_ids
    ]

    # Remove orphan nodes (not connected to anything)
    connected_ids = set()
    for e in valid_edges:
        connected_ids.add(e.source)
        connected_ids.add(e.target)

    # Keep nodes that are connected OR if there are no edges (single-node graph is ok)
    if valid_edges:
        valid_nodes = [n for n in output.nodes if n.id in connected_ids]
    else:
        valid_nodes = output.nodes

    return GraphOutput(
        nodes=valid_nodes,
        edges=valid_edges,
        title=output.title,
        transcript=output.transcript
    )
