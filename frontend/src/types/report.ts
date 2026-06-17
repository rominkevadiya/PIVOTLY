export type Rating = "High" | "Medium" | "Low";
export type RecommendationDecision = "Build" | "Pivot" | "Research Further" | "Avoid";

export interface ScoreCategory {
  score: number;
  reasoning: string;
}

export interface ScoringRubricSection {
  market_size: ScoreCategory;
  competitive_advantage: ScoreCategory;
  technical_feasibility: ScoreCategory;
  monetization_potential: ScoreCategory;
  founder_fit: ScoreCategory;
  overall_score: number;
}

// ── Enrichment sections ────────────────────────────────────────────────────────

export interface SwotSection {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface GoToMarketPhase {
  phase: string;
  duration: string;
  actions: string[];
  channel: string;
}

export interface GoToMarketSection {
  strategy_summary: string;
  phases: GoToMarketPhase[];
}

export interface NextStepItem {
  priority: number;
  action: string;
  rationale: string;
  timeframe: string;
}

export interface UnitEconomicsSection {
  estimated_cac?: string | null;
  estimated_ltv?: string | null;
  ltv_cac_ratio?: string | null;
  payback_period?: string | null;
  revenue_model: string;
  pricing_notes: string;
}

// ── Core report ────────────────────────────────────────────────────────────────

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
    tam?: string;
    sam?: string;
    som?: string;
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
  scoring_rubric?: ScoringRubricSection;
  references?: Array<{
    name: string;
    url: string;
  }>;
  // Enrichment sections (optional — older reports may not have these)
  swot?: SwotSection;
  go_to_market?: GoToMarketSection;
  next_steps?: NextStepItem[];
  unit_economics?: UnitEconomicsSection;
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
