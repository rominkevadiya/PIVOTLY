export type Rating = "High" | "Medium" | "Low";
export type RecommendationDecision = "Build" | "Pivot" | "Research Further" | "Avoid";

export interface VentureReport {
  overview: {
    idea_summary: string;
    one_line_pitch: string;
  };
  industry: {
    primary_industry: string;
    sub_industry: string;
    industry_context: string;
  };
  target_audience: {
    primary_segment: string;
    secondary_segment: string;
    audience_insight: string;
  };
  competitors: Array<{
    name: string;
    description: string;
    strength: string;
    threat_level: Rating;
  }>;
  market_potential: {
    rating: Rating;
    rationale: string;
    estimated_market_context: string;
  };
  failure_risks: Array<{
    risk: string;
    description: string;
    severity: Rating;
  }>;
  opportunity_gaps: Array<{
    gap: string;
    description: string;
  }>;
  improvement_suggestions: Array<{
    suggestion: string;
    rationale: string;
  }>;
  recommendation: {
    decision: RecommendationDecision;
    rationale: string;
    confidence: Rating;
  };
}

export interface AnalyzeResponse {
  report_id: string;
  status: "success";
}

export interface ReportResponse {
  id: string;
  idea_text: string;
  report_json: VentureReport;
  industry: string;
  market_potential: Rating;
  recommendation: RecommendationDecision;
  created_at: string;
}
