import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { ErrorMessage } from "../components/ErrorMessage";
import { listReports } from "../services/api";
import type { ReportSummary } from "../types/dashboard";

const BADGE_CLASSES = {
  Build: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  Pivot: "bg-amber-50 text-amber-700 border-amber-200/50",
  "Research Further": "bg-sky-50 text-sky-700 border-sky-200/50",
  Avoid: "bg-rose-50 text-rose-700 border-rose-200/50",
};

export function DashboardPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await listReports();
        setReports(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reports.");
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-copper">
              Venture Hub
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">
              Your Analysis History
            </h1>
            <p className="text-sm text-ink/65 mt-1">
              Compare your validation reports and strategic recommendations.
            </p>
          </div>
          <Link
            to="/analyze"
            className="inline-flex justify-center rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-moss transition duration-150"
          >
            New Analysis
          </Link>
        </div>

        {error && <ErrorMessage message={error} />}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink/20 border-t-moss" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center rounded-xl border border-dashed border-ink/20 bg-white px-6 py-16 shadow-panel">
            <h3 className="text-base font-semibold text-ink">No reports yet</h3>
            <p className="mt-1 text-sm text-ink/60">
              Get started by submitting your first startup idea for AI validation.
            </p>
            <div className="mt-6">
              <Link
                to="/analyze"
                className="inline-flex items-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-moss transition"
              >
                Create first analysis
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-panel">
            <ul className="divide-y divide-ink/5">
              {reports.map((report) => {
                const badgeStyle = BADGE_CLASSES[report.recommendation as keyof typeof BADGE_CLASSES] || "bg-ink/5 text-ink/75 border-ink/10";
                const dateStr = new Date(report.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <li
                    key={report.id}
                    className="group relative hover:bg-paper/30 transition duration-150 ease-in-out"
                  >
                    <Link to={`/reports/${report.id}`} className="block p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-ink/40 font-medium">
                              {dateStr}
                            </span>
                            <span className="text-xs text-ink/40 font-medium">•</span>
                            <span className="text-xs font-semibold text-copper">
                              {report.industry}
                            </span>
                          </div>
                          <p className="text-base font-semibold text-ink group-hover:text-moss transition duration-150">
                            {report.idea_snippet}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 self-start md:self-center">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold border ${badgeStyle}`}
                          >
                            {report.recommendation}
                          </span>
                          <span className="text-xs text-ink/40 font-semibold bg-paper px-2 py-0.5 rounded border border-ink/5">
                            {report.market_potential} Potential
                          </span>
                          <svg
                            className="hidden md:block h-5 w-5 text-ink/30 group-hover:text-moss group-hover:translate-x-1 transition duration-150"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
