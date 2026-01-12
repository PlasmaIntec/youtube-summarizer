"""
RUTHLESS Graph Compiler.
Converts transcript → validated information graph.
"""
import json
import os
from anthropic import Anthropic
from dotenv import load_dotenv

from app.models.transcript import TranscriptInput
from app.models.graph import GraphOutput
from app.prompts.compiler import SYSTEM_PROMPT
from app.services.validator import validate_or_raise, ValidationError

load_dotenv()


class GraphCompiler:
    def __init__(self):
        self.client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.model = "claude-sonnet-4-20250514"

    def compile(self, input_data: TranscriptInput) -> GraphOutput:
        user_message = self._build_user_message(input_data)

        response = self.client.messages.create(
            model=self.model,
            max_tokens=8000,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_message}
            ]
        )

        response_text = response.content[0].text
        graph_json = self._extract_json(response_text)

        # Parse and validate ruthlessly
        output = GraphOutput.model_validate(graph_json)
        validate_or_raise(output)

        return output

    def _build_user_message(self, input_data: TranscriptInput) -> str:
        transcript_data = {
            "transcript": [
                {"t0": seg.t0, "t1": seg.t1, "text": seg.text}
                for seg in input_data.transcript
            ]
        }

        if input_data.title:
            transcript_data["title"] = input_data.title
        if input_data.description:
            transcript_data["description"] = input_data.description
        if input_data.channel:
            transcript_data["channel"] = input_data.channel

        return json.dumps(transcript_data, indent=2)

    def _extract_json(self, text: str) -> dict:
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        return json.loads(text)


compiler = GraphCompiler()
