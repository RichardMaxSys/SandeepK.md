"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  Info,
  Download,
  Sparkles,
} from "lucide-react";
import { Button, Badge, cn } from "@/components/ui/base";
import { ScoreChart } from "./charts";

export const ReviewPanel: React.FC<{
  pkg: any;
  onClose: () => void;
  onApprove: (id: number) => void;
}> = ({ pkg, onClose, onApprove }) => {
  const [view, setView] = React.useState<"analysis" | "resume">("analysis");
  const ats = pkg.ats_report || {};

  const riskTone =
    ats.ats_parsing_risk_level === "low"
      ? "success"
      : ats.ats_parsing_risk_level === "medium"
      ? "warning"
      : "danger";

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl bg-canvas-raised border border-line shadow-soft-lg"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-line flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge tone="accent">
                  <Sparkles size={10} />
                  AI Analysis
                </Badge>
                <Badge tone="neutral" className="capitalize">
                  {pkg.status || "ready"}
                </Badge>
              </div>
              <h2 className="text-xl font-semibold text-ink tracking-tight">
                {pkg.job_title}
              </h2>
              <p className="text-sm text-ink-muted mt-0.5">
                {pkg.job_company} · Application Review
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-white/5 border border-line"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 flex gap-2 border-b border-line">
            <TabButton active={view === "analysis"} onClick={() => setView("analysis")}>
              Intelligence Analysis
            </TabButton>
            <TabButton active={view === "resume"} onClick={() => setView("resume")}>
              Resume Preview
            </TabButton>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-canvas">
            {view === "analysis" ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <CardShell className="lg:col-span-2">
                    <SectionTitle icon={<Info size={14} />}>
                      Fit Score Explanation
                    </SectionTitle>
                    <p className="text-sm text-ink leading-relaxed italic">
                      {ats.fit_score_explanation ||
                        "No explanation available for this role yet."}
                    </p>

                    <div className="mt-6 pt-6 border-t border-line">
                      <SectionTitle>Recruiter Insights</SectionTitle>
                      <p className="text-sm text-ink-muted leading-relaxed">
                        {ats.recruiter_notes ||
                          "No recruiter notes generated."}
                      </p>
                    </div>
                  </CardShell>

                  <CardShell>
                    <div className="flex flex-col items-center">
                      <ScoreChart score={ats.score || 0} label="Overall Match" />
                    </div>
                    <div className="w-full mt-6 space-y-2.5 pt-6 border-t border-line">
                      <Stat
                        label="Readability"
                        value={`${ats.readability_score ?? 0}%`}
                      />
                      <Stat
                        label="Strength"
                        value={`${ats.resume_strength_score ?? 0}%`}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-muted">Parser Risk</span>
                        <Badge tone={riskTone} className="uppercase">
                          {ats.ats_parsing_risk_level || "Unknown"}
                        </Badge>
                      </div>
                    </div>
                  </CardShell>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CardShell>
                    <SectionTitle
                      icon={<CheckCircle size={14} className="text-success" />}
                    >
                      Matched Keywords
                    </SectionTitle>
                    <div className="flex flex-wrap gap-1.5">
                      {ats.present_keywords?.length ? (
                        ats.present_keywords.map((kw: string) => (
                          <span
                            key={kw}
                            className="text-2xs font-medium px-2 py-1 rounded-md bg-success-soft text-success border border-success/20"
                          >
                            {kw}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-ink-subtle">No matches yet.</p>
                      )}
                    </div>
                  </CardShell>

                  <CardShell>
                    <SectionTitle
                      icon={<AlertTriangle size={14} className="text-danger" />}
                    >
                      Missing Keywords
                    </SectionTitle>
                    <div className="flex flex-wrap gap-1.5">
                      {ats.missing_keywords?.length ? (
                        ats.missing_keywords.map((kw: string) => (
                          <span
                            key={kw}
                            className="text-2xs font-medium px-2 py-1 rounded-md bg-danger-soft text-danger border border-danger/20"
                          >
                            {kw}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-ink-subtle">
                          You&apos;re covering all the important keywords.
                        </p>
                      )}
                    </div>
                  </CardShell>
                </div>

                {ats.is_potential_scam && (
                  <div className="rounded-2xl border border-danger/30 bg-danger-soft p-4 flex gap-3 items-start text-danger">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Potential Scam Detected</p>
                      <p className="text-xs mt-1 text-danger/80">
                        This job listing has indicators of being fraudulent or a
                        &quot;ghost job&quot;. Proceed with caution.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl bg-canvas-raised border border-line p-8 font-mono text-xs text-ink leading-relaxed whitespace-pre-wrap shadow-inner">
                {pkg.tailored_resume_text ||
                  "Resume tailoring in progress..."}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-line flex items-center justify-between gap-4 bg-canvas-subtle">
            <div className="flex items-center gap-2 text-2xs text-ink-muted">
              <FileText size={12} />
              <span>Last updated just now</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm">
                <Download size={14} />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={() => onApprove(pkg.id)}
              >
                <CheckCircle size={14} />
                Approve & Mark Ready
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Local helpers                                 */
/* -------------------------------------------------------------------------- */

const CardShell: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = ({ className, ...props }) => (
  <div
    className={cn(
      "rounded-2xl bg-canvas-raised border border-line p-5 shadow-soft",
      className,
    )}
    {...props}
  />
);

const SectionTitle: React.FC<
  React.HTMLAttributes<HTMLHeadingElement> & { icon?: React.ReactNode }
> = ({ icon, children, className, ...props }) => (
  <h3
    className={cn(
      "text-2xs font-semibold uppercase tracking-wider text-ink-subtle flex items-center gap-1.5 mb-3",
      className,
    )}
    {...props}
  >
    {icon}
    {children}
  </h3>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-ink-muted">{label}</span>
    <span className="text-ink font-semibold tabular-nums">{value}</span>
  </div>
);

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative px-4 py-2.5 text-sm font-medium transition-colors",
      active ? "text-ink" : "text-ink-muted hover:text-ink",
    )}
  >
    {children}
    {active && (
      <motion.span
        layoutId="reviewTab"
        className="absolute -bottom-px left-0 right-0 h-0.5 bg-accent-500"
      />
    )}
  </button>
);
