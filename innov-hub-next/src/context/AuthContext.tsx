"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { auth as authApi, users as usersApi, setTokens, clearTokens } from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  businessUnit: string | null;
  department: string | null;
  avatarUrl: string | null;
  points: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    // Validate token is not locally expired before hitting the server
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const isExpired = payload.exp && payload.exp * 1000 < Date.now();
      if (isExpired) {
        clearTokens();
        setLoading(false);
        return;
      }
      // Verify token is accepted by the backend
      usersApi.getMe().then((res) => {
        const u = res.data as User;
        setUser(u);
      }).catch(() => {
        clearTokens();
      }).finally(() => {
        setLoading(false);
      });
    } catch {
      clearTokens();
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { accessToken, refreshToken, user: u } = res.data as {
      accessToken: string;
      refreshToken: string;
      user: User;
    };
    setTokens(accessToken, refreshToken);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    clearTokens();
    setUser(null);
  }, []);

  const isRole = useCallback(
    (...roles: string[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
