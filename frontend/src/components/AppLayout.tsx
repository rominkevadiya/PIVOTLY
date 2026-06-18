import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col print:block text-ink bg-paper/20">
      {/* Premium Glassmorphic Header */}
      <header className="border-b border-white/30 bg-white/30 backdrop-blur-md sticky top-0 z-50 shadow-[0_2px_20px_rgba(22,32,29,0.03)] no-print">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-2xl font-black tracking-tight text-ink hover:opacity-90 transition duration-300"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-moss to-copper flex items-center justify-center text-white text-lg shadow-md">
              P
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-ink to-ink/80">
              Pivotly
            </span>
          </Link>
          
          <nav className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-semibold transition-all relative py-1 ${
                    isActive("/dashboard") 
                      ? "text-moss" 
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  Dashboard
                  {isActive("/dashboard") && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-moss rounded-full" />
                  )}
                </Link>
                <Link
                  to="/analyze"
                  className={`text-sm font-semibold transition-all relative py-1 ${
                    isActive("/analyze") 
                      ? "text-moss" 
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  Analyze Idea
                  {isActive("/analyze") && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-moss rounded-full" />
                  )}
                </Link>
                <div className="hidden sm:flex items-center gap-2 bg-moss/5 border border-moss/10 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-moss">
                    {user?.full_name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-ink/10 bg-white/80 px-4 py-2 text-sm font-semibold text-ink hover:bg-ink hover:text-white hover:border-ink hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-ink/60 hover:text-ink transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold tracking-wide text-white transition-all duration-300 hover:bg-moss hover:shadow-[0_8px_20px_rgb(49,92,77,0.25)] transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8 sm:py-12 print:block print:p-0">
        {children}
      </main>

      {/* Premium Footer */}
      <footer className="border-t border-ink/5 bg-white/10 py-8 text-center text-xs text-ink/40 no-print mt-auto">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-tight text-ink/60">Pivotly</span>
            <span>&copy; {new Date().getFullYear()} Venture Intelligence Platform.</span>
          </div>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-moss transition">Home</Link>
            <span>&middot;</span>
            <Link to="/analyze" className="hover:text-moss transition">Validate Idea</Link>
            <span>&middot;</span>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-moss transition">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

