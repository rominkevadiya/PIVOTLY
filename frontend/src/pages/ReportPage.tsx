import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { RecommendationBadge } from "../components/RecommendationBadge";
import { ReportSectionCard } from "../components/ReportSectionCard";
import { SwotGrid } from "../components/SwotGrid";
import { RatingMeter } from "../components/RatingMeter";
import { getReport } from "../services/api";
import type { ReportResponse } from "../types/report";

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
      {isLoading ? <LoadingState message="Loading report." /> : null}
      {error ? <ErrorMessage message={error} /> : null}
      {report ? <ReportContent report={report} /> : null}
    </AppLayout>
  );
}

function ReportContent({ report }: { report: ReportResponse }) {
  const data = report.report_json;
  const createdAt = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(report.created_at));

  const handlePrint = () => {
    window.print();
  };

  // Extract SWOT lists
  const strengths = [
    data.overview.one_line_pitch || "Unique value proposition",
    `Target Audience segment: ${data.target_audience.primary_segment}`,
    data.target_audience.audience_insight || "Clear demographic alignment"
  ];
  const weaknesses = data.failure_risks.map((r) => `${r.risk} (${r.severity})`);
  const opportunities = data.opportunity_gaps.map((g) => g.gap);
  const threats = data.competitors.map((c) => `${c.name} - Threat level: ${c.threat_level}`);

  return (
    <div className="space-y-6 print-container">
      {/* Header section */}
      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-normal text-copper">{report.industry}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">{data.overview.one_line_pitch}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">{report.idea_text}</p>
            <p className="mt-3 text-sm text-ink/50">{createdAt}</p>
          </div>
          <div className="flex flex-col items-end gap-3 no-print">
            <RecommendationBadge decision={report.recommendation} />
            <Button onClick={handlePrint} variant="secondary">
              Export PDF / Print
            </Button>
          </div>
          {/* Badge display for print media only */}
          <div className="hidden print:block">
            <RecommendationBadge decision={report.recommendation} />
          </div>
        </div>
      </section>

      {/* Visual Analytics Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        <RatingMeter label="Market Potential" value={data.market_potential.rating} />
        <RatingMeter label="Recommendation Confidence" value={data.recommendation.confidence} />
      </div>

      {/* SWOT Quadrant Summary */}
      <SwotGrid
        strengths={strengths}
        weaknesses={weaknesses}
        opportunities={opportunities}
        threats={threats}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportSectionCard title="Overview">
          <p>{data.overview.idea_summary}</p>
        </ReportSectionCard>

        <ReportSectionCard title="Industry Context">
          <p className="font-semibold text-ink">{data.industry.primary_industry}</p>
          <p className="text-sm text-ink/60">{data.industry.sub_industry}</p>
          <p className="mt-2">{data.industry.industry_context}</p>
        </ReportSectionCard>

        <ReportSectionCard title="Target Audience">
          <p>
            <span className="font-semibold text-ink">Primary:</span> {data.target_audience.primary_segment}
          </p>
          <p>
            <span className="font-semibold text-ink">Secondary:</span> {data.target_audience.secondary_segment}
          </p>
          <p className="mt-2">{data.target_audience.audience_insight}</p>
        </ReportSectionCard>

        <ReportSectionCard title="Market Potential Details">
          <p className="font-semibold text-copper">Rating: {data.market_potential.rating}</p>
          <p className="mt-2">{data.market_potential.rationale}</p>
          <p className="mt-2 text-sm text-ink/60">{data.market_potential.estimated_market_context}</p>
          
          {(data.market_potential.tam || data.market_potential.sam || data.market_potential.som) && (
            <div className="mt-4 border-t border-ink/5 pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink/60 mb-3">Market Sizing (TAM / SAM / SOM)</h4>
              <div className="grid gap-3">
                {data.market_potential.tam && (
                  <div className="rounded border border-ink/10 bg-ink/[0.02] p-2.5">
                    <div className="flex justify-between text-xs font-semibold text-ink">
                      <span>Total Addressable Market (TAM)</span>
                      <span className="text-sm font-bold text-copper">{data.market_potential.tam}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-ink/55">Total market demand for the product/service</p>
                  </div>
                )}
                {data.market_potential.sam && (
                  <div className="rounded border border-ink/10 bg-ink/[0.02] p-2.5">
                    <div className="flex justify-between text-xs font-semibold text-ink">
                      <span>Serviceable Addressable Market (SAM)</span>
                      <span className="text-sm font-bold text-copper">{data.market_potential.sam}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-ink/55">The segment targeted that matches your capability</p>
                  </div>
                )}
                {data.market_potential.som && (
                  <div className="rounded border border-ink/10 bg-ink/[0.02] p-2.5">
                    <div className="flex justify-between text-xs font-semibold text-ink">
                      <span>Serviceable Obtainable Market (SOM)</span>
                      <span className="text-sm font-bold text-copper">{data.market_potential.som}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-ink/55">The share of the market you can realistically capture</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </ReportSectionCard>
      </div>

      <ReportSectionCard title="Competitors">
        <div className="grid gap-3 md:grid-cols-2">
          {data.competitors.map((competitor) => (
            <div key={competitor.name} className="flex flex-col justify-between rounded-md border border-ink/10 p-4">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{competitor.name}</p>
                  <span className="text-xs font-semibold uppercase tracking-normal text-copper">
                    {competitor.threat_level}
                  </span>
                </div>
                <p className="mt-2 text-sm">{competitor.description}</p>
                <p className="mt-2 text-xs text-ink/60"><strong className="text-ink">Strength:</strong> {competitor.strength}</p>
              </div>
              <div className="mt-4 flex gap-2 no-print border-t border-ink/5 pt-3">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(competitor.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded px-2.5 py-1 text-[11px] font-semibold text-ink border border-ink/20 hover:bg-ink/5"
                >
                  Search Web
                </a>
                <a
                  href={`https://www.crunchbase.com/text-search/organizations?q=${encodeURIComponent(competitor.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded px-2.5 py-1 text-[11px] font-semibold text-ink border border-ink/20 hover:bg-ink/5"
                >
                  Crunchbase
                </a>
              </div>
            </div>
          ))}
        </div>
      </ReportSectionCard>

      <ReportSectionCard title="Failure Risks">
        <div className="grid gap-3 md:grid-cols-2">
          {data.failure_risks.map((risk) => (
            <div key={risk.risk} className="rounded-md border border-ink/10 p-4">
              <p className="font-semibold text-ink">{risk.risk}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-normal text-copper">{risk.severity} Severity</p>
              <p className="mt-2 text-sm">{risk.description}</p>
            </div>
          ))}
        </div>
      </ReportSectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportSectionCard title="Opportunity Gaps">
          <div className="space-y-4">
            {data.opportunity_gaps.map((gap) => (
              <div key={gap.gap} className="border-b border-ink/5 pb-2 last:border-0 last:pb-0">
                <p className="font-semibold text-ink">{gap.gap}</p>
                <p className="text-sm mt-1">{gap.description}</p>
              </div>
            ))}
          </div>
        </ReportSectionCard>

        <ReportSectionCard title="Improvement Suggestions">
          <div className="space-y-4">
            {data.improvement_suggestions.map((suggestion) => (
              <div key={suggestion.suggestion} className="border-b border-ink/5 pb-2 last:border-0 last:pb-0">
                <p className="font-semibold text-ink">{suggestion.suggestion}</p>
                <p className="text-sm mt-1">{suggestion.rationale}</p>
              </div>
            ))}
          </div>
        </ReportSectionCard>
      </div>

      <ReportSectionCard title="Final Recommendation">
        <div className="flex items-center gap-3">
          <RecommendationBadge decision={data.recommendation.decision} />
          <span className="text-sm text-ink/60">Confidence: {data.recommendation.confidence}</span>
        </div>
        <p className="mt-3 leading-relaxed">{data.recommendation.rationale}</p>
      </ReportSectionCard>

      <div className="no-print pt-4">
        <Link to="/analyze">
          <Button variant="secondary">Analyze Another Idea</Button>
        </Link>
      </div>
    </div>
  );
}

