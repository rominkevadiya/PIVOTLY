import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { TextAreaField } from "../components/TextAreaField";
import { SelectField } from "../components/SelectField";
import { analyzeIdea } from "../services/api";

const MAX_IDEA_LENGTH = 1000;
const MIN_IDEA_LENGTH = 10;

const REGION_OPTIONS = [
  { label: "Global", value: "Global" },
  { label: "North America", value: "North America" },
  { label: "Europe", value: "Europe" },
  { label: "Asia Pacific", value: "Asia Pacific" },
  { label: "Latin America", value: "Latin America" },
  { label: "Middle East & Africa", value: "Middle East & Africa" },
];

const BUDGET_OPTIONS = [
  { label: "Bootstrapped (< $10k)", value: "Bootstrapped (< $10k)" },
  { label: "Pre-seed ($10k - $100k)", value: "Pre-seed ($10k - $100k)" },
  { label: "Seed ($100k - $1M)", value: "Seed ($100k - $1M)" },
  { label: "Series A+ (> $1M)", value: "Series A+ (> $1M)" },
];

export function AnalyzePage() {
  const [ideaText, setIdeaText] = useState("");
  const [region, setRegion] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const trimmedLength = ideaText.trim().length;
  const canSubmit = trimmedLength >= MIN_IDEA_LENGTH && trimmedLength <= MAX_IDEA_LENGTH && !isSubmitting;
  const counterText = useMemo(() => `${ideaText.length}/${MAX_IDEA_LENGTH} characters`, [ideaText.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError("Describe the idea in 10 to 1000 characters.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await analyzeIdea(ideaText.trim(), region || undefined, budgetRange || undefined);
      navigate(`/reports/${response.report_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center animate-fade-in-up">
          <span className="inline-flex items-center rounded-full bg-moss/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-moss mb-4">
            New Analysis
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink">
            Validate your <span className="text-gradient">startup idea</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-relaxed text-ink/70 font-medium">
            Describe your vision, target audience, and the core problem. Our AI will analyze market potential, size the market, and generate a comprehensive viability report.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-8 sm:p-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <TextAreaField
              id="idea-text"
              label="Startup idea"
              value={ideaText}
              maxLength={MAX_IDEA_LENGTH}
              placeholder="Example: An AI assistant that helps first-time founders validate startup ideas before building."
              helperText={counterText}
              onChange={(event) => setIdeaText(event.target.value)}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <SelectField
                id="region"
                label="Target Region (Optional)"
                value={region}
                options={REGION_OPTIONS}
                onChange={(e) => setRegion(e.target.value)}
              />
              <SelectField
                id="budget"
                label="Budget Range (Optional)"
                value={budgetRange}
                options={BUDGET_OPTIONS}
                onChange={(e) => setBudgetRange(e.target.value)}
              />
            </div>

          {error ? <ErrorMessage message={error} /> : null}
          {isSubmitting ? <LoadingState message="Generating venture analysis. This can take a few seconds." /> : null}

            <div className="pt-2">
              <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
                {isSubmitting ? "Analyzing Market Data..." : "Generate Analysis Report"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
