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
      {report ? <ReportRouter report={report} /> : null}
    </AppLayout>
  );
}

import { ReportViewV1 } from "../components/report/ReportViewV1";
import { ReportViewV2 } from "../components/report/ReportViewV2";

function ReportRouter({ report }: { report: ReportResponse }) {
  if (report.schema_version >= 2) {
    return <ReportViewV2 report={report} />;
  }
  return <ReportViewV1 report={report} />;
}
