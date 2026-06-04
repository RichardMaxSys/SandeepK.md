"use client";

import * as React from "react";
import { Lock, Check, Sparkles } from "lucide-react";
import { cn } from "@/components/ui/base";
import { TEMPLATES, accentGradient, accentSolid, type TemplateDef } from "@/lib/templates";

export const TemplateCard: React.FC<{
  template: TemplateDef;
  active: boolean;
  onSelect: () => void;
}> = ({ template, active, onSelect }) => {
  const t = template;
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative text-left rounded-2xl border bg-canvas-raised overflow-hidden transition-all",
        active
          ? "border-accent-500/50 shadow-glow-accent"
          : "border-line hover:border-line-strong hover:bg-[#1a2238]",
      )}
    >
      {/* Preview thumbnail */}
      <div className="aspect-[3/4] relative bg-canvas p-3 overflow-hidden">
        <TemplateThumbnail t={t} active={active} />

        {active && (
          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-accent-500 flex items-center justify-center shadow-glow-accent">
            <Check size={13} className="text-white" />
          </div>
        )}

        {t.tier === "pro" && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-canvas/85 border border-amber-500/30 text-2xs font-semibold text-amber-300 backdrop-blur">
            <Sparkles size={9} />
            Pro
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="p-3 border-t border-line">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink truncate">{t.name}</p>
        </div>
        <p className="text-2xs text-ink-subtle capitalize mt-0.5">{t.category}</p>
      </div>
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Thumbnail renderer                            */
/* -------------------------------------------------------------------------- */

const TemplateThumbnail: React.FC<{ t: TemplateDef; active: boolean }> = ({ t }) => {
  const accent = accentSolid(t.style.accent);
  const grad   = accentGradient(t.style.accent);
  const font   = t.style.font === "serif" ? "font-serif" : t.style.font === "mono" ? "font-mono" : "font-sans";

  // Line height/density
  const lineCls = t.style.density === "compact" ? "h-1" : t.style.density === "spacious" ? "h-1.5" : "h-1";
  const lineW   = t.style.density === "compact" ? "w-full" : "w-[88%]";

  return (
    <div className={cn("w-full h-full rounded-md bg-canvas-subtle border border-line p-2.5 flex flex-col gap-1.5 overflow-hidden", font)}>
      {/* Header */}
      {t.style.headerStyle === "centered" && (
        <div className="flex flex-col items-center gap-1 pb-1.5 border-b border-line/60">
          <div className={cn("h-1.5 w-3/5 rounded-full bg-ink/80")} />
          <div className="h-1 w-2/5 rounded-full bg-ink/40" />
          <div className="flex gap-1 mt-0.5">
            <div className="h-1 w-6 rounded-full bg-ink/30" />
            <div className="h-1 w-6 rounded-full bg-ink/30" />
          </div>
        </div>
      )}

      {t.style.headerStyle === "left" && (
        <div className="pb-1.5 border-b border-line/60">
          <div className={cn("h-1.5 w-3/5 rounded-full bg-ink/80")} />
          <div className="h-1 w-2/5 rounded-full bg-ink/40 mt-1" />
        </div>
      )}

      {t.style.headerStyle === "banner" && (
        <div className={cn("-mx-2.5 -mt-2.5 h-7 bg-gradient-to-br mb-1.5", grad, accent)}>
          <div className="h-full w-full flex items-center justify-center">
            <div className="h-1.5 w-2/5 rounded-full bg-white/90" />
          </div>
        </div>
      )}

      {t.style.headerStyle === "sidebar" && (
        <div className="flex gap-1.5 flex-1 min-h-0">
          <div className={cn("w-1/3 rounded-sm p-1 flex flex-col gap-0.5", accent, "bg-opacity-20")} style={{ background: "rgba(20,184,166,0.08)" }}>
            <div className="h-1.5 w-full rounded-full bg-ink/80 mb-1" />
            <div className="h-1 w-full rounded-full bg-ink/40" />
            <div className="h-1 w-3/4 rounded-full bg-ink/30 mt-1.5" />
            <div className="h-1 w-full rounded-full bg-ink/30" />
            <div className="h-1 w-5/6 rounded-full bg-ink/30" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="h-1 w-1/3 rounded-full bg-ink/60 mb-0.5" />
            <div className={cn(lineCls, lineW, "rounded-full bg-ink/30")} />
            <div className={cn(lineCls, lineW, "rounded-full bg-ink/30")} />
            <div className={cn(lineCls, "w-3/4 rounded-full bg-ink/30")} />
            <div className="h-1 w-1/3 rounded-full bg-ink/60 mt-1.5 mb-0.5" />
            <div className={cn(lineCls, lineW, "rounded-full bg-ink/30")} />
            <div className={cn(lineCls, lineW, "rounded-full bg-ink/30")} />
          </div>
        </div>
      )}

      {t.style.headerStyle === "split" && (
        <div className="pb-1.5 border-b border-line/60 flex items-center gap-2">
          <div className="h-5 w-5 rounded-full bg-ink/30 shrink-0" />
          <div className="flex-1">
            <div className="h-1.5 w-3/5 rounded-full bg-ink/80" />
            <div className="h-1 w-2/5 rounded-full bg-ink/40 mt-0.5" />
          </div>
        </div>
      )}

      {/* Body sections */}
      {t.style.headerStyle !== "sidebar" && (
        <>
          <div className="h-1 w-1/3 rounded-full bg-ink/60 mt-1" />
          <div className={cn(lineCls, lineW, "rounded-full bg-ink/30")} />
          <div className={cn(lineCls, lineW, "rounded-full bg-ink/30")} />
          <div className={cn(lineCls, "w-3/4 rounded-full bg-ink/30")} />

          <div className="h-1 w-1/3 rounded-full bg-ink/60 mt-1.5" />
          <div className={cn(lineCls, lineW, "rounded-full bg-ink/30")} />
          <div className={cn(lineCls, lineW, "rounded-full bg-ink/30")} />
          <div className={cn(lineCls, "w-2/3 rounded-full bg-ink/30")} />

          <div className="h-1 w-1/4 rounded-full bg-ink/60 mt-1.5" />
          <div className="flex flex-wrap gap-1 mt-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-1.5 w-5 rounded-full bg-ink/30" />
            ))}
          </div>
        </>
      )}

      {/* Accent dot */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <div className={cn("h-1.5 w-1.5 rounded-full", accent)} />
      </div>
    </div>
  );
};

export { TEMPLATES };
