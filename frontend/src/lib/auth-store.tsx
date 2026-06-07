"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const TOKEN_KEY = "careerai.token";

export interface User {
  id: string;
  email: string;
  name: string;
  plan: "free" | "monthly" | "yearly";
  status: "free" | "active" | "canceled" | "past_due";
  rewrites_used: number;
  rewrites_limit: number;
  current_period_end?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isPro: boolean;
  rewritesRemaining: number;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (t: string) => {
    try {
      const r = await fetch(`${BACKEND}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!r.ok) {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
        return;
      }
      setUser(await r.json());
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
      fetchMe(stored).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const refreshUser = useCallback(async () => {
    const t = token || localStorage.getItem(TOKEN_KEY);
    if (t) {
      await fetchMe(t);
    }
  }, [token, fetchMe]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const r = await fetch(`${BACKEND}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: name }),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.detail ?? "Signup failed");
    }
    const data = await r.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await fetch(`${BACKEND}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.detail ?? "Login failed");
    }
    const data = await r.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const isPro = user?.status === "active";
  const rewritesRemaining = user
    ? Math.max(0, (user.rewrites_limit ?? 3) - (user.rewrites_used ?? 0))
    : 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signup,
        login,
        logout,
        refreshUser,
        isPro,
        rewritesRemaining,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function authHeaders(token: string | null): HeadersInit {
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };
}
