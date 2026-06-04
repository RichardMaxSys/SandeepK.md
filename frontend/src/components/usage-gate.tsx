"use client";

import * as React from "react";
import { Lock, Sparkles, X } from "lucide-react";
import { Card, Button, Badge, cn } from "@/components/ui/base";
import { LIMITS, canUse, getUsage, recordUse, timeUntilReset, type FeatureKey, setPro, isPro } from "@/lib/usage-limits";

export interface UsageGateProps {
  feature: FeatureKey;
  onAllowed: () => void;
  children: React.ReactNode;
  /** When true, the gate is bypassed (e.g., in dev or for pro users) */
  bypass?: boolean;
}

/**
 * Wraps a button/action in a free-tier check.
 *  - If user can use it: renders children unchanged
 *  - If user is at limit: shows an upgrade prompt
 */
export const UsageGate: React.FC<UsageGateProps> = ({ feature, onAllowed, children, bypass }) => {
  const [tick, setTick] = React.useState(0);
  const [showUpgrade, setShowUpgrade] = React.useState(false);
  const usage = getUsage(feature);
  const limit = LIMITS[feature];
  const allowed = bypass || isPro() || usage.remaining > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (bypass || isPro()) { onAllowed(); return; }
    if (usage.remaining > 0) {
      const r = recordUse(feature);
      if (r.ok) { onAllowed(); setTick((t) => t + 1); }
    } else {
      setShowUpgrade(true);
    }
  };

  if (showUpgrade && !allowed) {
    return (
      <UpgradePrompt
        feature={feature}
        onClose={() => setShowUpgrade(false)}
      />
    );
  }

  return (
    <div onClickCapture={handleClick} data-usage-tick={tick} className="contents">
      {children}
    </div>
  );
};

const UpgradePrompt: React.FC<{ feature: FeatureKey; onClose: () => void }> = ({ feature, onClose }) => {
  const limit = LIMITS[feature];
  return (
    <Card className="p-6 bg-gradient-to-br from-accent-500/10 to-canvas-raised border-accent-500/20">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
            <Lock size={16} className="text-accent-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Free limit reached</h3>
            <p className="text-2xs text-ink-muted">{limit.description}</p>
          </div>
        </div>
        <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-ink-subtle hover:text-ink hover:bg-white/5" aria-label="Close">
          <X size={14} />
        </button>
      </div>
      <p className="text-sm text-ink-muted leading-relaxed">
        You've used all {limit.quota} of your free {limit.label.toLowerCase()}
        {limit.quota === 1 ? "" : "s"} this {limit.period}. Resets in <span className="text-ink font-medium">{timeUntilReset(feature)}</span>.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Button variant="primary" size="md" className="flex-1">
          <Sparkles size={14} />
          Upgrade to Pro
        </Button>
        <Button variant="secondary" size="md" onClick={onClose}>
          Maybe later
        </Button>
      </div>
      <p className="mt-3 text-2xs text-ink-subtle text-center">
        Pro is $15/mo or $120/yr · Unlimited checks, no watermark, full AI rewrites
      </p>
    </Card>
  );
};

/* -------------------------------------------------------------------------- */
/*                           Inline usage chip                                 */
/* -------------------------------------------------------------------------- */

export const UsageChip: React.FC<{ feature: FeatureKey }> = ({ feature }) => {
  const [, setTick] = React.useState(0);
  const usage = getUsage(feature);
  const limit = LIMITS[feature];
  if (isPro()) return <Badge tone="accent" className="font-mono">Pro</Badge>;
  return (
    <Badge
      tone={usage.remaining > 0 ? "neutral" : "warning"}
      className="font-mono"
      onClick={() => setTick((t) => t + 1)}
    >
      {usage.used}/{limit.quota} this {limit.period}
    </Badge>
  );
};

/* -------------------------------------------------------------------------- */
/*                          Dev helper: toggle Pro                             */
/* -------------------------------------------------------------------------- */
/* Useful for local QA. Drops a "Toggle Pro" pill in the bottom-right.        */
export const ProToggle: React.FC = () => {
  if (typeof window === "undefined") return null;
  // Don't render in production
  if (process.env.NODE_ENV === "production") return null;
  const [pro, setProState] = React.useState(isPro());
  return (
    <button
      onClick={() => { setPro(!pro); setProState(!pro); window.location.reload(); }}
      className={cn(
        "fixed bottom-4 right-4 z-50 h-9 px-3 rounded-full text-2xs font-semibold backdrop-blur border shadow-soft",
        pro
          ? "bg-accent-500 text-white border-accent-400"
          : "bg-canvas-raised text-ink-muted border-line hover:text-ink",
      )}
    >
      Dev: {pro ? "Pro ON" : "Pro OFF"}
    </button>
  );
};
