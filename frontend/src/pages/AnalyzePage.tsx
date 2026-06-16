import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { TextAreaField } from "../components/TextAreaField";
import { analyzeIdea } from "../services/api";

const MAX_IDEA_LENGTH = 1000;
const MIN_IDEA_LENGTH = 10;

export function AnalyzePage() {
  const [ideaText, setIdeaText] = useState("");
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
      const response = await analyzeIdea(ideaText.trim());
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
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-copper">New analysis</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">Analyze a startup idea</h1>
          <p className="mt-3 text-base leading-7 text-ink/65">
            Describe the idea, audience, and problem in plain language. The report is generated and stored after
            Gemini returns a validated structured response.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <TextAreaField
            id="idea-text"
            label="Startup idea"
            value={ideaText}
            maxLength={MAX_IDEA_LENGTH}
            placeholder="Example: An AI assistant that helps first-time founders validate startup ideas before building."
            helperText={counterText}
            onChange={(event) => setIdeaText(event.target.value)}
          />

          {error ? <ErrorMessage message={error} /> : null}
          {isSubmitting ? <LoadingState message="Generating venture analysis. This can take a few seconds." /> : null}

          <Button type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Analyzing..." : "Generate Report"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
