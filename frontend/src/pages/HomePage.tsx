import { Link } from "react-router-dom";

import { AppLayout } from "../components/AppLayout";

export function HomePage() {
  return (
    <AppLayout>
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-normal text-copper">
            AI-powered startup validation
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-normal text-ink sm:text-5xl">
            Venture Intelligence Platform
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-ink/70">
            Turn an early startup idea into a structured venture analysis covering industry, audience,
            competitors, market potential, risks, opportunity gaps, and a clear recommendation.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/analyze"
              className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-moss"
            >
              Analyze a Startup Idea
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-moss">Structured report</p>
              <p className="mt-1 text-sm leading-6 text-ink/65">
                Every analysis follows the same decision framework, making ideas easier to compare and discuss.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-moss">Critical evaluation</p>
              <p className="mt-1 text-sm leading-6 text-ink/65">
                The output emphasizes risk, differentiation, and market reality instead of generic optimism.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-moss">Persistent results</p>
              <p className="mt-1 text-sm leading-6 text-ink/65">
                Generated reports are stored and can be opened again by their report URL.
              </p>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
