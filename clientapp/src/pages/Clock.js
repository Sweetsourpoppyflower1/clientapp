import React, { useEffect, useRef, useState } from "react";

/**
 * Circular countdown that counts down euros instead of seconds.
 *
 * Controls:
 *  - "Start Euros" input: initial euros to count down from
 *  - "Min Euros" input: the value at which the timer should stop
 *  - "Duration (s)" input: how many seconds until the euros reach the min value
 *  - "Set" button: applies inputs and resets timer
 *  - Start / Pause / Reset controls
 *
 * Display:
 *  - Circular SVG arc whose curved length decreases proportional to remaining euros (between total and min)
 *  - Centered euro amount (formatted as €0.00)
 *  - Read-only field that shows how many euros are removed per tick (based on duration)
 */
export default function Clock({
  initialSeconds = 10,
  initialEuros = 100,
  initialMinCost = 0,
  size = 360,
  stroke = 24,
  onComplete,
}) {
  // UI inputs (strings so partial input allowed)
  const [eurosInput, setEurosInput] = useState(String(Math.floor(initialEuros)));
  const [durationInput, setDurationInput] = useState(String(Math.floor(initialSeconds)));
  const [minCostInput, setMinCostInput] = useState(String(Math.floor(initialMinCost)));

  // internal numeric state
  const [totalEuros, setTotalEuros] = useState(Math.max(0, Number(initialEuros)));
  const [remainingEuros, setRemainingEuros] = useState(Math.max(0, Number(initialEuros)));
  const [totalMs, setTotalMs] = useState(Math.max(0, Math.floor(initialSeconds)) * 1000);
  const [minCostValue, setMinCostValue] = useState(Math.max(0, Number(initialMinCost)));

  const [isRunning, setIsRunning] = useState(false);
  const lastTickRef = useRef(null);
  const timerRef = useRef(null);

  const TICK_MS = 80; // determines update frequency and euros-per-tick calculation

  // apply settings from inputs
  const applySettings = () => {
    const parsedEuros = Number(eurosInput);
    const euros = Number.isFinite(parsedEuros) ? Math.max(0, parsedEuros) : 0;
    const parsedSecs = Number(durationInput);
    const secs = Number.isFinite(parsedSecs) ? Math.max(0, Math.floor(parsedSecs)) : 0;
    const ms = secs * 1000;
    const parsedMin = Number(minCostInput);
    const minVal = Number.isFinite(parsedMin) ? Math.max(0, parsedMin) : 0;

    // ensure minCost does not exceed total euros
    const clampedMin = Math.min(minVal, euros);

    setTotalEuros(euros);
    setRemainingEuros(euros);
    setTotalMs(ms);
    setMinCostValue(clampedMin);
    setIsRunning(false);
    lastTickRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // helper: euros/sec and euros/tick -- based on amount that should be removed (total - min)
  const removableAmount = Math.max(0, totalEuros - minCostValue);
  const eurosPerSecond = totalMs > 0 ? removableAmount / (totalMs / 1000) : 0;
  const eurosPerTick = (eurosPerSecond * TICK_MS) / 1000;

  // reset when top-level initial props change
  useEffect(() => {
    setEurosInput(String(Math.floor(initialEuros)));
    setDurationInput(String(Math.floor(initialSeconds)));
    setMinCostInput(String(Math.floor(initialMinCost)));
    setTotalEuros(Math.max(0, Number(initialEuros)));
    setRemainingEuros(Math.max(0, Number(initialEuros)));
    setTotalMs(Math.max(0, Math.floor(initialSeconds)) * 1000);
    setMinCostValue(Math.max(0, Number(initialMinCost)));
    setIsRunning(false);
    lastTickRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [initialEuros, initialSeconds, initialMinCost]);

  // timer loop (uses delta time so duration is accurate)
  useEffect(() => {
    // don't run if not started or already at/below min cost
    if (!isRunning || remainingEuros <= minCostValue || totalEuros <= 0 || totalMs <= 0) {
      if (remainingEuros <= minCostValue && typeof onComplete === "function") onComplete();
      return;
    }

    lastTickRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const last = lastTickRef.current || now;
      const delta = now - last;
      lastTickRef.current = now;

      // compute euros removed this tick based on total removal schedule
      const eurosPerMs = totalMs > 0 ? removableAmount / totalMs : 0;
      const eurosToRemove = eurosPerMs * delta;

      setRemainingEuros((prev) => {
        const next = Math.max(minCostValue, prev - eurosToRemove);
        if (next <= minCostValue) {
          // reached min, stop timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsRunning(false);
          if (typeof onComplete === "function") onComplete();
        }
        return next;
      });
    }, TICK_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // include minCostValue and removableAmount so effect restarts when limits change
  }, [isRunning, totalEuros, totalMs, remainingEuros, minCostValue, removableAmount, onComplete]);

  const toggle = () => {
    if (remainingEuros <= minCostValue) {
      setRemainingEuros(totalEuros);
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
    setRemainingEuros(totalEuros);
  };

  const formatEuros = (value) => {
    return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(value);
  };

  // SVG math (uses euro fraction between total and min)
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const denom = Math.max(0.000001, totalEuros - minCostValue); // avoid divide by zero
  const fraction = totalEuros > minCostValue ? Math.max(0, (remainingEuros - minCostValue) / denom) : 0;
  const dashoffset = circumference * (1 - fraction);

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", fontFamily: "Segoe UI, Roboto, sans-serif" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Euro countdown" role="img">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e6eefc" strokeWidth={stroke} fill="transparent" />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#10b981"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: "stroke-dashoffset 0.08s linear" }}
          />
        </g>

        <foreignObject x={stroke} y={size / 2 - 18} width={size - stroke * 2} height={36}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ textAlign: "center", fontWeight: 700, fontSize: 18, color: "#064e3b" }}>
            {formatEuros(remainingEuros)}
          </div>
        </foreignObject>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label>Start Euros:</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={eurosInput}
            onChange={(e) => setEurosInput(e.target.value)}
            style={{ width: 110, padding: "6px 8px" }}
            aria-label="Start euros"
                  />
          <label>Min Euros:</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={minCostInput}
            onChange={(e) => setMinCostInput(e.target.value)}
            style={{ width: 80, padding: "6px 8px" }}
            aria-label="Min Euros"
                  />
          <label>Duration in Seconds:</label>
          <input
            type="number"
            min="0"
            value={durationInput}
            onChange={(e) => setDurationInput(e.target.value)}
            style={{ width: 90, padding: "6px 8px" }}
            aria-label="Duration in seconds"
          />
          <button onClick={applySettings} style={{ padding: "8px 12px" }}>
            Set
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={toggle} style={{ padding: "8px 12px" }}>
            {isRunning ? "Pause" : "Start"}
          </button>
          <button onClick={reset} style={{ padding: "8px 12px" }}>
            Reset
          </button>
        </div>

        <div style={{ fontSize: 12, color: "#374151" }}>
          <div>
            {Math.round(fraction * 100)}% remaining — {remainingEuros.toFixed(2)} (min{" "}
            {minCostValue.toFixed(2)})
          </div>
          <div style={{ marginTop: 6 }}>
            Euros / sec: {eurosPerSecond.toFixed(2)} — Euros / tick ({TICK_MS}ms): {eurosPerTick.toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
}