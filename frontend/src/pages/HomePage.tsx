import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-20 pb-12">
        {/* Hero Section */}
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8 animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-moss/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-moss">
              <span className="w-1.5 h-1.5 rounded-full bg-moss animate-ping" />
              Gemini-Powered Validation
            </span>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-ink leading-[1.1]">
              Validate startup ideas <br />
              <span className="text-gradient">before building.</span>
            </h1>
            
            <p className="max-w-2xl text-lg sm:text-xl leading-relaxed text-ink/70 font-medium">
              Transform your raw business ideas into rigorous, structure-validated venture reports. Size your market (TAM/SAM/SOM), identify competitors, analyze failure modes, and receive an objective recommendation.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/analyze"
                    className="rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-moss hover:shadow-[0_8px_25px_rgba(49,92,77,0.25)] transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Analyze an Idea
                  </Link>
                  <Link
                    to="/dashboard"
                    className="rounded-xl border border-ink/10 bg-white/80 px-6 py-3.5 text-sm font-semibold text-ink hover:bg-white hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="rounded-xl bg-ink px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-moss hover:shadow-[0_8px_25px_rgba(49,92,77,0.25)] transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Create Free Account
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-xl border border-ink/10 bg-white/80 px-6 py-3.5 text-sm font-semibold text-ink hover:bg-white hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Interactive UI Mockup Sandbox Card */}
          <div className="relative group animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="absolute -inset-2 bg-gradient-to-r from-moss to-copper rounded-[2.5rem] opacity-20 blur-2xl group-hover:opacity-30 transition duration-1000" />
            <div className="relative rounded-3xl border border-white/50 bg-white/80 p-8 shadow-panel backdrop-blur-md">
              <div className="flex items-center justify-between pb-6 border-b border-ink/5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-copper">DTC Marketplace</span>
                  <h3 className="text-lg font-bold text-ink mt-0.5">Micro-Brewery subscription</h3>
                </div>
                <span className="text-xs font-bold uppercase px-3 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Build
                </span>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-ink">
                    <span>Market Potential</span>
                    <span className="text-emerald-700">High</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-ink/5 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-2xl bg-paper/60 border border-ink/5">
                    <span className="text-[10px] font-bold text-ink/40 uppercase block">TAM (Est.)</span>
                    <span className="text-sm font-extrabold text-moss">$2.4B</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-paper/60 border border-ink/5">
                    <span className="text-[10px] font-bold text-ink/40 uppercase block">Confidence</span>
                    <span className="text-sm font-extrabold text-copper">High (90%)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-bold text-ink/40 uppercase block mb-1.5">Strategic Moat</span>
                  <p className="text-xs leading-relaxed text-ink/75">
                    Direct producer agreements block generic shipping networks. Hyper-local clustering optimizes distribution margins.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-ink">Built for critical founders</h2>
            <p className="text-ink/65 text-[15px] font-medium leading-relaxed">
              We skip generic AI hype. Pivotly runs a multidimensional framework to give you actionable market indicators.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-panel backdrop-blur-sm hover:bg-white/70 transition-all duration-300 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-moss/10 flex items-center justify-center text-moss mb-4 font-bold text-lg">📊</div>
              <h3 className="text-base font-bold text-ink">Market Sizing</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/65">
                Automatically calculates estimated Total Addressable Market (TAM), SAM, and SOM based on geographic scope and model insights.
              </p>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-panel backdrop-blur-sm hover:bg-white/70 transition-all duration-300 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-copper/10 flex items-center justify-center text-copper mb-4 font-bold text-lg">🛡️</div>
              <h3 className="text-base font-bold text-ink">Risk & SWOT Mapping</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/65">
                Maps out structural risks, competitor threat levels, and groups insights into a cohesive SWOT Matrix analysis.
              </p>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/40 p-6 shadow-panel backdrop-blur-sm hover:bg-white/70 transition-all duration-300 hover:-translate-y-1">
              <div className="w-10 h-10 rounded-xl bg-moss/10 flex items-center justify-center text-moss mb-4 font-bold text-lg">💡</div>
              <h3 className="text-base font-bold text-ink">Actionable Improvements</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/65">
                Translates weak points into concrete, actionable improvement recommendations and pivots to strengthen your value proposition.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

