"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button, cn } from "@/components/ui/base";
import { useAuth } from "@/lib/auth-store";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
}

export function AuthModal({ open, onClose, defaultTab = "login" }: AuthModalProps) {
  const { login, signup } = useAuth();
  const [tab, setTab] = React.useState<"login" | "signup">(defaultTab);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setEmail("");
      setPassword("");
      setName("");
      setError(null);
    }
  }, [open, defaultTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (tab === "signup" && !name.trim()) {
      setError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-[#0f0f12] border border-line shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h2 className="text-lg font-semibold text-ink">
                  {tab === "login" ? "Sign in" : "Create account"}
                </h2>
                <button onClick={onClose} className="text-ink-subtle hover:text-ink transition-colors p-1">
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-6 gap-0 border-b border-line mb-4">
                <button
                  onClick={() => { setTab("login"); setError(null); }}
                  className={cn(
                    "pb-3 px-4 text-sm font-medium transition-colors relative",
                    tab === "login" ? "text-ink" : "text-ink-subtle hover:text-ink-muted",
                  )}
                >
                  Sign In
                  {tab === "login" && (
                    <motion.div
                      layoutId="auth-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 rounded-full"
                    />
                  )}
                </button>
                <button
                  onClick={() => { setTab("signup"); setError(null); }}
                  className={cn(
                    "pb-3 px-4 text-sm font-medium transition-colors relative",
                    tab === "signup" ? "text-ink" : "text-ink-subtle hover:text-ink-muted",
                  )}
                >
                  Create Account
                  {tab === "signup" && (
                    <motion.div
                      layoutId="auth-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-500 rounded-full"
                    />
                  )}
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                {tab === "signup" && (
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1.5">Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-10 px-3 rounded-lg bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 px-3 rounded-lg bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 pl-3 pr-10 rounded-lg bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink-muted"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 flex items-start gap-2">
                    <AlertCircle size={12} className="text-danger shrink-0 mt-0.5" />
                    <p className="text-xs text-danger/90">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {tab === "login" ? "Signing in…" : "Creating account…"}
                    </>
                  ) : tab === "login" ? (
                    "Sign in"
                  ) : (
                    "Create account"
                  )}
                </Button>

                <p className="text-2xs text-center text-ink-subtle">
                  {tab === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <button type="button" onClick={() => { setTab("signup"); setError(null); }} className="text-accent-300 hover:text-accent-200 underline">
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button type="button" onClick={() => { setTab("login"); setError(null); }} className="text-accent-300 hover:text-accent-200 underline">
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
