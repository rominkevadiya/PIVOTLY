import { Link } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-ink/10 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-lg font-semibold tracking-normal text-ink">
            Venture Intelligence
          </Link>
          <Link
            to="/analyze"
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-moss"
          >
            Analyze Idea
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">{children}</main>
    </div>
  );
}
