V1 Ruthless Implementing Spec
North Star (non-negotiable)

A smart user should grasp the underlying model of a video in under 60 seconds.

If this fails, the system failed — even if the graph is “accurate”.

What V1 Does (and ONLY this)

Converts a transcript into a small, high-leverage information graph

Exposes uneven information density visually

Makes dependencies obvious at a glance

Supports click → expand → understand

No polish. No completeness. No elegance theater.

Hard Limits (Ruthless)

Max L1 (core) nodes: 12

Max total nodes: 60

Edge types allowed: 3

Default visible nodes on load: L1 only

Everything else collapsed

If you exceed limits, you must merge or delete.

Output Contract (Strict)

The LLM outputs one JSON object.

Required top-level keys only:

{
  "nodes": [],
  "edges": [],
  "meta": {}
}


Anything else is noise.

Node Model (V1)

A node is an explanatory unit, not a sentence.

{
  "id": "n_01",
  "statement": "Short, precise claim or definition",
  "layer": "L1 | L2 | L3",
  "density": 0.0,
  "confidence": 0.0,
  "time_spans": [{ "t0": 120, "t1": 155 }],
  "tags": ["core", "bridge", "fragile"]
}

Node Rules

L1 nodes

Explain other nodes

High density

Fit on one screen

L2 nodes

Explain how or why L1 works

L3 nodes

Examples, anecdotes, optional detail

Collapsed by default

If a node does not explain another node, it cannot be L1.

Density Scoring (Forced Heuristic)

No freeform vibes.

Density ∈ {0.2, 0.5, 0.8}

Assign based on:

0.8 (High)

Explains multiple other nodes

Contains conditional logic, abstraction, or mechanism

0.5 (Medium)

Explains one node

Adds structure or reasoning

0.2 (Low)

Example, repetition, narrative, color

If unsure → round down.

Confidence Scoring (Simple)

Confidence ∈ {0.3, 0.6, 0.9}

0.9

Clearly defined or repeatedly supported in transcript

0.6

Asserted with some support

0.3

Speculative, hedged, or weakly justified

Edge Model (V1 Only)

Only three edge types are allowed.

{
  "source": "n_01",
  "target": "n_07",
  "type": "explains | depends_on | qualifies",
  "weight": 0.0
}

Edge Semantics

explains
Removing source makes target confusing

depends_on
Target cannot exist without source

qualifies
Source limits scope or validity of target

Edge Weight

0.9 → target collapses without source

0.6 → target partially weakens

0.3 → contextual influence only

Graph Construction Rules

Build L1 first

Identify candidate core claims

Merge until ≤12 remain

Attach L2

Every L2 must explain or qualify an L1

Attach L3

Every L3 must connect upward

No orphan nodes

No edge hairballs

If a node has >6 edges, merge or demote

Default UI Assumptions (Non-Negotiable)

The graph must support:

Node size = density

Node opacity = confidence

Only L1 visible on load

Click node → reveal neighbors

Time scrub highlights active nodes

If the JSON cannot drive this UI, it’s wrong.

Failure Modes (Explicit)

If you see any of the following, the output is bad:

Everything labeled L1

Density clustered around 0.5

Edges everywhere, no backbone

Graph readable only after zooming

Removing one L1 node changes nothing

These indicate model collapse.

Quality Gate (Binary)

Before returning JSON, check:

L1 count ≤ 12

≥ 70% of non-L1 nodes depend on L1

Top 3 L1 nodes explain ≥ 30% of graph

Median L1 density > median L2 density

Graph understandable without reading transcript

If any fail → revise.

What Is Explicitly Cut in V1

❌ Clusters
❌ Multiple edge taxonomies
❌ Fine-grained density floats
❌ Narrative summaries
❌ Visual polish hints
❌ Domain ontologies

These come only after usage proves demand.

Deliverable

Return only the JSON object.

No prose.
No justification.
No “helpful explanation”.

Liu Verdict

This spec is not elegant.
It is shippable.

If this doesn’t work, nothing fancy will.