# Pivotly Zero-Cost V2 Architecture Roadmap
## CTO-Level Systems Review, Risk Matrix, and Pragmatic Scale Blueprint

---

## 1. Executive Summary

This document outlines the **Zero-AWS-Cost V2 Roadmap** for the Pivotly Venture Intelligence Platform. The primary objective is to maximize performance, reliability, and concurrency while maintaining a **$0 budget increase** on AWS infrastructure. 

To achieve this, we **exclude** distributed tools like Redis, Celery, ElastiCache, ALB, and multi-node EC2 clusters. Instead, we optimize the application to run entirely on the existing **single EC2 instance** and **RDS PostgreSQL database**.

### Key Architectural Shifts
1.  **FastAPI BackgroundTasks**: Replace the proposed Celery system with FastAPI’s native `BackgroundTasks`. Tasks run asynchronously within the existing Gunicorn/Uvicorn process, eliminating worker daemons and broker overhead.
2.  **PostgreSQL-Backed Caching**: Replace the proposed Redis cache with a lightweight `search_cache` table in PostgreSQL. This stores search context across workers and restarts at **$0 monthly cost** with no new server processes.
3.  **Client-Side Status Polling**: Use lightweight HTTP polling on a dedicated status table rather than stateful WebSockets or Server-Sent Events, minimizing server connection overhead.
4.  **Database Query Optimization**: Defer heavy `JSONB` report column loading in user dashboard list queries to reduce memory footprint and database query times.

---

## 2. Phase 3: Architecture Improvements (Orchestration & Frontend) — **Completed**
**Focus:** Wire the multi-agent DAG into the main execution pipeline and overhaul the Frontend React dashboard.

### Outcome
When a user hits `/api/v1/analyze`, the endpoint immediately returns `{report_id, status: "PENDING"}`. A `BackgroundTask` executes the agents sequentially using `EvidenceLedger` context passing, runs the deterministic score, and saves a `VentureReportV2` JSON payload. Status is polled by the frontend via `GET /api/v1/reports/{id}/status`. The React frontend renders a tabbed, professional UI on completion.

### Component Architecture & Frontend Changes

#### The `ReportView` Container
Instead of rendering a single vertical scroll of sections, the `ReportView` will use a Tabbed interface.
- **Tabs:** Overview, Market, Competitors, Moat, Risks, Scorecard.

#### New Components
1. **`EvidenceCard.tsx`**
   - Takes `claim`, `quote`, `source_url`, and `confidence`. Renders external link to source and confidence badge.
2. **`ScorecardView.tsx`**
   - Renders deterministic scores. Large radial progress bar for `overall_score`, linear bars for sub-scores. Includes `scoring_rationale` tooltips.
3. **`MoatMeter.tsx`**
   - Visual gauge showing defensibility boolean checks (e.g., `Network Effects: ❌`).
4. **`CompetitorGrid.tsx`**
   - Displays competitors as a masonry grid of cards, highlighting `threat_level`.
5. **`ContrarianPanel.tsx` (Risks Tab)**
   - Darker aesthetic. Lists "Top Failure Reasons" and "Critical Assumptions".

#### Backward Compatibility Support
In `ReportPage.tsx`:
```tsx
if (report.schema_version === 1 || !report.schema_version) {
  return <LegacyReportView report={report.report_json as VentureReportV1} />;
} else {
  return <V2ReportDashboard report={report.report_json as VentureReportV2} />;
}
```

---

## 3. Phase 4: Active Backlog (Post-Launch Optimizations)
**Focus:** Post-launch optimizations that improve performance, scalability, and UX.

### Expected Outcome
Faster report generation times, lower LLM costs, and better shareability for users.

### Tasks
1.  **PostgreSQL-Backed Search Cache**:
    - Create `search_caches` table mapped by query hash to store Tavily/DDG responses.
2.  **Optimize Database Query Performance (Deferred Column Loading)**:
    - Modify `ReportRepository.get_by_user_id` to use SQLAlchemy `defer(Report.report_json)`.
3.  **Public Shareable Report Link**:
    - Add a `share_token` (UUID) to the `reports` table. Create `/reports/share/{share_token}` public route.
4.  **User Feedback Loops**:
    - Implement Upvote/Downvote feedback model stored inside the database.

---

## 4. Actual Production Risks Analysis

### Risk Matrix

| Risk | Probability | Impact | Business Importance | Severity Score | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Gemini 429 Quota Exhaustion** | High | Critical | High | **9.0 / 10** | Implement list-based key rotation inside `ai_service.py` to distribute load. |
| **2. DuckDuckGo Scraper Rate Blocks** | High | High | High | **8.0 / 10** | Deploy the database-backed `search_cache` table. |
| **3. Request Timeout / Browser Drop** | Medium | High | High | **7.0 / 10** | Migrate generation to in-process background tasks with frontend status polling. |
| **4. Database Connection Starvation** | Medium | Medium | High | **6.0 / 10** | Close and release database connections during long search and AI requests. |
| **5. Database Query Memory Bloat** | Medium | Medium | Medium | **5.0 / 10** | Defer `report_json` during dashboard history queries. |
| **6. EC2 Memory Exhaustion** | Low | High | Medium | **4.0 / 10** | No Celery, no local Redis ensures memory usage remains safely under the 1GB t3.micro RAM threshold. |

---

## 5. Cost & Scalability Analysis

| Resource | Current Cost (V1) | Projected V1.5 Cost | Proposed V2 Cost (If Needed) |
| :--- | :--- | :--- | :--- |
| **AWS EC2** | ~$10/mo (t3.micro) | **~$10/mo** | ~$10/mo |
| **AWS RDS (Postgres)** | ~$15/mo (db.t3.micro) | **~$15/mo** | ~$15/mo |
| **Redis / ElastiCache** | $0/mo (Not Used) | **$0/mo** | $0/mo |
| **Celery Workers** | $0/mo (Not Used) | **$0/mo** | $0/mo |
| **Gemini API** | $0 (Free Tier) | **$0** (Rotation) | Pay-as-you-go key |
| **Tavily Search** | $0 (Free Tier, 1k/mo) | **$0** (DB Caching) | Paid Tier |
| **Total Est. Cost** | **~$25 / month** | **~$25 / month** | **~$25+ / month** |

---

## 6. CTO Final Verdict

> **"Pivotly's scaling bottlenecks are caused by external API delays and rate limits, not server CPU capacity. Introducing Redis, Celery, load balancers, or additional EC2 servers adds infrastructure bills and devops overhead without solving these API-centric problems.**
>
> **By caching search results directly inside PostgreSQL and running asynchronous jobs using FastAPI’s native `BackgroundTasks`, we solve the timeout issues and speed up the platform while keeping our monthly AWS footprint at a flat $25."**
