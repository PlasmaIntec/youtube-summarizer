"""
Graph Models - Simplified.
Facts connected by causal relationships.
"""
from pydantic import BaseModel
from typing import Optional, Literal

from app.models.transcript import TranscriptSegment


class GraphNode(BaseModel):
    id: str
    fact: str
    timestamp: int


class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: Literal["causes", "enables", "contradicts", "supports"]


class GraphOutput(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    title: str = ""
    transcript: Optional[list[TranscriptSegment]] = None
