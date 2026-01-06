from pydantic import BaseModel, Field
from typing import Literal, Optional
from enum import Enum


class NodeRole(str, Enum):
    CLAIM = "claim"
    DEFINITION = "definition"
    TRANSFORMATION = "transformation"
    CONSTRAINT = "constraint"
    ASSUMPTION = "assumption"
    EXAMPLE = "example"
    COUNTERPOINT = "counterpoint"
    PROCEDURE = "procedure"
    RESULT = "result"


class NodeLayer(str, Enum):
    L1_CORE = "L1_core"
    L2_SUPPORT = "L2_support"
    L3_DETAIL = "L3_detail"


class EdgeType(str, Enum):
    EXPLAINS = "explains"
    DEPENDS_ON = "depends_on"
    GENERALIZES = "generalizes"
    SPECIALIZES = "specializes"
    INSTANTIATES = "instantiates"
    CONTRASTS = "contrasts"
    QUALIFIES = "qualifies"
    LEADS_TO = "leads_to"
    SUPPORTS = "supports"


class DisplayHint(str, Enum):
    EMPHASIZED = "emphasized"
    DEFAULT = "default"
    COLLAPSED = "collapsed"


class IconType(str, Enum):
    NONE = "none"
    STAR = "star"
    WARNING = "warning"
    INFO = "info"


class TimeSpan(BaseModel):
    t0: int
    t1: int


class TranscriptQuote(BaseModel):
    t0: int
    t1: int
    quote: str = Field(..., max_length=200)


class NodeAnchors(BaseModel):
    transcript_quotes: list[TranscriptQuote] = []


class NodeUI(BaseModel):
    display_hint: DisplayHint = DisplayHint.DEFAULT
    icon: IconType = IconType.NONE
    tags: list[str] = []


class GraphNode(BaseModel):
    id: str
    label: str
    statement: str
    role: NodeRole
    layer: NodeLayer
    time_spans: list[TimeSpan]
    semantic_density: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    novelty: float = Field(0.0, ge=0.0, le=1.0)
    compression_notes: list[str] = []
    keywords: list[str] = []
    anchors: NodeAnchors = NodeAnchors()
    ui: NodeUI = NodeUI()


class EdgeUI(BaseModel):
    style: Literal["solid", "dashed"] = "solid"
    curvature: float = Field(0.2, ge=0.0, le=1.0)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: EdgeType
    dependency_weight: float = Field(..., ge=0.0, le=1.0)
    evidence: list[TimeSpan] = []
    ui: EdgeUI = EdgeUI()


class GraphCluster(BaseModel):
    id: str
    label: str
    node_ids: list[str]
    time_span: TimeSpan
    summary: str


class TranscriptCoverage(BaseModel):
    t0: int
    t1: int


class GraphMeta(BaseModel):
    title: str = ""
    source: str = "youtube"
    language: str = "en"
    transcript_coverage: TranscriptCoverage
    notes: list[str] = []


class ViewConfig(BaseModel):
    node_size: str = "semantic_density"
    node_opacity: str = "confidence"
    edge_width: str = "dependency_weight"
    time_highlight: bool = True


class GraphViews(BaseModel):
    default: ViewConfig = ViewConfig()


class GraphOutput(BaseModel):
    version: str = "1.0"
    meta: GraphMeta
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    clusters: list[GraphCluster] = []
    views: GraphViews = GraphViews()
