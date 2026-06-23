from app.schemas.report import (
    ResearchContext,
    CompetitorAnalysis,
    MoatAnalysis,
    ContrarianAnalysis,
    ScoringRubricSection,
    RecommendationSection,
    SectionError
)

class ScoringService:
    """Deterministic scoring engine to calculate the viability of a startup idea."""
    
    @staticmethod
    def calculate_score(
        research: ResearchContext | SectionError | None,
        competitors: CompetitorAnalysis | SectionError | None,
        moat: MoatAnalysis | SectionError | None,
        contrarian: ContrarianAnalysis | SectionError | None,
    ) -> ScoringRubricSection:
        """Calculate a deterministic score based on the outputs of the AI agents."""
        
        # 1. Market Size Score
        market_size_score = 5
        if research and not isinstance(research, SectionError) and research.market_size_indicators:
            market_size_score = min(5 + len(research.market_size_indicators), 10)
            
        # 2. Competitive Advantage Score
        competitive_advantage_score = 5
        if moat and not isinstance(moat, SectionError):
            if moat.overall_defensibility == "High":
                competitive_advantage_score = 9
            elif moat.overall_defensibility == "Medium":
                competitive_advantage_score = 6
            else:
                competitive_advantage_score = 3
                
        # 3. Technical Feasibility Score
        technical_feasibility_score = 7
        if contrarian and not isinstance(contrarian, SectionError) and contrarian.hidden_risks:
            technical_feasibility_score = max(1, 10 - len(contrarian.hidden_risks))
            
        # 4. Monetization Potential Score
        monetization_potential_score = 6
        if competitors and not isinstance(competitors, SectionError):
            if competitors.market_saturation == "Low":
                monetization_potential_score += 2
            elif competitors.market_saturation == "High":
                monetization_potential_score -= 2
            
        # 5. Founder Fit Score (Deterministic baseline since we don't know the founder)
        founder_fit_score = 5
        
        # Calculate overall score weighted
        total = (
            market_size_score * 2.5 +
            competitive_advantage_score * 3.0 +
            technical_feasibility_score * 1.5 +
            monetization_potential_score * 2.0 +
            founder_fit_score * 1.0
        )
        overall_score = min(max(int(total), 1), 100)
        
        rationale = (
            f"The idea scored {overall_score}/100. "
            f"Market Size: {market_size_score}/10. "
            f"Defensibility: {competitive_advantage_score}/10. "
            f"Feasibility: {technical_feasibility_score}/10. "
            f"Monetization: {monetization_potential_score}/10."
        )
        
        return ScoringRubricSection(
            market_size_score=market_size_score,
            competitive_advantage_score=competitive_advantage_score,
            technical_feasibility_score=technical_feasibility_score,
            monetization_potential_score=monetization_potential_score,
            founder_fit_score=founder_fit_score,
            overall_score=overall_score,
            overall_rationale=rationale
        )
        
    @staticmethod
    def generate_recommendation(score: int) -> RecommendationSection:
        """Determine recommendation based on the deterministic overall score."""
        if score >= 75:
            decision = "Build"
            rationale = "High overall viability with defensible moats and large market."
        elif score >= 60:
            decision = "Research Further"
            rationale = "Promising signs, but risks or market saturation require deeper validation."
        elif score >= 45:
            decision = "Pivot"
            rationale = "The current approach has critical flaws, but the space may be interesting if approached differently."
        else:
            decision = "Avoid"
            rationale = "High risk, low defensibility, and strong competition make this a dangerous bet."
            
        return RecommendationSection(
            decision=decision,
            rationale=rationale,
            evidence=f"Overall deterministic score of {score}/100.",
            confidence="High",
            confidence_score=90
        )
