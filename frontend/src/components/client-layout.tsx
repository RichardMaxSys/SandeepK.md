"use client";

import { AuthProvider } from "@/lib/auth-store";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
