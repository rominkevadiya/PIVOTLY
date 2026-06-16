import React from "react";

interface SwotGridProps {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export function SwotGrid({ strengths, weaknesses, opportunities, threats }: SwotGridProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl glass-panel animate-fade-in-up" style={{ animationDelay: '100ms' }}>
      <div className="border-b border-white/50 px-5 py-5 bg-white/40 backdrop-blur-md">
        <h3 className="text-sm font-bold uppercase tracking-widest text-moss text-gradient">SWOT Matrix Analysis</h3>
      </div>
      <div className="grid md:grid-cols-2 print:grid print:grid-cols-2">
        {/* Strengths */}
        <div className="border-b border-ink/10 p-5 md:border-r">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
              S
            </span>
            <h4 className="text-sm font-bold tracking-tight text-ink">Strengths & Moats</h4>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink/75 list-disc list-inside">
            {strengths.map((s, idx) => (
              <li key={idx} className="marker:text-emerald-500">{s}</li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="border-b border-ink/10 p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
              W
            </span>
            <h4 className="text-sm font-bold tracking-tight text-ink">Weaknesses & Risks</h4>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink/75 list-disc list-inside">
            {weaknesses.map((w, idx) => (
              <li key={idx} className="marker:text-amber-500">{w}</li>
            ))}
          </ul>
        </div>

        {/* Opportunities */}
        <div className="p-5 border-b border-ink/10 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
              O
            </span>
            <h4 className="text-sm font-bold tracking-tight text-ink">Opportunities & Gaps</h4>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink/75 list-disc list-inside">
            {opportunities.map((o, idx) => (
              <li key={idx} className="marker:text-blue-500">{o}</li>
            ))}
          </ul>
        </div>

        {/* Threats */}
        <div className="p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-800">
              T
            </span>
            <h4 className="text-sm font-bold tracking-tight text-ink">Threats & Competitors</h4>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink/75 list-disc list-inside">
            {threats.map((t, idx) => (
              <li key={idx} className="marker:text-rose-500">{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
