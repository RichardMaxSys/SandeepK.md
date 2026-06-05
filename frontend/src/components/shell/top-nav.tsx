"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Search, Bell, Download, ChevronDown, type LucideIcon } from "lucide-react";
import { Avatar, Badge, Button, cn } from "@/components/ui/base";

/* -------------------------------------------------------------------------- */
/*                                 Tab model                                  */
/* -------------------------------------------------------------------------- */

export type TabKey = "builder" | "check" | "tailor";

export interface TabDef {
  key: TabKey;
  label: string;
  shortLabel?: string;
  description: string;
  icon: LucideIcon;
}

export const TABS: TabDef[] = [
  {
    key: "builder",
    label: "Builder",
    shortLabel: "Build",
    description: "Pick a template, edit your resume, export PDF / DOCX.",
    icon: Sparkles,
  },
  {
    key: "check",
    label: "ATS Check",
    shortLabel: "Check",
    description: "Upload your resume and see exactly how an ATS reads it.",
    icon: Search,
  },
  {
    key: "tailor",
    label: "Tailor to Job",
    shortLabel: "Tailor",
    description: "Paste a job description. Get a match score, AI rewrite, and cover letter.",
    icon: Sparkles,
  },
];

/* -------------------------------------------------------------------------- */
/*                                 Top nav                                    */
/* -------------------------------------------------------------------------- */

export interface TopNavProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
  onExport?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ active, onChange, onExport }) => {
  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0];

  return (
    <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-xl border-b border-line">
      {/* Row 1: brand + actions */}
      <div className="h-16 px-6 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent-400 to-sky-500 flex items-center justify-center shadow-glow-accent group-hover:opacity-90 transition-opacity">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink tracking-tight">CareerAI</p>
              <p className="text-2xs text-ink-subtle uppercase tracking-wider">Resume Intelligence</p>
            </div>
          </Link>
        </div>

        <div className="hidden md:block flex-1 max-w-md mx-4">
          <div className="h-9 px-3 rounded-lg bg-canvas-subtle border border-line flex items-center gap-2 text-xs text-ink-subtle">
            <Search size={13} />
            <span>Search anything…</span>
            <kbd className="ml-auto text-2xs text-ink-subtle bg-white/5 border border-line rounded px-1.5 py-0.5">⌘K</kbd>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg bg-accent-500/10 border border-accent-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-400" />
            </span>
            <span className="text-xs font-medium text-accent-300">AI Online</span>
          </div>

          {onExport && (
            <Button variant="secondary" size="sm" onClick={onExport}>
              <Download size={14} />
              Export
            </Button>
          )}

          <button
            className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-white/5 border border-line"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent-400" />
          </button>

          <button className="flex items-center gap-2.5 h-9 pl-1 pr-2 rounded-lg border border-line hover:bg-white/5 transition-colors">
            <Avatar name="Sandeep K" size={28} />
            <div className="hidden md:block text-left leading-tight">
              <p className="text-xs font-medium text-ink">Sandeep K</p>
              <p className="text-2xs text-ink-subtle">Pro</p>
            </div>
            <ChevronDown size={14} className="text-ink-subtle hidden md:block" />
          </button>
        </div>
      </div>

      {/* Row 2: tab nav */}
      <div className="px-6 flex items-center gap-1 border-t border-line">
        {TABS.map((t) => {
          const isActive = t.key === active;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={cn(
                "relative flex items-center gap-2 px-4 h-12 text-sm font-medium transition-colors",
                isActive ? "text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              <Icon size={15} className={cn(isActive ? "text-accent-300" : "text-ink-subtle")} />
              {t.label}
              {isActive && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute -bottom-px left-2 right-2 h-0.5 bg-accent-500"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Context bar                                   */
/* -------------------------------------------------------------------------- */

export const TabContextBar: React.FC<{
  active: TabKey;
  className?: string;
  right?: React.ReactNode;
}> = ({ active, className, right }) => {
  const t = TABS.find((x) => x.key === active) ?? TABS[0];
  return (
    <div className={cn(
      "flex flex-col md:flex-row md:items-end md:justify-between gap-3",
      className,
    )}>
      <div>
        <p className="text-2xs font-medium uppercase tracking-wider text-accent-300">
          {t.shortLabel ?? t.label}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{t.label}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.description}</p>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
};

// re-export Badge so the file stays self-contained for shell consumers
export { Badge };
