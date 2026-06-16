import React from "react";

interface RatingMeterProps {
  label: string;
  value: string; // "High" | "Medium" | "Low" or similar
}

export function RatingMeter({ label, value }: RatingMeterProps) {
  const normValue = value.toLowerCase().trim();
  
  let percentage = 50;
  let bgClass = "bg-amber-500";
  let textClass = "text-amber-700";

  if (normValue === "high" || normValue === "build") {
    percentage = 100;
    bgClass = "bg-emerald-500";
    textClass = "text-emerald-700 font-semibold";
  } else if (normValue === "low" || normValue === "avoid") {
    percentage = 20;
    bgClass = "bg-rose-500";
    textClass = "text-rose-700 font-semibold";
  } else if (normValue === "pivot" || normValue === "research further" || normValue === "medium") {
    percentage = 60;
    bgClass = "bg-amber-500";
    textClass = "text-amber-700 font-semibold";
  }

  return (
    <div className="w-full rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink/50">{label}</span>
        <span className={`text-sm ${textClass}`}>{value}</span>
      </div>
      <div className="mt-3 h-2.5 w-full rounded-full bg-ink/10">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${bgClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-normal text-ink/40">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
  );
}
