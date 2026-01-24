# Backend → LLM Interaction Sequence Diagram

```
┌────────┐     ┌─────────┐     ┌───────────┐     ┌─────────┐     ┌───────────┐
│Frontend│     │ Routes  │     │ YouTube   │     │Compiler │     │ LLM API   │
│        │     │         │     │ Fetcher   │     │         │     │(Claude/GPT)│
└───┬────┘     └────┬────┘     └─────┬─────┘     └────┬────┘     └─────┬─────┘
    │               │                │                │                │
    │ POST /compile-from-url         │                │                │
    │ {url, provider}                │                │                │
    │──────────────>│                │                │                │
    │               │                │                │                │
    │               │ fetch_youtube_ │                │                │
    │               │ transcript(url)│                │                │
    │               │───────────────>│                │                │
    │               │                │                │                │
    │               │                │ yt-dlp subprocess               │
    │               │                │ (fetch .vtt captions)           │
    │               │                │─────────┐                       │
    │               │                │         │                       │
    │               │                │<────────┘                       │
    │               │                │                │                │
    │               │                │ parse_vtt_to_segments()         │
    │               │                │ (dedupe, merge paragraphs)      │
    │               │                │─────────┐                       │
    │               │                │         │                       │
    │               │                │<────────┘                       │
    │               │                │                │                │
    │               │  segments[]    │                │                │
    │               │<───────────────│                │                │
    │               │                │                │                │
    │               │ compiler.compile(transcript)    │                │
    │               │────────────────────────────────>│                │
    │               │                │                │                │
    │               │                │                │ _build_user_message()
    │               │                │                │ (JSON transcript)
    │               │                │                │─────────┐      │
    │               │                │                │         │      │
    │               │                │                │<────────┘      │
    │               │                │                │                │
    │               │                │                │ messages.create()
    │               │                │                │ system: RUTHLESS_PROMPT
    │               │                │                │ user: {transcript JSON}
    │               │                │                │───────────────>│
    │               │                │                │                │
    │               │                │                │                │ LLM processes
    │               │                │                │                │ transcript,
    │               │                │                │                │ builds graph
    │               │                │                │                │
    │               │                │                │  JSON response │
    │               │                │                │  {nodes, edges,│
    │               │                │                │   meta}        │
    │               │                │                │<───────────────│
    │               │                │                │                │
    │               │                │                │ _extract_json()
    │               │                │                │ GraphOutput.model_validate()
    │               │                │                │ validate_or_raise()
    │               │                │                │─────────┐      │
    │               │                │                │         │      │
    │               │                │                │<────────┘      │
    │               │                │                │                │
    │               │                │  GraphOutput   │                │
    │               │<────────────────────────────────│                │
    │               │                │                │                │
    │               │ attach transcript to response   │                │
    │               │─────────┐      │                │                │
    │               │         │      │                │                │
    │               │<────────┘      │                │                │
    │               │                │                │                │
    │ GraphOutput   │                │                │                │
    │ {nodes, edges,│                │                │                │
    │  meta,        │                │                │                │
    │  transcript}  │                │                │                │
    │<──────────────│                │                │                │
    │               │                │                │                │
```

## Key Interactions

1. **Frontend → Routes**: `POST /compile-from-url` with YouTube URL and provider choice
2. **Routes → YouTube Fetcher**: Fetch transcript via `yt-dlp` subprocess
3. **YouTube Fetcher**: Parses VTT captions, dedupes overlapping segments, merges into paragraphs
4. **Routes → Compiler**: Passes `TranscriptInput` with segments
5. **Compiler → LLM**: Single API call with:
   - **System**: `RUTHLESS_PROMPT` (graph construction rules)
   - **User**: JSON transcript `{transcript: [{t0, t1, text}, ...]}`
6. **LLM → Compiler**: Returns JSON graph `{nodes, edges, meta}`
7. **Compiler**: Validates against RUTHLESS rules, raises if fails
8. **Routes → Frontend**: Returns `GraphOutput` with transcript attached

## Files Involved

| Component | File |
|-----------|------|
| Routes | `backend/app/api/routes.py` |
| YouTube Fetcher | `backend/app/services/youtube_fetcher.py` |
| Compiler | `backend/app/services/graph_compiler.py` |
| RUTHLESS Prompt | `backend/app/prompts/compiler.py` |
| Validator | `backend/app/services/validator.py` |
| Models | `backend/app/models/graph.py`, `backend/app/models/transcript.py` |
