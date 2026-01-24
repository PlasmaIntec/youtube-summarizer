"""
Graph Compiler.
Converts transcript → fact graph via LLM.
"""
import json
import os
from anthropic import Anthropic
from openai import OpenAI
from dotenv import load_dotenv

from app.models.transcript import TranscriptInput
from app.models.graph import GraphOutput
from app.prompts.compiler import SYSTEM_PROMPT
from app.services.validator import validate_and_fix

load_dotenv()


class GraphCompiler:
    def __init__(self):
        self.anthropic_client = None
        self.openai_client = None

        if os.getenv("ANTHROPIC_API_KEY"):
            self.anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        if os.getenv("OPENAI_API_KEY"):
            self.openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def compile(self, input_data: TranscriptInput) -> GraphOutput:
        user_message = self._build_user_message(input_data)
        provider = input_data.provider

        if provider == "chatgpt":
            response_text = self._call_openai(user_message)
        else:
            response_text = self._call_anthropic(user_message)

        graph_json = self._extract_json(response_text)

        # Parse and fix any structural issues
        output = GraphOutput.model_validate(graph_json)
        output = validate_and_fix(output)

        return output

    def _call_anthropic(self, user_message: str) -> str:
        if not self.anthropic_client:
            raise ValueError("ANTHROPIC_API_KEY not configured")

        response = self.anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}]
        )
        return response.content[0].text

    def _call_openai(self, user_message: str) -> str:
        if not self.openai_client:
            raise ValueError("OPENAI_API_KEY not configured")

        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            max_tokens=4000,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ]
        )
        return response.choices[0].message.content

    def _build_user_message(self, input_data: TranscriptInput) -> str:
        transcript_data = {
            "transcript": [
                {"timestamp": seg.t0, "text": seg.text}
                for seg in input_data.transcript
            ]
        }
        return json.dumps(transcript_data, indent=2)

    def _extract_json(self, text: str) -> dict:
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())


compiler = GraphCompiler()
