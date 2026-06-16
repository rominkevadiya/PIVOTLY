import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen text-ink">
      <header className="border-b border-white/40 bg-white/40 backdrop-blur-xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-xl font-black tracking-tight text-ink hover:text-moss transition text-gradient">
            Pivotly
          </Link>
          <nav className="flex items-center gap-5">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-bold text-ink/70 hover:text-moss transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/analyze"
                  className="text-sm font-bold text-ink/70 hover:text-moss transition"
                >
                  Analyze Idea
                </Link>
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider bg-moss/10 text-moss px-3 py-1.5 rounded-full border border-moss/20">
                  {user?.full_name}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-white/50 bg-white/60 px-4 py-2 text-sm font-bold text-ink hover:bg-white hover:shadow-md transition-all duration-300"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-bold text-ink/70 hover:text-moss transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-ink px-5 py-2.5 text-sm font-bold tracking-wide text-white transition-all duration-300 hover:bg-moss hover:shadow-[0_8px_20px_rgb(49,92,77,0.3)] hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">{children}</main>
    </div>
  );
}
