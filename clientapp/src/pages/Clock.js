import React, { useEffect, useRef, useState } from "react";

/**
 * Circular bar countdown timer (arc length decreases smoothly).
 *
 * Props:
 *  - initialSeconds: number of seconds to count down (default 60)
 *  - size: diameter in px of the circle (default 140)
 *  - stroke: stroke width in px of the arc (default 12)
 *  - onComplete: optional callback when countdown reaches zero
 *
 * Behavior:
 *  - The SVG arc's stroke length (curved along the ring) shrinks smoothly as time elapses.
 *  - Uses a short-interval timer to update remaining milliseconds for a smooth animation.
 */
export default function Clock({
  initialSeconds = 60,
  size = 140,
  stroke = 12,
  onComplete,
}) {
  const totalMs = Math.max(0, Math.floor(initialSeconds)) * 1000;
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const [isRunning, setIsRunning] = useState(false);
  const lastTickRef = useRef(null);
  const timerRef = useRef(null);

  // Reset when initialSeconds changes
  useEffect(() => {
    const ms = Math.max(0, Math.floor(initialSeconds)) * 1000;
    setRemainingMs(ms);
    setIsRunning(false);
    lastTickRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [initialSeconds]);

  // Smooth countdown using small interval and delta time
  useEffect(() => {
    if (!isRunning || remainingMs <= 0) {
      if (remainingMs <= 0) {
        // ensure stopped and callback fired once
        setIsRunning(false);
        if (typeof onComplete === "function") onComplete();
      }
      return;
    }

    lastTickRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const last = lastTickRef.current || now;
      const delta = now - last;
      lastTickRef.current = now;

      setRemainingMs((prev) => {
        const next = Math.max(0, prev - delta);
        if (next === 0) {
          // cleanup
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
        return next;
      });
    }, 80); // ~12.5fps - smooth enough and cheap

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, onComplete, remainingMs]);

  const toggle = () => {
    if (remainingMs === 0) {
      // restart from full if at zero
      setRemainingMs(Math.max(0, Math.floor(initialSeconds)) * 1000);
    }
    setIsRunning((v) => !v);
  };

  const reset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    lastTickRef.current = null;
    setIsRunning(false);
    setRemainingMs(Math.max(0, Math.floor(initialSeconds)) * 1000);
  };

  const format = (ms) => {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // SVG circle math
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = totalMs > 0 ? Math.max(0, remainingMs / totalMs) : 0;
  const dashoffset = circumference * (1 - fraction);

  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        fontFamily: "Segoe UI, Roboto, sans-serif",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label="Countdown timer"
        role="img"
      >
        {/* background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e6eefc"
          strokeWidth={stroke}
          fill="transparent"
        />
        {/* foreground arc (shrinking) - rotate to start at top */}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3b82f6"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{
              transition: "stroke-dashoffset 0.08s linear",
            }}
          />
        </g>

        {/* centered text */}
        <foreignObject
          x={stroke}
          y={size / 2 - 18}
          width={size - stroke * 2}
          height={36}
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: 18,
              color: "#0f172a",
            }}
          >
            {format(remainingMs)}
          </div>
        </foreignObject>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={toggle} style={{ padding: "8px 12px" }}>
            {isRunning ? "Pause" : "Start"}
          </button>
          <button onClick={reset} style={{ padding: "8px 12px" }}>
            Reset
          </button>
        </div>
        <div style={{ fontSize: 12, color: "#374151" }}>
          {Math.round(fraction * 100)}% remaining — {Math.ceil(remainingMs / 1000)}s
        </div>
      </div>
    </div>
  );
}