"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/components/ui/base";

export interface WeightedDimension {
  key: string;
  label: string;
  score: number;
  weight: number; // 0-1 fraction, rendered as percentage
}

export interface WeightedBreakdownProps {
  dims: WeightedDimension[];
  overall: number;
  /** Compact variant for sidebar use — smaller text, tighter spacing, lighter bar */
  compact?: boolean;
  className?: string;
}

/**
 * <WeightedBreakdown /> — shared visual breakdown of a weighted composite score.
 *
 * Renders each dimension as a row showing:
 *   label [score bar] score × weight = contribution   focus/badge
 *
 * Used by the Check tab (full) and Builder sidebar (compact).
 */
export const WeightedBreakdown: React.FC<WeightedBreakdownProps> = ({
  dims,
  overall,
  compact = false,
  className,
}) => (
  <div className={cn(compact ? "space-y-1.5" : "space-y-2.5", className)}>
    {dims.map((d) => {
      const weightPct = Math.round(d.weight * 100);
      const contribution = Math.round(d.score * d.weight);
      return (
        <div key={d.key} className="flex items-center gap-2">
          <span
            className={cn(
              "leading-tight shrink-0",
              compact ? "w-[80px] text-2xs text-ink-muted" : "w-[88px] text-xs text-ink-muted",
            )}
          >
            {d.label}
          </span>
          <div
            className={cn(
              "flex-1 rounded-full bg-white/[0.04] overflow-hidden",
              compact ? "h-1.5" : "h-2.5",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                d.score >= 80 ? "bg-success" : d.score >= 60 ? "bg-accent-500" : d.score >= 40 ? "bg-amber-500" : "bg-danger",
              )}
              style={{ width: `${d.score}%` }}
            />
          </div>
          <span
            className={cn(
              "text-right font-semibold tabular-nums",
              compact ? "w-5 text-2xs text-ink" : "w-6 text-xs text-ink",
            )}
          >
            {d.score}
          </span>
          {!compact && (
            <span className="text-2xs text-ink-subtle tabular-nums shrink-0">×{weightPct}%</span>
          )}
          {!compact && (
            <span className="w-6 text-right text-xs font-semibold tabular-nums">{contribution}</span>
          )}
          {d.score < 70 ? (
            <span className={cn("shrink-0", compact ? "text-2xs text-danger/80" : "text-2xs text-danger/80")}>
              {compact ? "←" : "← focus"}
            </span>
          ) : d.score >= 85 ? (
            <CheckCircle2 size={compact ? 10 : 11} className="text-success shrink-0" />
          ) : (
            <span className={cn("shrink-0", compact ? "w-3" : "w-10")} />
          )}
        </div>
      );
    })}
    {/* Sum row */}
    <div
      className={cn(
        "flex items-center gap-2 pt-2 border-t border-line",
        compact ? "pt-1.5" : "pt-2.5",
      )}
    >
      <span
        className={cn(
          "font-semibold text-ink leading-tight shrink-0",
          compact ? "w-[80px] text-2xs" : "w-[88px] text-xs",
        )}
      >
        Overall
      </span>
      <div className="flex-1" />
      <span
        className={cn(
          "text-right font-bold tabular-nums",
          compact ? "w-5 text-xs" : "w-6 text-sm",
        )}
      >
        {overall}
      </span>
      <span className="text-2xs text-ink-subtle tabular-nums shrink-0">/ 100</span>
      {!compact && <span className="w-6" />}
      <span className={cn("shrink-0", compact ? "w-3" : "w-10")} />
    </div>
  </div>
);
