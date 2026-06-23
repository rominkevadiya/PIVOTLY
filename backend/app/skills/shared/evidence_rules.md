## EVIDENCE FORMATTING RULES

- Every `Evidence` object requires three fields: `claim`, `source_url`, and `reliability`.
- `claim`: A single, specific, falsifiable statement (1 sentence max). Do not write vague or general claims.
- `source_url`: Must be an exact URL from the WEB SEARCH DATA. Set to `null` if not available.
- `reliability`: Rate as "High" (peer-reviewed/official/primary source), "Medium" (reputable secondary source), or "Low" (blog/opinion/projection).
- Confidence scores (`confidence_score`) must be calibrated: >85 if backed by direct search evidence, <50 if based on parametric memory alone.
