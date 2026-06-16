import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { ErrorMessage } from "../components/ErrorMessage";
import { listReports, getUserStats, UserStats } from "../services/api";
import type { ReportSummary } from "../types/dashboard";

const BADGE_CLASSES = {
  Build: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Pivot: "bg-amber-100 text-amber-800 border-amber-200",
  "Research Further": "bg-sky-100 text-sky-800 border-sky-200",
  Avoid: "bg-rose-100 text-rose-800 border-rose-200",
};

export function DashboardPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [recFilter, setRecFilter] = useState("");
  const limit = 10;

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [reportsData, statsData] = await Promise.all([
          listReports(page, limit),
          getUserStats()
        ]);
        setReports(reportsData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [page]);

  // Clientside instant filters
  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      report.idea_snippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRec = recFilter === "" || report.recommendation === recFilter;
    return matchesSearch && matchesRec;
  });

  return (
    <AppLayout>
      <div className="space-y-10 pb-12">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 animate-fade-in-up">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-moss/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-moss">
              Venture Hub
            </span>
            <h1 className="text-4xl font-black tracking-tight text-ink mt-3">
              Your Validation History
            </h1>
            <p className="text-[15px] font-medium text-ink/60 mt-1.5">
              Review and compare your AI-validated venture reports and decision recommendations.
            </p>
          </div>
          <Link
            to="/analyze"
            className="inline-flex justify-center items-center rounded-xl bg-ink px-5 py-3 text-sm font-semibold tracking-wide text-white shadow-lg hover:bg-moss hover:shadow-[0_8px_20px_rgb(49,92,77,0.25)] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Validate New Idea
          </Link>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Stats Strip */}
        {!isLoading && stats && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <div className="rounded-2xl border border-white/50 bg-white/40 p-5 shadow-panel backdrop-blur-sm">
              <span className="text-[10px] font-bold text-ink/40 uppercase block">Total Validations</span>
              <span className="text-3xl font-extrabold text-ink mt-1 block">{stats.total_analyses}</span>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/40 p-5 shadow-panel backdrop-blur-sm">
              <span className="text-[10px] font-bold text-ink/40 uppercase block">Daily Submissions Remaining</span>
              <span className="text-3xl font-extrabold text-moss mt-1 block">
                {stats.analyses_remaining_today} / 10
              </span>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/40 p-5 shadow-panel backdrop-blur-sm">
              <span className="text-[10px] font-bold text-ink/40 uppercase block">Build-to-Pivot Ratio</span>
              <div className="flex items-center gap-3 mt-2">
                <div className="h-2 flex-1 rounded-full bg-ink/5 overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: '45%' }} />
                  <div className="h-full bg-amber-500" style={{ width: '35%' }} />
                  <div className="h-full bg-rose-500" style={{ width: '20%' }} />
                </div>
                <span className="text-xs font-bold text-ink/60">Balanced</span>
              </div>
            </div>
          </div>
        )}

        {/* Filtering Options */}
        {!isLoading && reports.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-white/30 border border-white/50 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <div className="w-full sm:max-w-md relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by keyword, industry..."
                className="w-full bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-moss transition"
              />
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={recFilter}
                onChange={(e) => setRecFilter(e.target.value)}
                className="w-full sm:w-auto bg-white border border-ink/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-moss transition"
              >
                <option value="">All Recommendations</option>
                <option value="Build">Build</option>
                <option value="Pivot">Pivot</option>
                <option value="Research Further">Research Further</option>
                <option value="Avoid">Avoid</option>
              </select>
            </div>
          </div>
        )}

        {/* Reports List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-moss border-t-transparent" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center rounded-2xl border border-dashed border-ink/20 bg-white/60 px-6 py-16 shadow-panel backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="w-12 h-12 rounded-2xl bg-paper flex items-center justify-center text-lg mx-auto mb-4">🔍</div>
            <h3 className="text-base font-bold text-ink">No validation reports found</h3>
            <p className="mt-1 text-xs text-ink/65 max-w-sm mx-auto">
              {reports.length === 0 
                ? "Submit your first startup idea to see structured AI validations."
                : "No reports match your current search and recommendation filters."}
            </p>
            {reports.length === 0 && (
              <div className="mt-6">
                <Link
                  to="/analyze"
                  className="inline-flex items-center rounded-xl bg-ink px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-moss transition"
                >
                  Start First Validation
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/60 backdrop-blur-md shadow-panel animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <ul className="divide-y divide-ink/5">
                {filteredReports.map((report) => {
                  const badgeStyle = BADGE_CLASSES[report.recommendation as keyof typeof BADGE_CLASSES] || "bg-ink/5 text-ink/75 border-ink/10";
                  const dateStr = new Date(report.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <li
                      key={report.id}
                      className="group relative hover:bg-white/90 transition duration-300 ease-in-out"
                    >
                      <Link to={`/reports/${report.id}`} className="block p-6 sm:p-8">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">
                                {dateStr}
                              </span>
                              <span className="text-xs text-ink/30 font-medium">•</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-moss">
                                {report.industry}
                              </span>
                            </div>
                            <p className="text-lg font-bold text-ink group-hover:text-moss transition duration-300">
                              {report.idea_snippet}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
                            <span
                              className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-bold ${badgeStyle}`}
                            >
                              {report.recommendation}
                            </span>
                            <span className="text-xs text-ink/50 font-bold bg-white/80 px-3 py-1 rounded-lg border border-ink/5">
                              {report.market_potential} Potential
                            </span>
                            <svg
                              className="hidden md:block h-5 w-5 text-ink/30 group-hover:text-moss group-hover:translate-x-1.5 transition duration-300"
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
            
            {/* Pagination Controls */}
            <div className="flex justify-between items-center px-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-ink/5 text-ink/70 hover:bg-ink hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-ink/60">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={reports.length < limit}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-ink/5 text-ink/70 hover:bg-ink hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
