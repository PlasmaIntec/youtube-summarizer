from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

from app.models.transcript import TranscriptInput, TranscriptSegment, YouTubeURLInput
from app.models.graph import GraphOutput
from app.services.graph_compiler import compiler
from app.services.youtube_fetcher import fetch_youtube_transcript, YouTubeFetchError

router = APIRouter()


class TranscriptResponse(BaseModel):
    transcript: list[TranscriptSegment]
    video_id: str


@router.get("/health")
async def health_check():
    return {"status": "healthy"}


@router.post("/transcript", response_model=TranscriptResponse)
async def fetch_transcript(input_data: YouTubeURLInput):
    """Fetch transcript only (fast) - for incremental UI updates."""
    try:
        segments, metadata = fetch_youtube_transcript(
            input_data.url,
            languages=input_data.languages
        )
        return TranscriptResponse(
            transcript=segments,
            video_id=metadata["video_id"]
        )
    except YouTubeFetchError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/compile", response_model=GraphOutput)
async def compile_transcript(input_data: TranscriptInput):
    try:
        return compiler.compile(input_data)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compilation failed: {str(e)}")


@router.post("/compile-from-url", response_model=GraphOutput)
async def compile_from_youtube_url(input_data: YouTubeURLInput):
    """Complete pipeline: YouTube URL → Transcript → Fact Graph."""
    try:
        # Fetch transcript
        segments, metadata = fetch_youtube_transcript(
            input_data.url,
            languages=input_data.languages
        )

        # Compile to graph
        transcript_input = TranscriptInput(
            transcript=segments,
            provider=input_data.provider
        )
        result = compiler.compile(transcript_input)

        # Include transcript in response
        result.transcript = segments
        return result

    except YouTubeFetchError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compilation failed: {str(e)}")
