"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Plus, Copy, Trash2, Check, Pencil, X, FileText, Briefcase,
} from "lucide-react";
import { Button, Badge, cn } from "@/components/ui/base";
import { useResume, BASE_VERSION } from "@/lib/resume-store";

/**
 * <VersionSelector /> — a reusable dropdown for picking which ResumeVersion is
 * active across the Build / Tailor / ATS Check tabs.
 *
 * Props:
 *   - variant: "full" (with source label + actions) | "compact" (label only, no actions)
 *   - filter:  show only "base" | "tailored" | "all"
 *   - onPick:  optional callback when a version is selected (for Tailor: don't switch active)
 */
export interface VersionSelectorProps {
  variant?: "full" | "compact";
  filter?: "all" | "base" | "tailored";
  onPick?: (id: string) => void;
  className?: string;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  variant = "full",
  filter = "all",
  onPick,
  className,
}) => {
  const {
    versions,
    activeVersionId,
    versionList,
    setActiveVersion,
    duplicateVersion,
    renameVersion,
    deleteVersion,
  } = useResume();
  const [open, setOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState<string | null>(null);
  const [renameVal, setRenameVal] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const active = versions[activeVersionId] ?? versions[BASE_VERSION];

  const filteredList = React.useMemo(
    () => versionList.filter((v) => (filter === "all" ? true : v.source === filter)),
    [versionList, filter],
  );

  const pick = (id: string) => {
    if (onPick) onPick(id);
    else setActiveVersion(id);
    setOpen(false);
  };

  const handleRenameStart = (id: string, currentLabel: string) => {
    setRenaming(id);
    setRenameVal(currentLabel);
  };

  const handleRenameCommit = () => {
    if (renaming && renameVal.trim()) {
      renameVersion(renaming, renameVal.trim());
    }
    setRenaming(null);
    setRenameVal("");
  };

  const handleDuplicate = (id: string) => {
    const src = versions[id];
    if (!src) return;
    const copyLabel = `${src.label} (copy)`;
    duplicateVersion(id, copyLabel);
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteVersion(id);
    setConfirmDelete(null);
  };

  if (!active) return null;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-2 h-9 px-3 rounded-lg border bg-canvas-subtle text-sm transition-colors",
          "border-line hover:border-line-strong focus:outline-none focus:ring-2 focus:ring-accent-500/40",
          variant === "compact" && "h-8 text-xs",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={cn(
          "h-5 w-5 rounded flex items-center justify-center shrink-0",
          active.source === "base"
            ? "bg-accent-500/15 text-accent-300"
            : "bg-violet-500/15 text-violet-300",
        )}>
          {active.source === "base" ? <FileText size={11} /> : <Briefcase size={11} />}
        </span>
        <span className="font-medium text-ink truncate max-w-[200px]">{active.label}</span>
        {variant === "full" && (
          <Badge tone={active.source === "base" ? "neutral" : "accent"} className="ml-1 text-2xs">
            {active.source === "base" ? "Base" : "Tailored"}
          </Badge>
        )}
        <ChevronDown size={12} className={cn("text-ink-subtle shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-50 mt-1.5 w-[320px] rounded-xl border border-line bg-canvas-raised shadow-2xl overflow-hidden"
            role="listbox"
          >
            <div className="px-3 py-2 border-b border-line flex items-center justify-between">
              <p className="text-2xs font-medium uppercase tracking-wider text-ink-subtle">
                Resume versions
              </p>
              <span className="text-2xs text-ink-subtle tabular-nums">{filteredList.length}</span>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {filteredList.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-ink-muted">
                  No versions yet.
                </div>
              ) : (
                filteredList.map((v) => {
                  const isActive = v.id === activeVersionId;
                  const isRenaming = renaming === v.id;
                  return (
                    <div
                      key={v.id}
                      role="option"
                      aria-selected={isActive}
                      className={cn(
                        "group px-3 py-2.5 flex items-center gap-2 cursor-pointer border-b border-line/40 last:border-0",
                        "hover:bg-white/[0.03] transition-colors",
                        isActive && "bg-accent-500/[0.06]",
                      )}
                      onClick={() => !isRenaming && pick(v.id)}
                    >
                      <span className={cn(
                        "h-6 w-6 rounded flex items-center justify-center shrink-0",
                        v.source === "base" ? "bg-accent-500/15 text-accent-300" : "bg-violet-500/15 text-violet-300",
                      )}>
                        {v.source === "base" ? <FileText size={11} /> : <Briefcase size={11} />}
                      </span>
                      <div className="flex-1 min-w-0">
                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renameVal}
                            onChange={(e) => setRenameVal(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameCommit();
                              if (e.key === "Escape") { setRenaming(null); setRenameVal(""); }
                            }}
                            className="w-full h-7 px-2 rounded-md bg-canvas border border-accent-500/40 text-xs text-ink focus:outline-none"
                          />
                        ) : (
                          <>
                            <p className="text-sm text-ink truncate">{v.label}</p>
                            <p className="text-2xs text-ink-subtle mt-0.5">
                              {v.source === "base" ? "Base resume" : `Tailored · ${new Date(v.updatedAt).toLocaleDateString()}`}
                              {typeof v.matchScoreAtSave === "number" && ` · ${v.matchScoreAtSave}%`}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Active checkmark */}
                      {isActive && !isRenaming && <Check size={12} className="text-accent-300 shrink-0" />}

                      {/* Per-row actions */}
                      {variant === "full" && !isRenaming && (
                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title="Rename"
                            onClick={(e) => { e.stopPropagation(); handleRenameStart(v.id, v.label); }}
                            className="h-6 w-6 rounded inline-flex items-center justify-center text-ink-subtle hover:text-ink hover:bg-white/5"
                          >
                            <Pencil size={10} />
                          </button>
                          <button
                            title="Duplicate"
                            onClick={(e) => { e.stopPropagation(); handleDuplicate(v.id); }}
                            className="h-6 w-6 rounded inline-flex items-center justify-center text-ink-subtle hover:text-ink hover:bg-white/5"
                          >
                            <Copy size={10} />
                          </button>
                          {v.source !== "base" && (
                            <button
                              title="Delete"
                              onClick={(e) => { e.stopPropagation(); setConfirmDelete(v.id); }}
                              className="h-6 w-6 rounded inline-flex items-center justify-center text-ink-subtle hover:text-danger hover:bg-white/5"
                            >
                              <Trash2 size={10} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Rename confirm button */}
                      {isRenaming && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRenameCommit(); }}
                          className="h-6 w-6 rounded inline-flex items-center justify-center text-accent-300 hover:bg-accent-500/15"
                        >
                          <Check size={11} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {variant === "full" && (
              <div className="px-3 py-2 border-t border-line">
                <p className="text-2xs text-ink-subtle leading-relaxed">
                  Edit the base in the <span className="text-ink font-medium">Build</span> tab. Create a tailored version from the <span className="text-ink font-medium">Tailor</span> tab.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDeleteModal
            label={versions[confirmDelete]?.label ?? "this version"}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => handleDelete(confirmDelete)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ConfirmDeleteModal: React.FC<{
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ label, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onCancel}>
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.12 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-sm rounded-xl border border-line bg-canvas-raised shadow-2xl p-5"
    >
      <p className="text-sm font-semibold text-ink">Delete this version?</p>
      <p className="text-xs text-ink-muted mt-2 leading-relaxed">
        "<span className="text-ink">{label}</span>" will be permanently removed. Your base resume won't be affected.
      </p>
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" size="sm" onClick={onConfirm}>
          <Trash2 size={12} /> Delete
        </Button>
      </div>
    </motion.div>
  </div>
);
