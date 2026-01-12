from fastapi import APIRouter, HTTPException
from pydantic import ValidationError

from app.models.transcript import TranscriptInput
from app.models.graph import GraphOutput
from app.services.graph_compiler import compiler
from app.services.validator import ValidationError as RuthlessValidationError

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "healthy"}


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
