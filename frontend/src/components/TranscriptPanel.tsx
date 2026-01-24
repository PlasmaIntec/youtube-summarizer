import type { TranscriptSegment } from "../types/graph";

interface TranscriptPanelProps {
  transcript: TranscriptSegment[];
  onSeek?: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TranscriptPanel({ transcript, onSeek }: TranscriptPanelProps) {
  return (
    <div className="transcript-panel">
      <div className="transcript-header">Transcript</div>
      <div className="transcript-content">
        {transcript.map((segment, index) => (
          <div
            key={index}
            className={`transcript-segment ${onSeek ? "clickable" : ""}`}
            onClick={() => onSeek?.(segment.t0)}
          >
            <span className="transcript-time">{formatTime(segment.t0)}</span>
            <span className="transcript-text">{segment.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
