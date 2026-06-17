import React from "react";
import type { ScoringRubricSection } from "../types/report";

interface RadarChartProps {
  rubric: ScoringRubricSection;
}

const LABELS: Record<string, string> = {
  market_size: "Market Size",
  competitive_advantage: "Competitive\nAdvantage",
  technical_feasibility: "Technical\nFeasibility",
  monetization_potential: "Monetization",
  founder_fit: "Founder Fit",
};

const KEYS = [
  "market_size",
  "competitive_advantage",
  "technical_feasibility",
  "monetization_potential",
  "founder_fit",
] as const;

type RubricKey = (typeof KEYS)[number];

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleIndex: number,
  total: number
): [number, number] {
  // Start from top (−90°)
  const angle = ((2 * Math.PI) / total) * angleIndex - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

export function RadarChart({ rubric }: RadarChartProps) {
  const cx = 150;
  const cy = 150;
  const maxR = 100;
  const n = KEYS.length;

  // Build grid rings (20%, 40%, 60%, 80%, 100%)
  const gridRings = [20, 40, 60, 80, 100].map((pct) => {
    const r = (maxR * pct) / 100;
    const pts = KEYS.map((_, i) => polarToCartesian(cx, cy, r, i, n).join(",")).join(" ");
    return { pct, pts };
  });

  // Build data polygon
  const dataPoints = KEYS.map((key, i) => {
    const score = (rubric[key as RubricKey] as { score: number }).score;
    const r = (maxR * score) / 10; // score is /10
    return polarToCartesian(cx, cy, r, i, n);
  });
  const dataPolygon = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");

  // Axis lines (from center to each vertex)
  const axes = KEYS.map((_, i) => polarToCartesian(cx, cy, maxR, i, n));

  // Label positions (slightly outside maxR)
  const labelPositions = KEYS.map((key, i) => {
    const [x, y] = polarToCartesian(cx, cy, maxR + 28, i, n);
    return { key, x, y, label: LABELS[key] };
  });

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 300" className="w-full max-w-xs" aria-label="Venture scoring radar chart">
        {/* Grid rings */}
        {gridRings.map(({ pct, pts }) => (
          <polygon
            key={pct}
            points={pts}
            fill="none"
            stroke="rgba(22,32,29,0.07)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {axes.map(([x, y], i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(22,32,29,0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Data polygon fill */}
        <polygon
          points={dataPolygon}
          fill="rgba(49,92,77,0.18)"
          stroke="#315c4d"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {dataPoints.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="#315c4d" />
        ))}

        {/* Labels */}
        {labelPositions.map(({ key, x, y, label }) => {
          const score = (rubric[key as RubricKey] as { score: number }).score;
          const lines = label.split("\n");
          return (
            <text
              key={key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fontWeight="700"
              fill="rgba(22,32,29,0.55)"
            >
              {lines.map((line, li) => (
                <tspan key={li} x={x} dy={li === 0 ? 0 : 11}>
                  {line}
                </tspan>
              ))}
              <tspan
                x={x}
                dy={lines.length * 11 + 2}
                fontSize="10"
                fontWeight="900"
                fill="#315c4d"
              >
                {score}/10
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}
