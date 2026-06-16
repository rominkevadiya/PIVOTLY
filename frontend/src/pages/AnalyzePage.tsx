import { FormEvent, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
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

const SAMPLE_TEMPLATES = [
  {
    title: "DTC Craft Beer Subscription",
    idea: "A subscription-based DTC platform delivering craft beer from local independent micro-breweries directly to neighborhood consumers, utilizing optimized green delivery routes.",
    region: "North America",
    budget: "Pre-seed ($10k - $100k)"
  },
  {
    title: "AI Farm-to-Table Dispatcher",
    idea: "An AI-powered logistics dispatcher connecting local organic farms directly to regional restaurants, automating route planning, real-time demand matching, and contract payments.",
    region: "Europe",
    budget: "Seed ($100k - $1M)"
  },
  {
    title: "Eco-Packaging Wholesale",
    idea: "A wholesale e-commerce marketplace for certified biodegradable and compostable packaging materials, targeted at early-stage consumer brands looking to eliminate plastic waste.",
    region: "Global",
    budget: "Bootstrapped (< $10k)"
  }
];

const LOADING_PHASES = [
  "Parsing startup vision...",
  "Running semantic search checks...",
  "Evaluating industry benchmarks...",
  "Sizing target audience & TAM/SAM/SOM...",
  "Identifying potential direct/indirect competitors...",
  "Simulating primary failure risk factors...",
  "Generating strategic SWOT quadrant matrix...",
  "Assembling final decision recommendations..."
];

export function AnalyzePage() {
  const [ideaText, setIdeaText] = useState("");
  const [region, setRegion] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);
  const navigate = useNavigate();

  const trimmedLength = ideaText.trim().length;
  const canSubmit = trimmedLength >= MIN_IDEA_LENGTH && trimmedLength <= MAX_IDEA_LENGTH && !isSubmitting;
  const counterText = useMemo(() => `${ideaText.length}/${MAX_IDEA_LENGTH} characters`, [ideaText.length]);

  // Loading phase cycler
  useEffect(() => {
    let interval: any;
    if (isSubmitting) {
      setLoadingPhaseIndex(0);
      interval = setInterval(() => {
        setLoadingPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  function handleSelectTemplate(tpl: typeof SAMPLE_TEMPLATES[0]) {
    setIdeaText(tpl.idea);
    setRegion(tpl.region);
    setBudgetRange(tpl.budget);
  }

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
          <span className="inline-flex items-center rounded-full bg-moss/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-moss mb-4">
            New Validation
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-ink">
            Validate your <span className="text-gradient">startup idea</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-ink/70 font-medium">
            Describe your vision, target audience, and the core problem. Our AI will analyze market potential, size the market, and generate a comprehensive viability report.
          </p>
        </div>

        {/* Quick Start Templates */}
        <div className="mb-8 p-5 rounded-2xl bg-white/40 border border-white/50 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink/40 mb-3">
            Quick Start Templates
          </p>
          <div className="flex flex-wrap gap-2.5">
            {SAMPLE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.title}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-ink/5 hover:border-moss hover:bg-moss/5 hover:text-moss transition duration-200 shadow-sm"
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-8 sm:p-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <TextAreaField
              id="idea-text"
              label="Startup idea description"
              value={ideaText}
              maxLength={MAX_IDEA_LENGTH}
              placeholder="Describe what your startup does, who it is for, and how it makes money..."
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

            {/* Custom immersive loader */}
            {isSubmitting && (
              <div className="p-6 rounded-2xl bg-white border border-ink/5 shadow-lg space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-moss border-t-transparent animate-spin" />
                  <span className="text-sm font-bold text-ink">{LOADING_PHASES[loadingPhaseIndex]}</span>
                </div>
                <div className="h-1.5 w-full bg-ink/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-moss rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${((loadingPhaseIndex + 1) / LOADING_PHASES.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" disabled={!canSubmit} className="w-full sm:w-auto">
                {isSubmitting ? "Running Analysis Framework..." : "Generate Analysis Report"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

