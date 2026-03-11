"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { auth as authApi, setTokens, clearTokens } from "@/lib/api";

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
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    businessUnit?: string;
    department?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          id: payload.sub,
          email: payload.email,
          firstName: payload.firstName || "",
          lastName: payload.lastName || "",
          fullName: payload.fullName || payload.email,
          role: payload.role,
          businessUnit: null,
          department: null,
          avatarUrl: null,
          points: 0,
        });
      } catch {
        clearTokens();
      }
    }
    setLoading(false);
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

  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: string;
      businessUnit?: string;
      department?: string;
    }) => {
      const res = await authApi.register(data);
      const { accessToken, refreshToken, user: u } = res.data as {
        accessToken: string;
        refreshToken: string;
        user: User;
      };
      setTokens(accessToken, refreshToken);
      setUser(u);
    },
    []
  );

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
    <AuthContext.Provider value={{ user, loading, login, register, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
