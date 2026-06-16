import type { AnalyzeResponse, ReportResponse } from "../types/report";
import type {
  LoginPayload,
  RegisterPayload,
  TokenResponse,
  User,
} from "../types/auth";
import type { ReportSummary } from "../types/dashboard";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

const TOKEN_KEY = "pivotly_token";

// ─── Token management ────────────────────────────────────────────────

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ─── HTTP helper ──────────────────────────────────────────────────────

interface ApiErrorPayload {
  detail?: unknown;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Request failed. Please try again.";
    try {
      const payload = (await response.json()) as ApiErrorPayload;
      if (typeof payload.detail === "string") {
        message = payload.detail;
      }
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ─── Auth API ─────────────────────────────────────────────────────────

export function registerUser(
  payload: RegisterPayload
): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(
  payload: LoginPayload
): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchCurrentUser(): Promise<User> {
  return request<User>("/auth/me");
}

// ─── Analysis API ─────────────────────────────────────────────────────

export function analyzeIdea(ideaText: string): Promise<AnalyzeResponse> {
  return request<AnalyzeResponse>("/analyze", {
    method: "POST",
    body: JSON.stringify({ idea_text: ideaText }),
  });
}

export function getReport(reportId: string): Promise<ReportResponse> {
  return request<ReportResponse>(`/reports/${reportId}`);
}

export function listReports(): Promise<ReportSummary[]> {
  return request<ReportSummary[]>("/reports");
}
