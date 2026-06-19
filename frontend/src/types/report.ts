export type Rating = "High" | "Medium" | "Low";
export type RecommendationDecision = "Build" | "Pivot" | "Research Further" | "Avoid";

export interface ScoreCategory {
  score: number;
  reasoning: string;
}

export interface ScoringRubricSection {
  // Old nested structure
  market_size?: ScoreCategory;
  competitive_advantage?: ScoreCategory;
  technical_feasibility?: ScoreCategory;
  monetization_potential?: ScoreCategory;
  founder_fit?: ScoreCategory;
  
  // New flat structure
  market_size_score?: number;
  competitive_advantage_score?: number;
  technical_feasibility_score?: number;
  monetization_potential_score?: number;
  founder_fit_score?: number;
  overall_rationale?: string;

  // Shared
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
  phases: Array<string | GoToMarketPhase>;
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
    confidence_score: number;
  };
  target_audience: {
    primary_segment: string;
    secondary_segment: string;
    audience_insight: string;
  };
  competitors: Array<{
    name: string;
    website?: string;
    category?: string;
    competitor_type: "Direct" | "Indirect" | "Substitute";
    description: string;
    strength?: string;
    threat_level: Rating;
    reason_for_inclusion?: string;
    evidence?: string;
    source_url?: string;
    confidence_score?: number;
  }>;
  market_potential: {
    rating: Rating;
    rationale: string;
    estimated_market_context: string;
    tam?: string;
    sam?: string;
    som?: string;
    evidence: string;
    source_url?: string;
    confidence_score: number;
  };
  failure_risks: Array<{
    risk?: string;
    title?: string;
    description: string;
    severity: Rating;
    evidence?: string;
    confidence_score?: number;
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
    evidence: string;
    confidence: Rating;
    confidence_score: number;
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
  investor_verdict?: {
    would_invest: boolean;
    investment_confidence: number;
    investment_reasoning: string;
    expected_concerns: string[];
    potential_strengths: string[];
  };
  contrarian_analysis?: {
    counterarguments: string[];
    alternative_interpretations: string[];
    recommendation_risks: string[];
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
