/**
 * RUTHLESS Timeline.
 * Drag to select time range. Density visualization.
 */
import { useRef, useEffect, useState, useCallback } from "react";
import type { GraphNode } from "../types/graph";

interface TimelineProps {
  nodes: GraphNode[];
  duration: number;
  highlightedRange: { t0: number; t1: number } | null;
  onRangeChange: (range: { t0: number; t1: number } | null) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function Timeline({
  nodes,
  duration,
  highlightedRange,
  onRangeChange,
}: TimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);

  // Default to 10 minutes if duration not set
  const totalDuration = duration || 600;

  const timeToX = useCallback(
    (time: number, width: number) => {
      return (time / totalDuration) * width;
    },
    [totalDuration]
  );

  const xToTime = useCallback(
    (x: number, width: number) => {
      return (x / width) * totalDuration;
    },
    [totalDuration]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Background
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, width, height);

    // Highlighted range
    if (highlightedRange) {
      const x1 = timeToX(highlightedRange.t0, width);
      const x2 = timeToX(highlightedRange.t1, width);
      ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
      ctx.fillRect(x1, 0, x2 - x1, height);
    }

    // Build density map
    const densityMap = new Array(Math.ceil(width)).fill(0);

    nodes.forEach((node) => {
      node.time_spans.forEach((span) => {
        const x1 = Math.floor(timeToX(span.t0, width));
        const x2 = Math.ceil(timeToX(span.t1, width));
        for (let x = Math.max(0, x1); x < Math.min(width, x2); x++) {
          densityMap[x] += node.density;
        }
      });
    });

    const maxDensity = Math.max(...densityMap, 0.1);

    // Draw density area
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let x = 0; x < width; x++) {
      const normalizedDensity = densityMap[x] / maxDensity;
      const y = height - normalizedDensity * height * 0.8;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(139, 92, 246, 0.8)");
    gradient.addColorStop(1, "rgba(139, 92, 246, 0.1)");
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw density line
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const normalizedDensity = densityMap[x] / maxDensity;
      const y = height - normalizedDensity * height * 0.8;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Time labels
    ctx.fillStyle = "#9ca3af";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";

    const tickInterval =
      totalDuration > 600 ? 120 : totalDuration > 300 ? 60 : 30;
    for (let t = 0; t <= totalDuration; t += tickInterval) {
      const x = timeToX(t, width);
      ctx.fillText(formatTime(t), x, height - 4);
    }
  }, [nodes, totalDuration, highlightedRange, timeToX]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const time = xToTime(x, rect.width);

    setIsDragging(true);
    setDragStart(time);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStart === null) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const time = xToTime(x, rect.width);

    const t0 = Math.min(dragStart, time);
    const t1 = Math.max(dragStart, time);

    onRangeChange({ t0, t1 });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleDoubleClick = () => {
    onRangeChange(null);
  };

  return (
    <div className="timeline" ref={containerRef}>
      <div className="timeline-header">
        <span>Timeline</span>
        {highlightedRange && (
          <span className="range-display">
            {formatTime(highlightedRange.t0)} → {formatTime(highlightedRange.t1)}
          </span>
        )}
        {highlightedRange && (
          <button className="clear-btn" onClick={() => onRangeChange(null)}>
            Clear
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="timeline-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  );
}
