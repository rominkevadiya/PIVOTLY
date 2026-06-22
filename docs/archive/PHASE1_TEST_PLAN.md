# Pivotly V2: Phase 1 Test Plan & Validation Suite

## Overview
This document outlines the rigorous testing strategy required for Phase 1 (Foundation & Data Modeling). The primary objective is to guarantee zero regressions for existing V1 reports while safely introducing the `schema_version` routing logic required for V2 coexistence.

---

## Section 1: Regression Test Matrix

| Feature | Test Case | Expected Result | Risk Level |
| ------- | --------- | --------------- | ---------- |
| **1. User Authentication** | Login / Register | JWT issued successfully; no impact. | Low |
| **2. Report Creation** | Submit new idea via `/analyze` | Report row created with `schema_version=1` (Default for Phase 1); returns 202 Accepted. | High |
| **3. Background Tasks** | Task transitions through states | PENDING -> SCRAPING -> GENERATING -> COMPLETED. Rate limit logic holds. | High |
| **4. Report Retrieval** | `GET /reports/{id}` for old report | Returns correct JSON with injected `schema_version=1`. | High |
| **5. Dashboard Listing** | `GET /reports` | Returns paginated list without throwing Pydantic validation errors. | High |
| **6. Report Detail View** | Frontend renders fetched report | Renders `<ReportViewV1 />` completely intact without React errors. | High |
| **7. PDF Export** | Click "Export PDF" on UI | Browser print dialog opens; layout is preserved identically to pre-Phase 1. | Medium |
| **8. Status Polling** | `GET /reports/{id}/status` | Correct status and error messages returned; no schema version errors. | Low |
| **9. Share Links** | (If implemented) Public access | Public report parses correctly as V1. | Low |
| **10. History Pagination** | Load page 2 of dashboard | Pagination offsets function normally; no N+1 query lazy-loading issues. | Medium |

---

## Section 2: V1 Compatibility Tests
**Goal:** Verify existing V1 reports continue functioning seamlessly.

**Test Flow:**
1. Fetch a V1 Stored Report via `GET /reports`
2. Fetch details via `GET /reports/{id}`
3. Render React Page
4. Click Export PDF -> Download PDF

**Expected Checkpoints:**
* **No Schema Validation Errors:** The backend `ReportService.validate_stored_report()` must safely parse existing JSONB into `VentureReportV1`.
* **No Frontend Crashes:** The frontend router must recognize `schema_version=1` and mount the frozen V1 React components.
* **No PDF Layout Regressions:** Because the DOM tree of V1 components is unchanged, the CSS `@media print` rules must apply perfectly.

**Exact Files Involved:**
- `backend/app/schemas/report.py` (V1 Pydantic parsing)
- `frontend/src/pages/ReportPage.tsx` (React Router)
- `frontend/src/components/report/ReportViewV1.tsx` (Render tree)

---

## Section 3: New Report Creation Tests
**Goal:** Ensure newly generated reports during Phase 1 adopt the correct default schema and transition safely.

**Test Flow:**
Create Report -> Background Task -> SCRAPING -> GENERATING -> COMPLETED

**Validation Checkpoints:**
* **`schema_version` assigned correctly:** The Postgres insertion explicitly logs `1` (until Phase 3 goes live).
* **Transitions:** The polling endpoint accurately reflects the lifecycle.
* **Persistence:** The final LLM JSON successfully commits to Postgres without `db.rollback()` triggers.
* **Frontend:** The dashboard automatically updates and opens the V1 viewer.

---

## Section 4: Mixed Dataset Testing
**Goal:** Ensure the backend list endpoints and frontend dashboard can handle diverse payloads.

**Simulated Database:**
- 50 V1 Reports (`schema_version=1`)
- 10 V2 Reports (`schema_version=2`, mock data inserted directly into DB)

**Validation Checkpoints:**
* **Dashboard loads correctly:** `GET /reports` iterates over both types without throwing 500 errors.
* **Pagination/Filtering works:** Limits and offsets apply smoothly.
* **Report detail page routing:** Clicking a V1 report loads `<ReportViewV1 />`. Clicking a V2 report loads `<V2ReportDashboard />` (or placeholder).
* **N+1 Query Regressions:** Verify SQLAlchemy `defer('report_json')` remains active to prevent heavy data loading on the list view.

