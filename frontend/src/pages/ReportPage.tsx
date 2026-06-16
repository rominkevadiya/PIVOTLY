import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { RecommendationBadge } from "../components/RecommendationBadge";
import { ReportSectionCard } from "../components/ReportSectionCard";
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

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-copper">{report.industry}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">{data.overview.one_line_pitch}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/65">{report.idea_text}</p>
            <p className="mt-3 text-sm text-ink/50">{createdAt}</p>
          </div>
          <RecommendationBadge decision={report.recommendation} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportSectionCard title="Overview">
          <p>{data.overview.idea_summary}</p>
        </ReportSectionCard>

        <ReportSectionCard title="Industry">
          <p className="font-semibold text-ink">{data.industry.primary_industry}</p>
          <p>{data.industry.sub_industry}</p>
          <p>{data.industry.industry_context}</p>
        </ReportSectionCard>

        <ReportSectionCard title="Target Audience">
          <p>
            <span className="font-semibold text-ink">Primary:</span> {data.target_audience.primary_segment}
          </p>
          <p>
            <span className="font-semibold text-ink">Secondary:</span> {data.target_audience.secondary_segment}
          </p>
          <p>{data.target_audience.audience_insight}</p>
        </ReportSectionCard>

        <ReportSectionCard title="Market Potential">
          <p>
            <span className="font-semibold text-ink">Rating:</span> {data.market_potential.rating}
          </p>
          <p>{data.market_potential.rationale}</p>
          <p>{data.market_potential.estimated_market_context}</p>
        </ReportSectionCard>
      </div>

      <ReportSectionCard title="Competitors">
        <div className="grid gap-3 md:grid-cols-2">
          {data.competitors.map((competitor) => (
            <div key={competitor.name} className="rounded-md border border-ink/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink">{competitor.name}</p>
                <span className="text-xs font-semibold uppercase tracking-normal text-copper">
                  {competitor.threat_level}
                </span>
              </div>
              <p className="mt-2">{competitor.description}</p>
              <p className="mt-2 text-ink/60">{competitor.strength}</p>
            </div>
          ))}
        </div>
      </ReportSectionCard>

      <ReportSectionCard title="Failure Risks">
        <div className="grid gap-3 md:grid-cols-2">
          {data.failure_risks.map((risk) => (
            <div key={risk.risk} className="rounded-md border border-ink/10 p-4">
              <p className="font-semibold text-ink">{risk.risk}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-normal text-copper">{risk.severity}</p>
              <p className="mt-2">{risk.description}</p>
            </div>
          ))}
        </div>
      </ReportSectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportSectionCard title="Opportunity Gaps">
          {data.opportunity_gaps.map((gap) => (
            <div key={gap.gap}>
              <p className="font-semibold text-ink">{gap.gap}</p>
              <p>{gap.description}</p>
            </div>
          ))}
        </ReportSectionCard>

        <ReportSectionCard title="Improvement Suggestions">
          {data.improvement_suggestions.map((suggestion) => (
            <div key={suggestion.suggestion}>
              <p className="font-semibold text-ink">{suggestion.suggestion}</p>
              <p>{suggestion.rationale}</p>
            </div>
          ))}
        </ReportSectionCard>
      </div>

      <ReportSectionCard title="Final Recommendation">
        <RecommendationBadge decision={data.recommendation.decision} />
        <p>{data.recommendation.rationale}</p>
        <p>
          <span className="font-semibold text-ink">Confidence:</span> {data.recommendation.confidence}
        </p>
      </ReportSectionCard>

      <Link to="/analyze">
        <Button variant="secondary">Analyze Another Idea</Button>
      </Link>
    </div>
  );
}
