"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Sparkles, User, ChevronDown, Loader2 } from "lucide-react";
import { Button, cn } from "@/components/ui/base";
import { useAuth } from "@/lib/auth-store";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

interface UserMenuProps {
  onOpenAuth: () => void;
}

export function UserMenu({ onOpenAuth }: UserMenuProps) {
  const { user, token, loading, isPro, rewritesRemaining, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-canvas-subtle border border-line flex items-center justify-center">
        <Loader2 size={14} className="animate-spin text-ink-subtle" />
      </div>
    );
  }

  if (!user || !token) {
    return (
      <Button variant="secondary" size="sm" onClick={onOpenAuth}>
        <User size={14} />
        Sign In
      </Button>
    );
  }

  const getPlanBadge = () => {
    if (isPro) {
      return (
        <span className="text-xs bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded-full font-medium">
          Pro ✓
        </span>
      );
    }
    if (rewritesRemaining > 0) {
      return (
        <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-medium">
          ⚡ {rewritesRemaining} free left
        </span>
      );
    }
    return (
      <span className="text-xs bg-danger/10 text-danger border border-danger/20 px-1.5 py-0.5 rounded-full font-medium">
        ⚡ 0 rewrites left
      </span>
    );
  };

  const handleManage = () => {
    window.open(`${BACKEND}/payments/portal`, "_blank");
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-9 px-3 rounded-lg bg-canvas-subtle border border-line hover:bg-white/10 transition-colors text-sm text-ink"
      >
        <span className="text-xs truncate max-w-[100px]">{user.email}</span>
        <div className="flex items-center gap-1">
          {getPlanBadge()}
          <ChevronDown size={12} className={cn("text-ink-subtle transition-transform", open && "rotate-180")} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full min-w-[220px] rounded-xl bg-[#0f0f12] border border-line shadow-2xl overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-line">
              <p className="text-sm font-medium text-ink truncate">{user.name || user.email}</p>
              <p className="text-2xs text-ink-subtle truncate">{user.email}</p>
            </div>

            {/* Plan info */}
            <div className="px-4 py-3 border-b border-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xs text-ink-muted">Plan</span>
                <span className="text-xs font-medium capitalize text-ink">{user.plan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xs text-ink-muted">Rewrites used</span>
                <span className="text-xs font-medium text-ink">
                  {user.rewrites_used}/{user.rewrites_limit === -1 ? "∞" : user.rewrites_limit}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2 space-y-0.5">
              {!isPro && (
                <button
                  onClick={() => {
                    setOpen(false);
                    // Trigger upgrade flow — redirect to pricing
                    const event = new CustomEvent("careerai:open-checkout", { detail: { plan: "monthly" } });
                    window.dispatchEvent(event);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink hover:bg-accent-500/15 hover:text-accent-300 transition-colors"
                >
                  <Sparkles size={14} />
                  Upgrade to Pro
                </button>
              )}
              {isPro && (
                <button
                  onClick={() => {
                    setOpen(false);
                    handleManage();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink hover:bg-white/5 transition-colors"
                >
                  <User size={14} />
                  Manage Subscription
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
