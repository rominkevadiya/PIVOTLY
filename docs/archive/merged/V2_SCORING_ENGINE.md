# Pivotly V2 Deterministic Scoring Engine

## Overview
In V1, Pivotly relied on the LLM to generate scores (1-100). This resulted in hallucinated, inconsistent numbers with no mathematical backing. 

In V2, the LLM will *only* extract factual classifications (e.g., "Market Concentration: High", "Copy Difficulty: Low"). A new backend Python service (`scoring_service.py`) will parse these classifications and apply a deterministic algorithm to generate the final scorecard.

## 1. Input Variables
The `ScoringService` takes the parsed Pydantic objects from the LLM agents as inputs:
- `ResearchContext`
- `CompetitorAnalysis`
- `MoatAnalysis`
- `ContrarianAnalysis`

## 2. Category Scoring Logic (0-10)

### A. Market Score
Evaluates the sheer size and momentum of the space.
- **Base Score (5/10)**
- **Market Size Modifiers:**
  - `> $1B TAM`: +2
  - `$100M - $1B TAM`: +1
  - `< $100M TAM`: -1
- **Growth Modifiers:**
  - `High Growth (>20% YoY)`: +2
  - `Moderate Growth (5-20% YoY)`: +1
  - `Stagnant/Declining`: -2
- **Evidence Penalty:**
  - If `evidence_list` is empty for market size: -3

### B. Competition Score
Evaluates how saturated and dangerous the current market is.
- **Base Score (10/10)** (Lower is worse for the startup)
- **Competitor Count Modifiers:**
  - `0-1 Direct Competitors`: 0
  - `2-4 Direct Competitors`: -2
  - `5+ Direct Competitors`: -4
- **Concentration Modifiers:**
  - `Monopoly (e.g., Google dominates)`: -3
  - `Consolidated (Oligopoly)`: -2
  - `Fragmented`: +1
- **Threat Level Modifiers:**
  - Subtract 1 for every competitor marked with `threat_level: High`.

### C. Moat Score
Evaluates the startup's defensibility.
- **Base Score (0/10)**
- **Moat Type Assignment:**
  - `Network Effects`: +4
  - `Data Advantage`: +3
  - `High Switching Costs`: +3
  - `Brand / IP`: +2
  - `None`: 0
- **Copy Difficulty Modifiers:**
  - `High`: +3
  - `Medium`: +1
  - `Low`: 0

### D. Execution Risk Score
Inverts the risks identified by the Contrarian Agent.
- **Base Score (10/10)** (10 means very low risk/safe, 0 means highly risky)
- **Risk Deductions:**
  - Subtract 1.5 points for every item in `top_failure_reasons` (up to -6).
  - Subtract 1 point for every item in `critical_assumptions` (up to -4).
- **Regulatory Penalty:**
  - If `regulatory_concerns` in ResearchContext has > 0 items: -2

## 3. Overall Score Calculation (0-100)
The overall score is a weighted average of the category scores.

```python
WEIGHTS = {
    "market_score": 0.20,
    "competition_score": 0.25,
    "moat_score": 0.35,
    "execution_risk_score": 0.20,
}

def calculate_overall(scores: dict[str, int]) -> int:
    total = 0
    for category, weight in WEIGHTS.items():
        # normalize 0-10 to 0-100 before weighting
        total += (scores[category] * 10) * weight
    return int(round(total))
```

## 4. Implementation Steps
1. Create `backend/app/services/scoring_service.py`.
2. Implement a `class ScoringEngine`.
3. Add a method `generate_scorecard(research, competitors, moat, contrarian) -> Scorecard`.
4. Ensure the output `Scorecard` includes a `scoring_rationale` dictionary so the Frontend can explain *exactly* why the user received their score (e.g., "Moat Score is 3/10 because Copy Difficulty is Low and no Network Effects were identified").
