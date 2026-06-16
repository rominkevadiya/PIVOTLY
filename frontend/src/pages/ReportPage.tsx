import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { RecommendationBadge } from "../components/RecommendationBadge";
import { SwotGrid } from "../components/SwotGrid";
import { RatingMeter } from "../components/RatingMeter";
import { ReportSectionCard } from "../components/ReportSectionCard";
import { getReport } from "../services/api";
import type { ReportResponse } from "../types/report";

type TabId = "strategy" | "competitors" | "risks" | "summary";

export function ReportPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!reportId) {
      setError("Report ID is missing.");
      setIsLoading(false);
      return;
    }

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

function ReportContent({ report }: { report: ReportResponse }) {
  const [activeTab, setActiveTab] = useState<TabId>("strategy");
  const data = report.report_json;
  
  const createdAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(report.created_at));

  const handlePrint = () => {
    window.print();
  };

  // Extract SWOT list items
  const strengths = [
    data.overview.one_line_pitch || "Unique value proposition",
    `Target Audience segment: ${data.target_audience.primary_segment}`,
    data.target_audience.audience_insight || "Clear demographic alignment"
  ];
  const weaknesses = data.failure_risks.map((r) => `${r.risk} (${r.severity})`);
  const opportunities = data.opportunity_gaps.map((g) => g.gap);
  const threats = data.competitors.map((c) => `${c.name} - Threat level: ${c.threat_level}`);

  // Calculate score circle progress
  const overallScore = Number(data.scoring_rubric?.overall_score || 0);
  const circumference = 2 * Math.PI * 40; // ≈ 251.2
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="space-y-10 print:space-y-8 print:p-0">
      {/* Executive Header Block */}
      <section className="rounded-3xl border border-white/50 bg-white/40 p-6 sm:p-8 backdrop-blur-md shadow-panel animate-fade-in-up">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
          <div className="space-y-3 flex-1">
            <span className="inline-flex items-center rounded-lg bg-moss/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-moss">
              {report.industry}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-ink leading-tight">
              {data.overview.one_line_pitch}
            </h1>
            <p className="text-[14px] leading-relaxed text-ink/70 font-medium">
              <strong className="text-ink">Submitted vision:</strong> {report.idea_text}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-ink/40 font-semibold">
              <span>Report Ref: {report.id.substring(0, 8)}</span>
              <span>&middot;</span>
              <span>Generated: {createdAt}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 w-full md:w-auto no-print">
            <div className="flex items-center gap-2.5 justify-center md:justify-end">
              <span className="text-xs font-bold text-ink/40 uppercase">Decision:</span>
              <RecommendationBadge decision={report.recommendation} />
            </div>
            <Button onClick={handlePrint} variant="secondary" className="w-full sm:w-auto">
              Export PDF / Print
            </Button>
          </div>
        </div>
      </section>

      {/* Two-Column Dashboard Layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_2.1fr] items-start">
        {/* Left column - Sticky Sidebar stats */}
        <div className="lg:sticky lg:top-24 space-y-6 print:w-full print:relative print:grid print:grid-cols-2 print:gap-6 print:space-y-0">
          
          {/* Executive Score wheel */}
          {data.scoring_rubric && (
            <div className="rounded-3xl border border-white/50 bg-white/40 p-6 shadow-panel backdrop-blur-md text-center flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '50ms' }}>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest block mb-4">
                Overall Venture Viability
              </span>
              
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background track circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgba(22, 32, 29, 0.05)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Colored progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#gradientMoss)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="progress-ring-circle transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradientMoss" x1="0%" y1="0%" x2="100%" y2="100%">
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

          {/* Market Addressability (TAM/SAM/SOM) */}
          {(data.market_potential.tam || data.market_potential.sam || data.market_potential.som) && (
            <div className="rounded-3xl border border-white/50 bg-white/40 p-6 shadow-panel backdrop-blur-md animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest block mb-4">
                Estimated Addressable Market
              </span>
              <div className="space-y-3.5">
                {data.market_potential.tam && (
                  <div className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1.5 bg-copper" />
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-ink/50 uppercase">TAM</span>
                      <span className="text-base font-black text-ink">{data.market_potential.tam}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-ink/60 leading-normal">
                      Total Addressable Market. Overall demand universe.
                    </p>
                  </div>
                )}
                {data.market_potential.sam && (
                  <div className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1.5 bg-moss" />
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-ink/50 uppercase">SAM</span>
                      <span className="text-base font-black text-ink">{data.market_potential.sam}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-ink/60 leading-normal">
                      Serviceable Addressable Market. Target geographic/segment reach.
                    </p>
                  </div>
                )}
                {data.market_potential.som && (
                  <div className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-full w-1.5 bg-emerald-500" />
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-ink/50 uppercase">SOM</span>
                      <span className="text-base font-black text-ink">{data.market_potential.som}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-ink/60 leading-normal">
                      Serviceable Obtainable Market. Short-term captured share.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Main Content area with interactive tabs */}
        <div className="space-y-6">
          {/* Navigation Tabs (screen-only) */}
          <nav className="flex border-b border-ink/5 gap-2 no-print overflow-x-auto pb-1.5">
            {[
              { id: "strategy", label: "Strategy & SWOT" },
              { id: "competitors", label: "Market & Competitors" },
              { id: "risks", label: "Risks & Strategic Plan" },
              { id: "summary", label: "Executive Summary" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-ink text-white shadow-md"
                    : "text-ink/60 hover:text-ink hover:bg-white/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab 1: Strategy & SWOT */}
          <div className={`tab-panel space-y-6 ${activeTab === "strategy" ? "block" : "hidden"}`}>
            <ReportSectionCard title="Product Summary & Vision">
              <p className="text-[15px] leading-relaxed text-ink/80">{data.overview.idea_summary}</p>
            </ReportSectionCard>

            <div className="grid gap-6 sm:grid-cols-2 print:grid print:grid-cols-2">
              <ReportSectionCard title="Industry & Subsectors">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-ink/40 uppercase block">Sector</span>
                    <span className="font-extrabold text-moss">{data.industry.primary_industry}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-ink/40 uppercase block">Subsector</span>
                    <span className="font-extrabold text-ink">{data.industry.sub_industry}</span>
                  </div>
                  <p className="text-xs text-ink/70 border-t border-ink/5 pt-3 mt-2">
                    {data.industry.industry_context}
                  </p>
                </div>
              </ReportSectionCard>

              <ReportSectionCard title="Target Segments">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-ink/40 uppercase block">Primary Audience</span>
                    <span className="font-extrabold text-ink">{data.target_audience.primary_segment}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-ink/40 uppercase block">Secondary Audience</span>
                    <span className="font-extrabold text-ink/80">{data.target_audience.secondary_segment}</span>
                  </div>
                  <p className="text-xs text-ink/70 border-t border-ink/5 pt-3 mt-2">
                    {data.target_audience.audience_insight}
                  </p>
                </div>
              </ReportSectionCard>
            </div>

            <SwotGrid
              strengths={strengths}
              weaknesses={weaknesses}
              opportunities={opportunities}
              threats={threats}
            />
          </div>

          {/* Tab 2: Market & Competitors */}
          <div className={`tab-panel space-y-6 print-page-break ${activeTab === "competitors" ? "block" : "hidden"}`}>
            <ReportSectionCard title="Competitor Intelligence Grid">
              <div className="grid gap-5 sm:grid-cols-2 print:grid print:grid-cols-2">
                {data.competitors.map((competitor) => (
                  <div 
                    key={competitor.name} 
                    className="flex flex-col justify-between rounded-2xl border border-white bg-white/50 p-5 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 border-b border-ink/5 pb-2">
                        <p className="font-bold text-ink">{competitor.name}</p>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                          competitor.threat_level === "High" 
                            ? "bg-rose-50 border-rose-200 text-rose-700"
                            : competitor.threat_level === "Medium"
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}>
                          {competitor.threat_level} Threat
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-ink/70">{competitor.description}</p>
                      <p className="text-xs text-ink/80">
                        <strong className="text-moss">Core Moat/Strength:</strong> {competitor.strength}
                      </p>
                    </div>
                    
                    <div className="mt-4 flex gap-2 no-print border-t border-ink/5 pt-3">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(competitor.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl bg-white border border-ink/10 px-3 py-1.5 text-[10px] font-bold text-ink hover:bg-ink hover:text-white transition duration-200"
                      >
                        Web Search
                      </a>
                      <a
                        href={`https://www.crunchbase.com/text-search/organizations?q=${encodeURIComponent(competitor.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl bg-white border border-ink/10 px-3 py-1.5 text-[10px] font-bold text-ink hover:bg-ink hover:text-white transition duration-200"
                      >
                        Crunchbase
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </ReportSectionCard>

            <ReportSectionCard title="Market Rationale">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-ink/40 uppercase block">Addressable Potential</span>
                  <p className="font-bold text-moss mt-0.5">{data.market_potential.rationale}</p>
                </div>
                <p className="text-xs leading-relaxed text-ink/70">
                  {data.market_potential.estimated_market_context}
                </p>
              </div>
            </ReportSectionCard>
          </div>

          {/* Tab 3: Risks & Strategic Plan */}
          <div className={`tab-panel space-y-6 print-page-break ${activeTab === "risks" ? "block" : "hidden"}`}>
            <ReportSectionCard title="Failure Risk Analysis">
              <div className="grid gap-4 sm:grid-cols-2 print:grid print:grid-cols-2">
                {data.failure_risks.map((risk) => (
                  <div 
                    key={risk.risk} 
                    className="rounded-2xl border border-rose-100 bg-rose-50/20 p-5 hover:bg-rose-50/50 transition-all space-y-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-bold text-ink text-sm">{risk.risk}</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                        {risk.severity} Severity
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-ink/75">{risk.description}</p>
                  </div>
                ))}
              </div>
            </ReportSectionCard>

            <div className="grid gap-6 sm:grid-cols-2 print:grid print:grid-cols-2">
              <ReportSectionCard title="Identified Opportunity Gaps">
                <div className="divide-y divide-ink/5">
                  {data.opportunity_gaps.map((gap) => (
                    <div key={gap.gap} className="py-3.5 first:pt-0 last:pb-0">
                      <p className="font-bold text-ink text-xs">{gap.gap}</p>
                      <p className="text-xs text-ink/70 mt-1">{gap.description}</p>
                    </div>
                  ))}
                </div>
              </ReportSectionCard>

              <ReportSectionCard title="Improvement Suggestions">
                <div className="divide-y divide-ink/5">
                  {data.improvement_suggestions.map((suggestion) => (
                    <div key={suggestion.suggestion} className="py-3.5 first:pt-0 last:pb-0">
                      <p className="font-bold text-moss text-xs">{suggestion.suggestion}</p>
                      <p className="text-xs text-ink/70 mt-1">{suggestion.rationale}</p>
                    </div>
                  ))}
                </div>
              </ReportSectionCard>
            </div>
          </div>

          {/* Tab 4: Executive Summary */}
          <div className={`tab-panel space-y-6 print-page-break ${activeTab === "summary" ? "block" : "hidden"}`}>
            {data.scoring_rubric && (
              <ReportSectionCard title="Venture Rating Breakdown">
                <div className="space-y-4">
                  {Object.entries(data.scoring_rubric)
                    .filter(([key]) => key !== 'overall_score')
                    .map(([key, category]: [string, any]) => (
                    <div key={key} className="border-b border-ink/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="font-bold text-ink text-sm capitalize">{key.replace(/_/g, ' ')}</p>
                        <span className="font-extrabold text-xs text-copper bg-copper/5 border border-copper/10 px-2.5 py-0.5 rounded-full">
                          {category.score} / 10
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-ink/70">{category.reasoning}</p>
                    </div>
                  ))}
                </div>
              </ReportSectionCard>
            )}

            <ReportSectionCard title="Strategic Recommendation Rationale">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <RecommendationBadge decision={data.recommendation.decision} />
                  <span className="text-xs font-bold text-ink/50 uppercase">
                    Confidence: {data.recommendation.confidence}
                  </span>
                </div>
                <p className="text-[14px] leading-relaxed text-ink/80 whitespace-pre-line">
                  {data.recommendation.rationale}
                </p>
              </div>
            </ReportSectionCard>
          </div>
        </div>
      </div>

      <div className="no-print pt-6 flex gap-4">
        <Link to="/analyze">
          <Button variant="secondary">Validate Another Idea</Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
