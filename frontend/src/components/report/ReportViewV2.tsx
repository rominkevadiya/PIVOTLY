import { Link } from "react-router-dom";
import { Button } from "../Button";
import type { ReportResponse, VentureReportV2 } from "../../types/report";

export function ReportViewV2({ report }: { report: ReportResponse }) {
  const data = report.report_json as VentureReportV2;
  const createdAt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.created_at));

  return (
    <div className="space-y-10 print:space-y-8 print:p-0">
      <section className="rounded-3xl border border-white/50 bg-white/40 p-6 sm:p-8 backdrop-blur-md shadow-panel animate-fade-in-up">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
          <div className="space-y-3 flex-1">
            <span className="inline-flex items-center rounded-lg bg-moss/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-moss">Phase 2 Development</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-ink leading-tight">V2 Report Implementation Pending</h1>
            <p className="text-[14px] leading-relaxed text-ink/70 font-medium"><strong className="text-ink">Submitted vision:</strong> {report.idea_text}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-ink/40 font-semibold">
              <span>Ref: {report.id.substring(0, 8)}</span>
              <span>&middot;</span>
              <span>Generated: {createdAt}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-white/50 bg-white/40 p-6 sm:p-8 backdrop-blur-md shadow-panel text-center">
        <h2 className="text-xl font-bold text-ink mb-4">Under Construction</h2>
        <p className="text-ink/70">This is a V2 report placeholder. Multi-agent intelligence pipeline will populate this.</p>
        {data.message && (
          <p className="mt-4 p-4 bg-ink/5 rounded-lg font-mono text-sm inline-block">{data.message}</p>
        )}
      </div>

      <div className="no-print pt-6 flex gap-4">
        <Link to="/analyze"><Button variant="secondary">Validate Another Idea</Button></Link>
        <Link to="/dashboard"><Button variant="secondary">Back to Dashboard</Button></Link>
      </div>
    </div>
  );
}
