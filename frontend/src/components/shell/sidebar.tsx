"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard, Briefcase, FileText, BarChart3, KanbanSquare, Settings, Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/ui/base";

export type NavKey =
  | "dashboard" | "jobs" | "resume" | "ats" | "applications" | "settings";

interface NavItemDef {
  key: NavKey;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const NAV: NavItemDef[] = [
  { key: "dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { key: "jobs",         label: "Jobs",         icon: Briefcase,     badge: "Live" },
  { key: "resume",       label: "Resume",       icon: FileText },
  { key: "ats",          label: "ATS Analysis", icon: BarChart3 },
  { key: "applications", label: "Applications", icon: KanbanSquare },
  { key: "settings",     label: "Settings",     icon: Settings },
];

export interface SidebarProps {
  active: NavKey;
  onChange: (key: NavKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, onChange }) => {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-line bg-canvas-subtle">
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-line">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent-400 to-sky-500 flex items-center justify-center shadow-glow-accent">
          <Sparkles size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink tracking-tight">ResumeElevate</p>
          <p className="text-2xs text-ink-subtle uppercase tracking-wider">Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="px-3 mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
          Workspace
        </p>
        {NAV.map(({ key, label, icon: Icon, badge }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive ? "text-ink" : "text-ink-muted hover:text-ink hover:bg-white/5",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-lg bg-white/[0.06] border border-line"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={18}
                className={cn(
                  "relative z-10 transition-colors",
                  isActive ? "text-accent-300" : "text-ink-subtle group-hover:text-ink-muted",
                )}
              />
              <span className="relative z-10 flex-1 text-left">{label}</span>
              {badge && (
                <span className="relative z-10 inline-flex items-center text-2xs font-semibold px-1.5 py-0.5 rounded-md bg-accent-500/15 text-accent-300 border border-accent-500/20">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="m-3 p-4 rounded-xl bg-gradient-to-br from-accent-500/15 to-sky-500/10 border border-accent-500/20">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={14} className="text-accent-300" />
          <p className="text-xs font-semibold text-ink">Pro Tip</p>
        </div>
        <p className="text-2xs text-ink-muted leading-relaxed">
          Upload your master resume once. We&apos;ll tailor it for every role.
        </p>
      </div>
    </aside>
  );
};
