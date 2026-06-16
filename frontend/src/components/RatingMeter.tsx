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
    <div className="w-full rounded-2xl glass-panel p-5 animate-fade-in-up hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-ink/60">{label}</span>
        <span className={`text-sm ${textClass}`}>{value}</span>
      </div>
      <div className="mt-4 h-3 w-full rounded-full bg-ink/5 shadow-inner overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${bgClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2.5 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-ink/40">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
  );
}
