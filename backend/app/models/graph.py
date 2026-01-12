"""
RUTHLESS Graph Models.
Minimal schema per RUTHLESS_SPEC.md - no elegance theater.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Literal
from enum import Enum


class NodeLayer(str, Enum):
    L1 = "L1"
    L2 = "L2"
    L3 = "L3"


class EdgeType(str, Enum):
    EXPLAINS = "explains"
    DEPENDS_ON = "depends_on"
    QUALIFIES = "qualifies"


# Allowed discrete values
DENSITY_VALUES = {0.2, 0.5, 0.8}
CONFIDENCE_VALUES = {0.3, 0.6, 0.9}
WEIGHT_VALUES = {0.3, 0.6, 0.9}


class TimeSpan(BaseModel):
    t0: int
    t1: int


class GraphNode(BaseModel):
    id: str
    statement: str = Field(..., max_length=200)
    layer: NodeLayer
    density: float
    confidence: float
    time_spans: list[TimeSpan]
    tags: list[str] = []

    @field_validator("density")
    @classmethod
    def validate_density(cls, v):
        if v not in DENSITY_VALUES:
            raise ValueError(f"density must be one of {DENSITY_VALUES}, got {v}")
        return v

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v):
        if v not in CONFIDENCE_VALUES:
            raise ValueError(f"confidence must be one of {CONFIDENCE_VALUES}, got {v}")
        return v


class GraphEdge(BaseModel):
    source: str
    target: str
    type: EdgeType
    weight: float

    @field_validator("weight")
    @classmethod
    def validate_weight(cls, v):
        if v not in WEIGHT_VALUES:
            raise ValueError(f"weight must be one of {WEIGHT_VALUES}, got {v}")
        return v


class GraphMeta(BaseModel):
    title: str = ""
    duration_seconds: int = 0


class GraphOutput(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    meta: GraphMeta
