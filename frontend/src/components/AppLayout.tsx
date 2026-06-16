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
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 bg-white/85 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight text-ink hover:text-moss transition">
            Pivotly
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-ink/75 hover:text-ink transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/analyze"
                  className="text-sm font-medium text-ink/75 hover:text-ink transition"
                >
                  Analyze Idea
                </Link>
                <span className="hidden sm:inline text-xs font-semibold bg-moss/10 text-moss px-2.5 py-1 rounded-full">
                  {user?.full_name}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-ink/10 bg-white px-3.5 py-1.5 text-sm font-medium text-ink hover:bg-paper transition"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-ink/75 hover:text-ink transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-moss"
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
