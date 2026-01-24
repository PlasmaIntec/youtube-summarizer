import type { LoadingStage } from "../App";

interface ProgressIndicatorProps {
  stage: LoadingStage;
  mode: "url" | "json";
  provider: "claude" | "chatgpt";
}

const STAGES_URL = [
  { key: "fetching", label: "Fetching transcript", description: "Downloading captions from YouTube..." },
  { key: "generating", label: "Generating nodes", description: "AI is analyzing the transcript..." },
  { key: "validating", label: "Validating graph", description: "Checking RUTHLESS constraints..." },
] as const;

const STAGES_JSON = [
  { key: "generating", label: "Generating nodes", description: "AI is analyzing the transcript..." },
  { key: "validating", label: "Validating graph", description: "Checking RUTHLESS constraints..." },
] as const;

export function ProgressIndicator({ stage, mode, provider }: ProgressIndicatorProps) {
  if (stage === "idle") return null;

  const stages = mode === "url" ? STAGES_URL : STAGES_JSON;
  const currentIndex = stages.findIndex((s) => s.key === stage);
  const currentStage = stages[currentIndex];

  return (
    <div className="progress-indicator">
      <div className="progress-stages">
        {stages.map((s, i) => {
          const isComplete = i < currentIndex;
          const isCurrent = s.key === stage;
          const isPending = i > currentIndex;

          return (
            <div
              key={s.key}
              className={`progress-stage ${isComplete ? "complete" : ""} ${isCurrent ? "current" : ""} ${isPending ? "pending" : ""}`}
            >
              <div className="stage-indicator">
                {isComplete ? (
                  <svg viewBox="0 0 24 24" className="check-icon">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                ) : isCurrent ? (
                  <div className="stage-spinner" />
                ) : (
                  <div className="stage-dot" />
                )}
              </div>
              <span className="stage-label">{s.label}</span>
            </div>
          );
        })}
      </div>

      <div className="progress-details">
        <p className="progress-description">{currentStage?.description}</p>
        {stage === "generating" && (
          <p className="progress-model">Using {provider === "claude" ? "Claude" : "ChatGPT"}</p>
        )}
      </div>
    </div>
  );
}
