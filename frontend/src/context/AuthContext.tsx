import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { User } from "../types/auth";
import {
  fetchCurrentUser,
  getStoredToken,
  loginUser,
  registerUser,
  removeStoredToken,
  setStoredToken,
} from "../services/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Attempt to restore session from stored token on mount
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        removeStoredToken();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokenResponse = await loginUser({ email, password });
    setStoredToken(tokenResponse.access_token);
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      await registerUser({
        email,
        password,
        full_name: fullName,
      });
      // Auto-login after registration
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    removeStoredToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
