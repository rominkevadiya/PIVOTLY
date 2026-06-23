## SCHEMA COMPLIANCE RULES

- Return ONLY valid JSON. Do not wrap in markdown code fences.
- Do not include any explanatory text before or after the JSON object.
- All required fields must be present. Do not omit fields.
- Use `null` for optional fields where data is unavailable, not empty strings.
- String list fields that have min/max constraints must be respected exactly.
- Rating fields only accept the literal strings: "High", "Medium", or "Low".
- Be extremely concise: all description, rationale, and reasoning fields must be 1-2 sentences maximum.