---

## Section 5: Schema Version Validation

**Test Scenarios & Expected Behavior:**
* `schema_version = 1` -> Loads `VentureReportV1`. Proceeds normally.
* `schema_version = 2` -> Loads `VentureReportV2`. Proceeds normally.
* `schema_version = null` -> Gracefully falls back to `V1` logic (handles any edge-case legacy data prior to Alembic defaults).
* `schema_version = 999` -> Catches error. Returns `400 Bad Request` or `422 Unprocessable Entity` rather than a `500 Internal Server Error`.

**Recommended API Response for Unknown Version:**
```json
{
  "detail": "Unsupported report schema version: 999. Please update your client."
}
```

---

## Section 6: Validation Factory Tests

**Target:** `ReportService.validate_stored_report()`

**Unit Test Scenarios:**
* **Valid V1 JSON:** Parses cleanly, returns `VentureReportV1` object.
* **Corrupted V1 JSON:** Throws `PydanticValidationError`. Handled via a generic `ValueError` mapped to a 500 response (or logged and marked corrupted).
* **Valid V2 JSON:** Parses cleanly, returns `VentureReportV2` object.
* **Corrupted V2 JSON:** Throws `PydanticValidationError`.
* **Unsupported Version:** Raises explicitly defined `UnsupportedSchemaVersionError` which FastAPI exception handlers convert to a clean 400.

---

## Section 7: Database Migration Validation

**Target:** Alembic revision adding `schema_version` column.

**Verification Checkpoints:**
* **Existing rows migrate safely:** No table locks exceeding 5 seconds in staging.
* **Default value applied correctly:** Postgres `server_default='1'` is verified via `psql`.
* **No data loss possible:** The JSONB `report_json` column is completely untouched.

**Rollback SQL Plan:**
```sql
BEGIN;
ALTER TABLE reports DROP COLUMN schema_version;
COMMIT;
```

---

## Section 8: Frontend Compatibility Review

**Component Audit:**
* **`ReportPage.tsx`:** Requires version routing logic.
* **`ReportViewV1.tsx`:** The frozen, legacy renderer. Must NOT be altered for V2 features to ensure PDF stability.
* **`V2ReportDashboard.tsx` (Future):** The new component for Phase 4.
* **`StatusBadge.tsx` / `LoadingOverlay.tsx`:** Reusable components. Safe to use across both V1 and V2.

**Migration Strategy:**
1. Isolate the current `ReportPage` content into `ReportViewV1`.
2. Turn `ReportPage` into a pure router wrapper based on `report.schema_version`.

---

## Section 9: Performance Testing

**Estimated Impacts:**
* **`schema_version` Lookup:** Negligible overhead (Simple integer check).
* **Validation Factory:** ~1-2ms overhead due to Pydantic branching. Negligible.
* **V1/V2 React Routing:** Negligible.

**Expected Overhead:** < 5ms per API request. No user-perceptible impact.
**Optimization Opportunities:** Ensure SQLAlchemy only queries `schema_version` and omits `report_json` during list queries via `defer()`.

---

## Section 10: Production Deployment Checklist

- [ ] **Pre-deployment:** Announce brief maintenance window (if required, though zero-downtime is expected).
- [ ] **Database Backup:** Run `pg_dump` of the `reports` table.
- [ ] **Migration Execution:** Run `alembic upgrade head`. Verify `schema_version` exists on production DB.
- [ ] **Code Deployment:** Deploy backend and frontend containers/services.
- [ ] **Smoke Tests:** 
    - Login.
    - View an old report (Verify V1 UI).
    - Generate a new report (Verify V1 UI works for new creations).
- [ ] **Post-deployment Verification:** Monitor server logs for Pydantic `ValidationError` or HTTP 500s.
- [ ] **Rollback Procedure:** In case of failure, run `alembic downgrade -1` and revert git commits. Restore `pg_dump` only if severe data corruption occurs.
