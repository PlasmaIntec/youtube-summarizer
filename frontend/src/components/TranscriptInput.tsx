import { useState } from "react";
import type { TranscriptInput as TranscriptInputType } from "../types/graph";

interface TranscriptInputProps {
  onSubmit: (input: TranscriptInputType) => void;
  isLoading: boolean;
}

const EXAMPLE_TRANSCRIPT = `{
  "transcript": [
    { "t0": 0, "t1": 15, "text": "Today we're going to explore a fascinating concept in machine learning." },
    { "t0": 15, "t1": 30, "text": "Neural networks are composed of layers of interconnected nodes." },
    { "t0": 30, "t1": 45, "text": "Each node applies a transformation to its inputs." },
    { "t0": 45, "t1": 60, "text": "The key insight is that these transformations can be learned from data." }
  ],
  "title": "Introduction to Neural Networks"
}`;

export function TranscriptInput({ onSubmit, isLoading }: TranscriptInputProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);

    try {
      const parsed = JSON.parse(input);

      if (!parsed.transcript || !Array.isArray(parsed.transcript)) {
        throw new Error('Input must contain a "transcript" array');
      }

      for (const seg of parsed.transcript) {
        if (
          typeof seg.t0 !== "number" ||
          typeof seg.t1 !== "number" ||
          typeof seg.text !== "string"
        ) {
          throw new Error(
            "Each transcript segment must have t0, t1 (numbers) and text (string)"
          );
        }
      }

      onSubmit(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  };

  const loadExample = () => {
    setInput(EXAMPLE_TRANSCRIPT);
    setError(null);
  };

  return (
    <div className="transcript-input">
      <div className="input-header">
        <h2>Transcript Input</h2>
        <button className="example-btn" onClick={loadExample}>
          Load Example
        </button>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={`Paste your transcript JSON here...

Format:
{
  "transcript": [
    { "t0": 0, "t1": 30, "text": "..." }
  ],
  "title": "Optional title"
}`}
        disabled={isLoading}
      />

      {error && <div className="error-message">{error}</div>}

      <button
        className="submit-btn"
        onClick={handleSubmit}
        disabled={isLoading || !input.trim()}
      >
        {isLoading ? "Compiling..." : "Compile Graph"}
      </button>

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner" />
          <p>Processing transcript with Claude...</p>
        </div>
      )}
    </div>
  );
}
