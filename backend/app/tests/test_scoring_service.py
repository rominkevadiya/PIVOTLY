from app.schemas.report import (
    ResearchContext,
    CompetitorAnalysis,
    MoatAnalysis,
    ContrarianAnalysis,
    V2CompetitorItem,
    Evidence
)
from app.services.scoring_service import ScoringService


def test_scoring_service_calculate_score():
    # Arrange
    research = ResearchContext(
        market_overview="Big market",
        target_demographics=["SMBs"],
        market_size_indicators=[
            Evidence(claim="TAM is $10B", reliability="High"),
            Evidence(claim="CAGR 20%", reliability="High")
        ],
        key_trends=["Cloud adoption"]
    )
    
    competitors = CompetitorAnalysis(
        competitors=[
            V2CompetitorItem(
                name="Comp1",
                copy_risk="Low",
                threat_level="Medium",
                differentiator_weakness="Bad UI",
                evidence_list=[]
            )
        ],
        market_saturation="Low",
        summary="A few players"
    )
    
    moat = MoatAnalysis(
        overall_defensibility="High",
        evidence_list=[]
    )
    
    contrarian = ContrarianAnalysis(
        critical_assumptions=["People will pay"],
        why_it_might_fail=["Too expensive"],
        hidden_risks=["Regulation"],
        evidence_list=[]
    )
    
    # Act
    score = ScoringService.calculate_score(research, competitors, moat, contrarian)
    
    # Assert
    # Market size = 5 + 2 = 7
    assert score.market_size_score == 7
    # Competitor advantage = High -> 9
    assert score.competitive_advantage_score == 9
    # Technical feasibility = 10 - 1 risk = 9
    assert score.technical_feasibility_score == 9
    # Monetization potential = 6 + 2 (Low saturation) = 8
    assert score.monetization_potential_score == 8
    # Founder fit = 5
    assert score.founder_fit_score == 5
    
    # Total = 7*2.5 (17.5) + 9*3 (27) + 9*1.5 (13.5) + 8*2 (16) + 5*1 (5) = 79
    assert score.overall_score == 79


def test_scoring_service_generate_recommendation():
    rec = ScoringService.generate_recommendation(79)
    assert rec.decision == "Build"
    
    rec2 = ScoringService.generate_recommendation(65)
    assert rec2.decision == "Research Further"
    
    rec3 = ScoringService.generate_recommendation(50)
    assert rec3.decision == "Pivot"
    
    rec4 = ScoringService.generate_recommendation(30)
    assert rec4.decision == "Avoid"
