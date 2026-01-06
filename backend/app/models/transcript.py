from pydantic import BaseModel
from typing import Optional


class TranscriptSegment(BaseModel):
    t0: int
    t1: int
    text: str


class TranscriptInput(BaseModel):
    transcript: list[TranscriptSegment]
    title: Optional[str] = None
    description: Optional[str] = None
    channel: Optional[str] = None
