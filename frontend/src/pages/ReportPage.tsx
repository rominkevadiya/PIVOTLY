import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { RecommendationBadge } from "../components/RecommendationBadge";
import { SwotGrid } from "../components/SwotGrid";
import { RadarChart } from "../components/RadarChart";
import { ReportSectionCard } from "../components/ReportSectionCard";
import { getReport } from "../services/api";
import type { ReportResponse } from "../types/report";
import { flushSync } from "react-dom";

type TabId = "strategy" | "competitors" | "risks" | "action" | "summary";

export function ReportPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!reportId) { setError("Report ID is missing."); setIsLoading(false); return; }
    getReport(reportId)
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load report."))
      .finally(() => setIsLoading(false));
  }, [reportId]);

  return (
    <AppLayout>
      {isLoading ? <LoadingState message="Loading report data..." /> : null}
      {error ? <ErrorMessage message={error} /> : null}
      {report ? <ReportContent report={report} /> : null}
    </AppLayout>
  );
}

function ScoreBar({ label, score, reasoning }: { label: string; score: number; reasoning: string }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "#22c55e" : score >= 4 ? "#f59e0b" : "#ef4444";
  return (
    <div className="space-y-1.5 border-b border-ink/5 pb-4 last:border-0 last:pb-0">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-ink capitalize">{label.replace(/_/g, " ")}</span>
        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full border" style={{ color, borderColor: `${color}40`, background: `${color}10` }}>{score}/10</span>
      </div>
      <div className="h-2 w-full rounded-full bg-ink/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-xs text-ink/60 leading-relaxed">{reasoning}</p>
    </div>
  );
}

function normalizeRubric(rubric: any): any {
  if (!rubric) return null;
  const normalized = { ...rubric };
  const keys = [
    "market_size",
    "competitive_advantage",
    "technical_feasibility",
    "monetization_potential",
    "founder_fit"
  ];
  keys.forEach((key) => {
    if (rubric[key] && typeof rubric[key] === "object" && "score" in rubric[key]) {
      // Keep as is
    } else {
      const score = rubric[`${key}_score`] ?? rubric[key]?.score ?? 5;
      const reasoning = rubric.overall_rationale ?? rubric[key]?.reasoning ?? "";
      normalized[key] = { score, reasoning };
    }
  });
  return normalized;
}

