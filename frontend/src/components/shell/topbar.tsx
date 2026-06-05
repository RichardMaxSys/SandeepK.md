"use client";

import * as React from "react";
import { Search, Bell, Upload, ChevronDown, Sparkles } from "lucide-react";
import { Button, Avatar, Badge, cn } from "@/components/ui/base";

export interface TopBarProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: () => void;
  onUploadClick: () => void;
  hasResume: boolean;
  loading?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery, onSearchChange, onSearchSubmit, onUploadClick, hasResume,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-canvas/80 backdrop-blur-xl border-b border-line">
      <div className="h-full flex items-center gap-4 px-6">
        <form
          onSubmit={(e) => { e.preventDefault(); onSearchSubmit(); }}
          className="relative flex-1 max-w-2xl"
        >
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search jobs, companies, or skills…  ⌘K"
            className={cn(
              "w-full h-10 pl-10 pr-24 rounded-xl",
              "bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle",
              "focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40",
              "transition-all",
            )}
          />
          <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 h-6 px-1.5 items-center text-2xs text-ink-subtle bg-white/5 border border-line rounded">
            ⌘K
          </kbd>
        </form>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 h-9 px-3 rounded-lg bg-accent-500/10 border border-accent-500/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-400" />
            </span>
            <span className="text-xs font-medium text-accent-300">AI Online</span>
          </div>

          <Button size="sm" variant="secondary" onClick={onUploadClick} className="hidden sm:inline-flex">
            <Upload size={14} />
            {hasResume ? "Update Resume" : "Upload Resume"}
          </Button>

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
    </header>
  );
};
