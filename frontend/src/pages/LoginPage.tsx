import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage } from "../components/ErrorMessage";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-5 py-12 text-ink">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="text-2xl font-bold tracking-tight text-ink hover:text-moss transition">
            Pivotly
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-ink">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-ink/75">
            Or{" "}
            <Link to="/register" className="font-semibold text-copper hover:text-copper/80 transition">
              create a new account
            </Link>
          </p>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-8 shadow-panel backdrop-blur-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-ink/80">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-md border border-ink/10 bg-paper px-3 py-2 text-ink placeholder-ink/40 shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss sm:text-sm transition duration-150 ease-in-out"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-ink/80">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-md border border-ink/10 bg-paper px-3 py-2 text-ink placeholder-ink/40 shadow-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss sm:text-sm transition duration-150 ease-in-out"
              />
            </div>

            {error && <ErrorMessage message={error} />}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-ink py-2.5 px-4 text-sm font-semibold text-white shadow-sm hover:bg-moss focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss disabled:opacity-50 transition duration-150 ease-in-out"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