function ReportContent({ report }: { report: ReportResponse }) {
  const [activeTab, setActiveTab] = useState<TabId>("strategy");
  const [isPrinting, setIsPrinting] = useState(false);
  const data = report.report_json;
  const normalizedRubric = normalizeRubric(data.scoring_rubric);

  useEffect(() => {
    // Keep beforeprint/afterprint for users who use Ctrl+P or the browser menu instead of the button
    const handleBeforePrint = () => flushSync(() => setIsPrinting(true));
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const createdAt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.created_at));

  const handlePrint = () => {
    // 1. Force React to re-render everything synchronously BEFORE the print dialog!
    // This bypasses iOS Safari's notorious beforeprint bug.
    flushSync(() => {
      setIsPrinting(true);
    });

    const original = document.title;
    document.title = `Pivotly_${(data.overview.one_line_pitch || "Report").replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_").substring(0, 40)}`;
    
    // 2. Call print synchronously to avoid mobile browser popup blockers
    window.print();
    
    // 3. Restore everything after a delay
    setTimeout(() => {
      setIsPrinting(false);
      document.title = original;
    }, 2000);
  };

  const overallScore = Number(data.scoring_rubric?.overall_score || 0);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  const swot = data.swot ?? {
    strengths: [data.overview.one_line_pitch, `Primary: ${data.target_audience.primary_segment}`, data.target_audience.audience_insight],
    weaknesses: data.failure_risks.map((r) => `${r.title || r.risk} (${r.severity})`),
    opportunities: data.opportunity_gaps.map((g) => g.gap),
    threats: data.competitors.map((c) => `${c.name} — ${c.threat_level} threat`),
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "strategy", label: "Strategy & SWOT" },
    { id: "competitors", label: "Market & Competitors" },
    { id: "risks", label: "Risks & Gaps" },
    { id: "action", label: "Action Plan" },
    { id: "summary", label: "Executive Summary" },
  ];

  return (
    <div className="space-y-10 print:space-y-8 print:p-0">

      {/* ── Thin footer — print only ── */}
      <div className="print-footer hidden">
        <span>Pivotly Venture Report</span>
        <span>Ref {report.id.substring(0, 8)} &middot; {createdAt} &middot; Confidential</span>
      </div>

      {/* ── Header ── */}
      <section className="rounded-3xl border border-white/50 bg-white/40 p-6 sm:p-8 backdrop-blur-md shadow-panel animate-fade-in-up">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
          <div className="space-y-3 flex-1">
            <span className="inline-flex items-center rounded-lg bg-moss/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-moss">{report.industry}</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-ink leading-tight">{data.overview.one_line_pitch}</h1>
            <p className="text-[14px] leading-relaxed text-ink/70 font-medium"><strong className="text-ink">Submitted vision:</strong> {report.idea_text}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-ink/40 font-semibold">
              <span>Ref: {report.id.substring(0, 8)}</span>
              <span>&middot;</span>
              <span>Generated: {createdAt}</span>
            </div>
          </div>

          {/* Screen: buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 w-full md:w-auto no-print">
            <div className="flex items-center gap-2.5 justify-center md:justify-end">
              <span className="text-xs font-bold text-ink/40 uppercase">Decision:</span>
              <RecommendationBadge decision={report.recommendation} />
            </div>
            <Button onClick={handlePrint} variant="secondary" className="w-full sm:w-auto">Export PDF / Print</Button>
          </div>

          {/* Print-only verdict strip */}
          <div className="print-verdict-strip hidden print:flex">
            <span>Verdict&nbsp;<strong>{data.recommendation.decision}</strong></span>
            <span>Score&nbsp;<strong>{data.scoring_rubric?.overall_score ?? '—'} / 100</strong></span>
            <span>Confidence&nbsp;<strong>{data.recommendation.confidence}</strong></span>
            <span>Market&nbsp;<strong>{data.market_potential.rating}</strong></span>
          </div>
        </div>
      </section>

      {/* ── Two-column layout ── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_2.1fr] items-start print:block">

        {/* Left sidebar */}
        <div className="lg:sticky lg:top-24 space-y-6 print:w-full print:relative print:grid print:grid-cols-2 print:gap-6 print:space-y-0">

          {/* Score wheel */}
          {data.scoring_rubric && (
            <div className="rounded-3xl border border-white/50 bg-white/40 p-6 shadow-panel backdrop-blur-md text-center flex flex-col items-center animate-fade-in-up" style={{ animationDelay: "50ms" }}>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest block mb-4">Overall Venture Viability</span>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="rgba(22,32,29,0.05)" strokeWidth="8" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="url(#gradMoss)" strokeWidth="8" fill="transparent"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                    className="transition-all duration-1000 ease-out" />
                  <defs>
                    <linearGradient id="gradMoss" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#315c4d" />
                      <stop offset="100%" stopColor="#b56b3f" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-ink">{overallScore}</span>
                  <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Score</span>
                </div>
              </div>
              <div className="mt-4 flex gap-4 w-full justify-around text-xs border-t border-ink/5 pt-4">
                <div>
                  <span className="text-[10px] font-bold text-ink/40 uppercase block">Potential</span>
                  <span className="font-extrabold text-moss">{data.market_potential.rating}</span>
                </div>
                <div className="h-6 w-px bg-ink/5" />
                <div>
                  <span className="text-[10px] font-bold text-ink/40 uppercase block">Confidence</span>
                  <span className="font-extrabold text-copper">{data.recommendation.confidence}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAM / SAM / SOM */}
          {(data.market_potential.tam || data.market_potential.sam || data.market_potential.som) && (
            <div className="rounded-3xl border border-white/50 bg-white/40 p-6 shadow-panel backdrop-blur-md animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest block mb-4">Estimated Addressable Market</span>
              <div className="space-y-3.5">
                {[
                  { label: "TAM", value: data.market_potential.tam, desc: "Total Addressable Market", color: "#b56b3f" },
                  { label: "SAM", value: data.market_potential.sam, desc: "Serviceable Addressable Market", color: "#315c4d" },
                  { label: "SOM", value: data.market_potential.som, desc: "Serviceable Obtainable Market", color: "#22c55e" },
                ].filter((x) => x.value).map(({ label, value, desc, color }) => (
                  <div key={label} className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1.5" style={{ background: color }} />
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-ink/50 uppercase">{label}</span>
                      <span className="text-base font-black text-ink">{value}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-ink/60">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unit Economics */}
          {data.unit_economics && (
            <div className="rounded-3xl border border-white/50 bg-white/40 p-6 shadow-panel backdrop-blur-md animate-fade-in-up" style={{ animationDelay: "150ms" }}>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest block mb-4">Unit Economics</span>
              <div className="space-y-3">
                {[
                  { label: "Revenue Model", value: data.unit_economics.revenue_model },
                  { label: "Est. CAC", value: data.unit_economics.estimated_cac },
                  { label: "Est. LTV", value: data.unit_economics.estimated_ltv },
                  { label: "LTV / CAC", value: data.unit_economics.ltv_cac_ratio },
                  { label: "Payback Period", value: data.unit_economics.payback_period },
                ].filter((x) => x.value).map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center border-b border-ink/5 pb-2 last:border-0 last:pb-0">
                    <span className="text-[10px] font-bold text-ink/40 uppercase">{label}</span>
                    <span className="text-xs font-extrabold text-ink">{value}</span>
                  </div>
                ))}
                <p className="text-[10px] text-ink/60 pt-1 border-t border-ink/5">{data.unit_economics.pricing_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right main area */}
        <div className="space-y-6">
          <nav className="flex border-b border-ink/5 gap-1 no-print overflow-x-auto pb-1.5">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-ink text-white shadow-md" : "text-ink/60 hover:text-ink hover:bg-white/50"}`}>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab 1 — Strategy & SWOT */}
          <div className={`space-y-6 print-page-break print:mt-6 ${activeTab === "strategy" || isPrinting ? "block" : "hidden"}`}>
            {/* Print section banner */}
            <div className="pdf-section-banner hidden print:block">
              <span className="section-num">Section 01</span>
              <span className="section-title">Strategy &amp; SWOT</span>
            </div>
            <ReportSectionCard title="Product Summary & Vision" forceOpen={isPrinting}>
              <p className="text-[15px] leading-relaxed text-ink/80">{data.overview.idea_summary}</p>
            </ReportSectionCard>
            <div className="grid gap-6 sm:grid-cols-2">
              <ReportSectionCard title="Industry & Subsectors" forceOpen={isPrinting}>
                <div className="space-y-3">
                  <div><span className="text-[10px] font-bold text-ink/40 uppercase block">Sector</span><span className="font-extrabold text-moss">{data.industry.primary_industry}</span></div>
                  <div><span className="text-[10px] font-bold text-ink/40 uppercase block">Subsector</span><span className="font-extrabold text-ink">{data.industry.sub_industry}</span></div>
                  <p className="text-xs text-ink/70 border-t border-ink/5 pt-3 mt-2">{data.industry.industry_context}</p>
                </div>
              </ReportSectionCard>
              <ReportSectionCard title="Target Segments" forceOpen={isPrinting}>
                <div className="space-y-3">
                  <div><span className="text-[10px] font-bold text-ink/40 uppercase block">Primary</span><span className="font-extrabold text-ink">{data.target_audience.primary_segment}</span></div>
                  <div><span className="text-[10px] font-bold text-ink/40 uppercase block">Secondary</span><span className="font-extrabold text-ink/80">{data.target_audience.secondary_segment}</span></div>
                  <p className="text-xs text-ink/70 border-t border-ink/5 pt-3 mt-2">{data.target_audience.audience_insight}</p>
                </div>
              </ReportSectionCard>
            </div>
            <SwotGrid strengths={swot.strengths} weaknesses={swot.weaknesses} opportunities={swot.opportunities} threats={swot.threats} />
          </div>

          {/* Tab 2 — Market & Competitors */}
          <div className={`space-y-6 print-page-break print:mt-6 ${activeTab === "competitors" || isPrinting ? "block" : "hidden"}`}>
            <div className="pdf-section-banner hidden print:block">
              <span className="section-num">Section 02</span>
              <span className="section-title">Market &amp; Competitors</span>
            </div>
            <ReportSectionCard title="Competitor Intelligence Grid" forceOpen={isPrinting}>
              <div className="grid gap-5 sm:grid-cols-2">
                {data.competitors.map((c) => (
                  <div key={c.name} className="flex flex-col justify-between rounded-2xl border border-white bg-white/50 p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 border-b border-ink/5 pb-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-ink text-sm">{c.name}</p>
                            {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-moss hover:underline">Visit Site</a>}
                          </div>
                          <p className="text-[10px] font-bold text-ink/40 uppercase">{c.category ? `${c.category} · ` : ""}{c.competitor_type}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${c.threat_level === "High" ? "bg-rose-50 border-rose-200 text-rose-700" : c.threat_level === "Medium" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>{c.threat_level} Threat</span>
                          {c.confidence_score && <span className="text-[9px] font-bold text-ink/50">Conf: {c.confidence_score}%</span>}
                        </div>
                      </div>
                      {c.reason_for_inclusion && (
                        <p className="text-xs leading-relaxed text-ink/70 italic bg-white/40 p-2 rounded-lg border border-ink/5 mt-1">"Why: {c.reason_for_inclusion}"</p>
                      )}
                      <p className="text-xs leading-relaxed text-ink/80 mt-1">{c.description}</p>
                      {c.strength && (
                        <p className="text-xs text-ink/80"><strong className="text-moss">Core Moat:</strong> {c.strength}</p>
                      )}
                      {c.evidence && <p className="text-[11px] text-ink/70 mt-2 bg-ink/5 p-2 rounded border-l-2 border-moss"><strong>Evidence:</strong> {c.evidence} {c.source_url && <a href={c.source_url} className="text-moss underline ml-1" target="_blank" rel="noopener noreferrer">[Source]</a>}</p>}
                    </div>
                    <div className="mt-4 flex gap-2 no-print border-t border-ink/5 pt-3">
                      <a href={`https://www.google.com/search?q=${encodeURIComponent(c.name)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl bg-white border border-ink/10 px-3 py-1.5 text-[10px] font-bold text-ink hover:bg-ink hover:text-white transition">Web Search</a>
                      <a href={`https://www.crunchbase.com/text-search/organizations?q=${encodeURIComponent(c.name)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl bg-white border border-ink/10 px-3 py-1.5 text-[10px] font-bold text-ink hover:bg-ink hover:text-white transition">Crunchbase</a>
                    </div>
                  </div>
                ))}
              </div>
            </ReportSectionCard>
            <ReportSectionCard title="Market Rationale" forceOpen={isPrinting}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-ink/40 uppercase block">Addressable Potential</span>
                    <p className="font-bold text-moss mt-0.5">{data.market_potential.rationale}</p>
                  </div>
                  {data.market_potential.confidence_score && <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-ink/10 shadow-sm text-ink/70">Conf: {data.market_potential.confidence_score}%</span>}
                </div>
                <p className="text-xs leading-relaxed text-ink/70">{data.market_potential.estimated_market_context}</p>
                {data.market_potential.evidence && (
                  <div className="text-[11px] text-ink/70 mt-2 bg-ink/5 p-3 rounded-lg border-l-2 border-moss">
                    <strong className="block mb-1">Market Evidence:</strong> {data.market_potential.evidence}
                    {data.market_potential.source_url && <a href={data.market_potential.source_url} className="text-moss underline ml-1" target="_blank" rel="noopener noreferrer">[Source]</a>}
                  </div>
                )}
              </div>
            </ReportSectionCard>
          </div>

          {/* Tab 3 — Risks & Gaps */}
          <div className={`space-y-6 print-page-break print:mt-6 ${activeTab === "risks" || isPrinting ? "block" : "hidden"}`}>
            <div className="pdf-section-banner hidden print:block">
              <span className="section-num">Section 03</span>
              <span className="section-title">Risks &amp; Gaps</span>
            </div>
            <ReportSectionCard title="Failure Risk Analysis" forceOpen={isPrinting}>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.failure_risks.map((r) => {
                  const riskTitle = r.title || r.risk || "";
                  return (
                    <div key={riskTitle} className="rounded-2xl border border-rose-100 bg-rose-50/20 p-5 hover:bg-rose-50/50 transition-all space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-ink text-sm">{riskTitle}</p>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded">{r.severity} Severity</span>
                          {r.confidence_score && <span className="text-[9px] font-bold text-rose-800/60">Conf: {r.confidence_score}%</span>}
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-ink/75">{r.description}</p>
                      {r.evidence && (
                        <p className="text-[10px] text-rose-900/80 bg-rose-100/30 p-2 rounded border-l-2 border-rose-300 mt-2"><strong>Evidence:</strong> {r.evidence}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ReportSectionCard>
            <div className="grid gap-6 sm:grid-cols-2">
              <ReportSectionCard title="Opportunity Gaps" forceOpen={isPrinting}>
                <div className="divide-y divide-ink/5">
                  {data.opportunity_gaps.map((g) => (
                     <div key={g.gap} className="py-3.5 first:pt-0 last:pb-0">
                       <p className="font-bold text-ink text-xs">{g.gap}</p>
                       <p className="text-xs text-ink/70 mt-1">{g.description}</p>
                     </div>
                  ))}
                </div>
              </ReportSectionCard>
              <ReportSectionCard title="Improvement Suggestions" forceOpen={isPrinting}>
                <div className="divide-y divide-ink/5">
                  {data.improvement_suggestions.map((s) => (
                     <div key={s.suggestion} className="py-3.5 first:pt-0 last:pb-0">
                       <p className="font-bold text-moss text-xs">{s.suggestion}</p>
                       <p className="text-xs text-ink/70 mt-1">{s.rationale}</p>
                     </div>
                  ))}
                </div>
              </ReportSectionCard>
            </div>
            
            {data.contrarian_analysis && (
              <ReportSectionCard title="Contrarian Analysis / Red Team" forceOpen={isPrinting}>
                <div className="rounded-2xl border border-rose-200 bg-rose-50/20 p-5 shadow-sm space-y-5">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase text-rose-700 tracking-wider mb-2">Why This Might Fail</h4>
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-ink/80 marker:text-rose-400">
                      {data.contrarian_analysis.recommendation_risks.map((risk, i) => <li key={i}>{risk}</li>)}
                    </ul>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5 pt-3 border-t border-rose-100">
                    <div>
                      <h4 className="text-[11px] font-bold uppercase text-ink/60 tracking-wider mb-2">Counterarguments</h4>
                      <ul className="space-y-1.5 pl-4 list-disc text-xs text-ink/70">
                        {data.contrarian_analysis.counterarguments.map((arg, i) => <li key={i}>{arg}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase text-ink/60 tracking-wider mb-2">Alternative Interpretations</h4>
                      <ul className="space-y-1.5 pl-4 list-disc text-xs text-ink/70">
                        {data.contrarian_analysis.alternative_interpretations.map((alt, i) => <li key={i}>{alt}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </ReportSectionCard>
            )}
          </div>

          {/* Tab 4 — Action Plan (NEW) */}
          <div className={`space-y-6 print-page-break print:mt-6 ${activeTab === "action" || isPrinting ? "block" : "hidden"}`}>
            <div className="pdf-section-banner hidden print:block">
              <span className="section-num">Section 04</span>
              <span className="section-title">Action Plan</span>
            </div>
            {/* Next Steps */}
            {data.next_steps && data.next_steps.length > 0 && (
              <ReportSectionCard title="Prioritised Action Plan" forceOpen={isPrinting}>
                <div className="space-y-4">
                  {data.next_steps.sort((a, b) => a.priority - b.priority).map((step) => (
                    <div key={step.priority} className="flex gap-4 border-b border-ink/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-moss text-white text-sm font-extrabold flex items-center justify-center">{step.priority}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-ink text-sm">{step.action}</p>
                          <span className="text-[10px] font-bold text-copper bg-copper/10 px-2 py-0.5 rounded-full whitespace-nowrap">{step.timeframe}</span>
                        </div>
                        <p className="text-xs text-ink/70">{step.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ReportSectionCard>
            )}

            {/* Go-to-Market */}
            {data.go_to_market && (
              <ReportSectionCard title="Go-to-Market Strategy" forceOpen={isPrinting}>
                <p className="text-sm text-ink/80 mb-5">{data.go_to_market.strategy_summary}</p>
                <div className="space-y-4">
                  {data.go_to_market.phases.map((phase, idx) => {
                    const isNewFormat = typeof phase === "string";
                    if (isNewFormat) {
                      return (
                        <div key={idx} className="rounded-2xl border border-white bg-white/60 p-5 shadow-sm relative overflow-hidden">
                          <div className="absolute left-0 top-0 h-full w-1 bg-moss opacity-60" style={{ opacity: 1 - idx * 0.2 }} />
                          <p className="text-xs leading-relaxed text-ink/85 pl-2 whitespace-pre-line">{phase as string}</p>
                        </div>
                      );
                    } else {
                      const p = phase as any;
                      return (
                        <div key={idx} className="rounded-2xl border border-white bg-white/60 p-5 shadow-sm relative overflow-hidden">
                          <div className="absolute left-0 top-0 h-full w-1 bg-moss opacity-60" style={{ opacity: 1 - idx * 0.2 }} />
                          <div className="flex justify-between items-center mb-3 pl-2">
                            <p className="font-extrabold text-ink text-sm">{p.phase}</p>
                            <span className="text-[10px] font-bold text-ink/50 bg-ink/5 px-2.5 py-1 rounded-full">{p.duration}</span>
                          </div>
                          <p className="text-[10px] font-bold text-moss uppercase mb-2 pl-2">Channel: {p.channel}</p>
                          <ul className="pl-2 space-y-1.5">
                            {p.actions?.map((action: string, ai: number) => (
                              <li key={ai} className="text-xs text-ink/75 flex gap-2">
                                <span className="text-moss font-bold">→</span>{action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                  })}
                </div>
              </ReportSectionCard>
            )}

            {/* Fallback if new data not generated yet */}
            {!data.next_steps && !data.go_to_market && (
              <ReportSectionCard title="Action Plan" forceOpen={isPrinting}>
                <div className="divide-y divide-ink/5">
                  {data.improvement_suggestions.map((s, i) => (
                    <div key={i} className="py-3.5 first:pt-0 last:pb-0 flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-moss/10 text-moss text-xs font-extrabold flex items-center justify-center">{i + 1}</span>
                      <div><p className="font-bold text-moss text-xs">{s.suggestion}</p><p className="text-xs text-ink/70 mt-1">{s.rationale}</p></div>
                    </div>
                  ))}
                </div>
              </ReportSectionCard>
            )}
          </div>

          {/* Tab 5 — Executive Summary */}
          <div className={`space-y-6 print-page-break print:mt-6 ${activeTab === "summary" || isPrinting ? "block" : "hidden"}`}>
            <div className="pdf-section-banner hidden print:block">
              <span className="section-num">Section 05</span>
              <span className="section-title">Executive Summary</span>
            </div>
            
            {data.investor_verdict && (
              <div className="rounded-3xl border border-ink/10 bg-gradient-to-br from-white to-ink/[0.02] p-6 shadow-panel">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-ink/5 pb-4">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-ink/40 mb-1">VC Memo Verdict</h3>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-sm font-black uppercase ${data.investor_verdict.would_invest ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                        {data.investor_verdict.would_invest ? "Would Invest" : "Pass"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40 block mb-1">Investment Confidence</span>
                    <span className="text-2xl font-black text-ink">{data.investor_verdict.investment_confidence}<span className="text-sm text-ink/50">%</span></span>
                  </div>
                </div>
                
                <p className="text-sm font-medium leading-relaxed text-ink/80 mb-5 italic border-l-4 border-ink/10 pl-4 py-1">"{data.investor_verdict.investment_reasoning}"</p>
                
                {(data.investor_verdict.potential_strengths || data.investor_verdict.expected_concerns) && (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {data.investor_verdict.potential_strengths && (
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-moss">Potential Strengths</h4>
                        <ul className="space-y-1.5">
                          {data.investor_verdict.potential_strengths.map((s, i) => (
                            <li key={i} className="text-xs text-ink/75 flex gap-2"><span className="text-moss">✓</span> {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.investor_verdict.expected_concerns && (
                      <div className="space-y-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Expected Concerns</h4>
                        <ul className="space-y-1.5">
                          {data.investor_verdict.expected_concerns.map((c, i) => (
                            <li key={i} className="text-xs text-ink/75 flex gap-2"><span className="text-rose-500">⚠</span> {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {data.scoring_rubric && normalizedRubric && (
              <ReportSectionCard title="Venture Rating Breakdown" forceOpen={isPrinting}>
                <div className="grid md:grid-cols-[1fr_1fr] gap-8 items-start">
                  <div className="space-y-4">
                    {[
                      "market_size",
                      "competitive_advantage",
                      "technical_feasibility",
                      "monetization_potential",
                      "founder_fit"
                    ].map((key) => {
                      const cat = normalizedRubric[key];
                      if (!cat) return null;
                      return (
                        <ScoreBar
                          key={key}
                          label={key}
                          score={cat.score}
                          reasoning={cat.reasoning}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <RadarChart rubric={normalizedRubric} />
                    <p className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Scoring Radar</p>
                  </div>
                </div>
              </ReportSectionCard>
            )}
            <ReportSectionCard title="Strategic Recommendation Rationale" forceOpen={isPrinting}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <RecommendationBadge decision={data.recommendation.decision} />
                  <span className="text-xs font-bold text-ink/50 uppercase">Confidence: {data.recommendation.confidence}</span>
                </div>
                <p className="text-[14px] leading-relaxed text-ink/80 whitespace-pre-line">{data.recommendation.rationale}</p>
              </div>
            </ReportSectionCard>
          </div>

          {/* References */}
          {data.references && data.references.length > 0 && (
            <div className="rounded-2xl border border-white/50 bg-white/40 p-5 backdrop-blur-md shadow-sm mt-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink/60 mb-3">Sources & References</h3>
              <ul className="space-y-2 text-[11px] leading-relaxed text-ink/75">
                {data.references.map((ref, idx) => (
                  <li key={idx} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 border-b border-ink/5 pb-2 last:border-0">
                    <span className="font-semibold text-ink/80">{ref.name}</span>
                    {ref.url && ref.url !== "#" && (
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-moss hover:underline break-all text-[10px]">{ref.url}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="no-print pt-6 flex gap-4">
        <Link to="/analyze"><Button variant="secondary">Validate Another Idea</Button></Link>
        <Link to="/dashboard"><Button variant="secondary">Back to Dashboard</Button></Link>
      </div>
    </div>
  );
}
