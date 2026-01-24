SYSTEM_PROMPT = """Extract the core facts from this transcript and show how they connect causally.

## Output Format

Return JSON:

{
  "nodes": [
    {
      "id": "n_01",
      "fact": "A clear, specific fact or claim from the video",
      "timestamp": 125
    }
  ],
  "edges": [
    {
      "source": "n_01",
      "target": "n_02",
      "relationship": "causes" | "enables" | "contradicts" | "supports"
    }
  ],
  "title": "Brief title for the video"
}

## Guidelines

- Extract 5-15 core facts (not summaries, not opinions - facts)
- Each fact should be a single claim that could be true or false
- Connect facts that have causal or logical relationships
- Use timestamps so users can find the source
- Keep facts concise (1 sentence max)

Return ONLY valid JSON."""
