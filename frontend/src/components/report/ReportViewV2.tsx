import { Link } from "react-router-dom";
import { Button } from "../Button";
import type { ReportResponse, VentureReportV2, SectionError } from "../../types/report";
import { RecommendationBadge } from "../RecommendationBadge";
import { useEffect } from "react";

function isError(section: any): section is SectionError {
  return section && section.status === "UNAVAILABLE";
}

function SectionErrorCard({ title }: { title: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4">
      <h3 className="font-bold text-red-800">{title}</h3>
      <p>Data unavailable for this section</p>
    </div>
  );
}

export function ReportViewV2({ report }: { report: ReportResponse }) {
  const data = report.report_json as VentureReportV2;
  const createdAt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.created_at));

  useEffect(() => {
    console.log("V2 Report Data:", data);
  }, [data]);

  // Destructure sections
  const {
    idea_summary,
    research_context,
    competitor_analysis,
    moat_analysis,
    contrarian_analysis,
    action_plan,
    scoring_rubric,
    recommendation,
  } = data;

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold mb-2">Venture Intelligence Report V2</h1>
        <p className="text-gray-600 mb-4">{idea_summary}</p>
        <div className="text-sm text-gray-500">Generated: {createdAt}</div>
      </div>

      {/* Scoring Rubric */}
      {isError(scoring_rubric) ? <SectionErrorCard title="Scoring Rubric" /> : scoring_rubric && (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Scoring Rubric</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>Market Size: {scoring_rubric.market_size_score}/10</div>
            <div>Competitive Advantage: {scoring_rubric.competitive_advantage_score}/10</div>
            <div>Technical Feasibility: {scoring_rubric.technical_feasibility_score}/10</div>
            <div>Monetization Potential: {scoring_rubric.monetization_potential_score}/10</div>
            <div>Founder Fit: {scoring_rubric.founder_fit_score}/10</div>
          </div>
          <div className="font-bold text-lg mb-2">Overall Score: {scoring_rubric.overall_score}/100</div>
          <p className="text-gray-700">{scoring_rubric.overall_rationale}</p>
        </div>
      )}

      {/* Recommendation */}
      {isError(recommendation) ? <SectionErrorCard title="Recommendation" /> : recommendation && (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Recommendation</h2>
          <div className="mb-4">
            <RecommendationBadge decision={recommendation.decision} />
          </div>
          <div className="mb-2"><strong>Confidence:</strong> {recommendation.confidence} ({recommendation.confidence_score}/100)</div>
          <p className="mb-2 text-gray-700"><strong>Rationale:</strong> {recommendation.rationale}</p>
          <p className="text-gray-700"><strong>Evidence:</strong> {recommendation.evidence}</p>
        </div>
      )}

      {/* Research Context */}
      {isError(research_context) ? <SectionErrorCard title="Research Context" /> : research_context && (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Research Context</h2>
          <p className="mb-4">{research_context.market_overview}</p>
          
          <h3 className="font-bold mb-2">Target Demographics</h3>
          <ul className="list-disc pl-5 mb-4">
            {research_context.target_demographics.map((demo, i) => <li key={i}>{demo}</li>)}
          </ul>

          <h3 className="font-bold mb-2">Key Trends</h3>
          <ul className="list-disc pl-5 mb-4">
            {research_context.key_trends.map((trend, i) => <li key={i}>{trend}</li>)}
          </ul>

          <h3 className="font-bold mb-2">Market Size Indicators</h3>
          <ul className="list-disc pl-5">
            {research_context.market_size_indicators.map((indicator, i) => (
              <li key={i} className="mb-1">
                {indicator.claim} <span className="text-xs text-gray-500">({indicator.reliability})</span>
                {indicator.source_url && <a href={indicator.source_url} target="_blank" rel="noreferrer" className="text-blue-500 ml-2 text-xs">Source</a>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Competitor Analysis */}
      {isError(competitor_analysis) ? <SectionErrorCard title="Competitor Analysis" /> : competitor_analysis && (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Competitor Analysis</h2>
          <p className="mb-2"><strong>Market Saturation:</strong> {competitor_analysis.market_saturation}</p>
          <p className="mb-4">{competitor_analysis.summary}</p>
          
          <div className="space-y-4">
            {competitor_analysis.competitors.map((comp, i) => (
              <div key={i} className="border p-4 rounded-lg bg-gray-50">
                <h3 className="font-bold">{comp.name} {comp.website && <a href={comp.website} target="_blank" rel="noreferrer" className="text-blue-500 text-sm font-normal">({comp.website})</a>}</h3>
                <div className="text-sm mt-1"><strong>Threat Level:</strong> {comp.threat_level} | <strong>Copy Risk:</strong> {comp.copy_risk}</div>
                <p className="mt-2 text-sm"><strong>Weakness:</strong> {comp.differentiator_weakness}</p>
                {comp.evidence_list?.length > 0 && (
                  <ul className="mt-2 text-xs text-gray-500 list-disc pl-4">
                    {comp.evidence_list.map((ev, j) => <li key={j}>{ev.claim}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moat Analysis */}
      {isError(moat_analysis) ? <SectionErrorCard title="Moat Analysis" /> : moat_analysis && (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Moat Analysis</h2>
          <p className="mb-4"><strong>Overall Defensibility:</strong> {moat_analysis.overall_defensibility}</p>
          <div className="space-y-2 mb-4">
            <p><strong>Network Effects:</strong> {moat_analysis.network_effects || "None"}</p>
            <p><strong>Switching Costs:</strong> {moat_analysis.switching_costs || "None"}</p>
            <p><strong>Brand Power:</strong> {moat_analysis.brand_power || "None"}</p>
          </div>
          <h3 className="font-bold mb-2 text-sm">Evidence:</h3>
          <ul className="list-disc pl-5 text-sm">
            {moat_analysis.evidence_list.map((ev, i) => (
              <li key={i}>{ev.claim} {ev.source_url && <a href={ev.source_url} target="_blank" rel="noreferrer" className="text-blue-500">source</a>}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Contrarian Analysis */}
      {isError(contrarian_analysis) ? <SectionErrorCard title="Contrarian Analysis" /> : contrarian_analysis && (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Contrarian Analysis</h2>
          
          <h3 className="font-bold mb-2">Critical Assumptions</h3>
          <ul className="list-disc pl-5 mb-4 text-sm">
            {contrarian_analysis.critical_assumptions.map((ass, i) => <li key={i}>{ass}</li>)}
          </ul>

          <h3 className="font-bold mb-2">Why It Might Fail</h3>
          <ul className="list-disc pl-5 mb-4 text-sm">
            {contrarian_analysis.why_it_might_fail.map((reason, i) => <li key={i}>{reason}</li>)}
          </ul>

          <h3 className="font-bold mb-2">Hidden Risks</h3>
          <ul className="list-disc pl-5 text-sm">
            {contrarian_analysis.hidden_risks.map((risk, i) => <li key={i}>{risk}</li>)}
          </ul>
        </div>
      )}

      {/* Action Plan */}
      {isError(action_plan) ? <SectionErrorCard title="Action Plan" /> : action_plan && (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">Action Plan</h2>
          <p className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg italic text-gray-700">{action_plan.founder_recommendation}</p>

          <h3 className="font-bold mb-2">Go To Market Phases</h3>
          <ol className="list-decimal pl-5 mb-4 text-sm space-y-1">
            {action_plan.go_to_market_phases.map((phase, i) => <li key={i}>{phase}</li>)}
          </ol>

          <h3 className="font-bold mb-2">Unit Economics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
            <div className="p-3 bg-gray-50 border border-gray-100 rounded"><strong>CAC:</strong> {action_plan.unit_economics_cac || "N/A"}</div>
            <div className="p-3 bg-gray-50 border border-gray-100 rounded"><strong>LTV:</strong> {action_plan.unit_economics_ltv || "N/A"}</div>
            <div className="p-3 bg-gray-50 border border-gray-100 rounded"><strong>Payback:</strong> {action_plan.unit_economics_payback || "N/A"}</div>
          </div>

          <h3 className="font-bold mb-2">Next Steps</h3>
          <div className="space-y-3 text-sm">
            {action_plan.next_steps.map((step, i) => (
              <div key={i} className="border border-gray-100 p-3 rounded bg-gray-50">
                <div className="flex justify-between font-bold mb-1">
                  <span>{step.priority}. {step.action}</span>
                  <span className="text-gray-500">{step.timeframe}</span>
                </div>
                <p className="text-gray-700">{step.rationale}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="no-print pt-6 flex gap-4">
        <Link to="/analyze"><Button variant="secondary">Validate Another Idea</Button></Link>
        <Link to="/dashboard"><Button variant="secondary">Back to Dashboard</Button></Link>
      </div>
    </div>
  );
}
