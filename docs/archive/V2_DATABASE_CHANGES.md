# Pivotly V2 Database Changes

## Overview
The V2 migration relies heavily on reshaping the JSONB schema inside the existing PostgreSQL `reports` table. To minimize breaking changes, the core relational structure will largely remain the same, with minor adjustments to support backward compatibility and deterministic scoring.

## Current `reports` Table Schema
- `id` (UUID)
- `user_id` (UUID)
- `idea_text` (Text)
- `report_json` (JSONB, Nullable)
- `status` (Enum)
- `error_message` (Text, Nullable)
- `overall_score` (Integer, Nullable)
- `market_potential` (String, Nullable)
- `industry` (String, Nullable)
- `recommendation` (String, Nullable)

## Required Database Changes

### 1. Schema Versioning
We must introduce a `schema_version` column to safely distinguish between V1 reports and V2 reports in the frontend.

**Alembic Migration Action:**
```python
# Add column
op.add_column('reports', sa.Column('schema_version', sa.Integer(), server_default='1', nullable=False))
```

### 2. Scalar Score Columns (Optional but Recommended)
In V1, `overall_score` was extracted from the JSON and stored as a scalar for sorting/filtering. 
In V2, since we are moving to deterministic scoring, it is highly recommended to store the individual sub-scores as scalar columns. This allows users to sort their reports by "Highest Moat" or "Lowest Execution Risk".

**Alembic Migration Action:**
```python
op.add_column('reports', sa.Column('market_score', sa.Integer(), nullable=True))
op.add_column('reports', sa.Column('competition_score', sa.Integer(), nullable=True))
op.add_column('reports', sa.Column('moat_score', sa.Integer(), nullable=True))
op.add_column('reports', sa.Column('execution_risk_score', sa.Integer(), nullable=True))
```
*Note: Existing V1 reports will have NULL for these new columns, which is acceptable.*

### 3. JSONB Structure Changes (`report_json`)
The contents of `report_json` for new reports (`schema_version = 2`) will follow the `VentureReportV2` Pydantic schema. 
Since PostgreSQL JSONB is schema-less, no structural database migration is needed for the JSON payload itself. However, any backend Python methods that call `VentureReport.model_validate(report.report_json)` must be updated to check `schema_version` first.

```python
if report.schema_version == 1:
    return VentureReport.model_validate(report.report_json)
else:
    return VentureReportV2.model_validate(report.report_json)
```

## Rollout & Safety
- **Zero Downtime:** Adding columns with `server_default` allows the migration to run without locking the table extensively.
- **Backward Compatibility:** All existing data is preserved. V1 reports will continue to load using the V1 Pydantic models. V2 endpoints will explicitly serve V2 UI payloads.
