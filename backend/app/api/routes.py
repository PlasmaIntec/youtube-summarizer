from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ValidationError

from app.models.transcript import TranscriptInput, TranscriptSegment, YouTubeURLInput
from app.models.graph import GraphOutput
from app.services.graph_compiler import compiler
from app.services.validator import ValidationError as RuthlessValidationError
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
    """
    Fetch transcript only (fast) - for incremental UI updates.
    """
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
        raise HTTPException(
            status_code=400,
            detail=f"YouTube fetch failed: {str(e)}"
        )


@router.post("/compile", response_model=GraphOutput)
async def compile_transcript(input_data: TranscriptInput):
    try:
        result = compiler.compile(input_data)
        return result
    except RuthlessValidationError as e:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "RUTHLESS validation failed",
                "errors": e.errors
            }
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid graph structure: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Compilation failed: {str(e)}"
        )


@router.post("/compile-from-url", response_model=GraphOutput)
async def compile_from_youtube_url(input_data: YouTubeURLInput):
    """
    Complete pipeline: YouTube URL → Transcript → Summary Graph.
    """
    try:
        # Step 1: Fetch transcript from YouTube
        segments, metadata = fetch_youtube_transcript(
            input_data.url,
            languages=input_data.languages
        )
        
        # Step 2: Build TranscriptInput
        transcript_input = TranscriptInput(
            transcript=segments,
            title=None,  # YouTube API doesn't provide title in transcript API
            description=None,
            channel=None,
            provider=input_data.provider
        )
        
        # Step 3: Compile to graph
        result = compiler.compile(transcript_input)

        # Step 4: Include transcript in response for frontend observability
        result.transcript = segments
        return result
        
    except YouTubeFetchError as e:
        raise HTTPException(
            status_code=400,
            detail=f"YouTube fetch failed: {str(e)}"
        )
    except RuthlessValidationError as e:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "RUTHLESS validation failed",
                "errors": e.errors
            }
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid graph structure: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Compilation failed: {str(e)}"
        )
