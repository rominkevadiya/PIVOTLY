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

export interface VentureReportV1 {
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

export interface Evidence {
  claim: string;
  source_url: string | null;
  reliability: Rating;
}

export interface ResearchContext {
  market_overview: string;
  target_demographics: string[];
  market_size_indicators: Evidence[];
  key_trends: string[];
}

export interface V2CompetitorItem {
  name: string;
  website: string | null;
  copy_risk: Rating;
  threat_level: Rating;
  differentiator_weakness: string;
  evidence_list: Evidence[];
}

export interface CompetitorAnalysis {
  competitors: V2CompetitorItem[];
  market_saturation: Rating;
  summary: string;
}

export interface MoatAnalysis {
  network_effects: string | null;
  switching_costs: string | null;
  brand_power: string | null;
  overall_defensibility: Rating;
  evidence_list: Evidence[];
}

export interface ContrarianAnalysis {
  critical_assumptions: string[];
  why_it_might_fail: string[];
  hidden_risks: string[];
  evidence_list: Evidence[];
}

export interface SectionError {
  status: "UNAVAILABLE";
  error: string;
}

export interface ActionPlan {
  go_to_market_phases: string[];
  unit_economics_cac: string | null;
  unit_economics_ltv: string | null;
  unit_economics_payback: string | null;
  next_steps: NextStepItem[];
  founder_recommendation: string;
}

export interface VentureReportV2 {
  idea_summary: string;
  research_context: ResearchContext | SectionError | null;
  competitor_analysis: CompetitorAnalysis | SectionError | null;
  moat_analysis: MoatAnalysis | SectionError | null;
  contrarian_analysis: ContrarianAnalysis | SectionError | null;
  action_plan: ActionPlan | SectionError | null;
  scoring_rubric: ScoringRubricSection | SectionError | null;
  recommendation: {
    decision: RecommendationDecision;
    rationale: string;
    evidence: string;
    confidence: Rating;
    confidence_score: number;
  } | SectionError | null;
}

export interface AnalyzeResponse {
  report_id: string;
  status: "success";
}

export interface ReportResponse {
  id: string;
  idea_text: string;
  schema_version: number;
  report_json: VentureReportV1 | VentureReportV2 | null;
  status: "PENDING" | "SCRAPING" | "WAITING_FOR_API" | "GENERATING" | "COMPLETED" | "FAILED";
  error_message: string | null;
  industry: string;
  market_potential: Rating;
  recommendation: RecommendationDecision;
  created_at: string;
}

export interface ReportSummary {
  id: string;
  idea_text: string;
  schema_version: number;
  industry: string;
  market_potential: Rating;
  recommendation: RecommendationDecision;
  status: string;
  created_at: string;
}
