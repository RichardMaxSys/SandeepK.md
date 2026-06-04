"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Upload, FileText, AlertCircle, AlertTriangle, CheckCircle2, X, Sparkles, Lightbulb,
  Mail, Phone, MapPin, ListChecks, TrendingUp, Info, ArrowRight,
} from "lucide-react";
import { Card, Button, Badge, cn } from "@/components/ui/base";
import { runAts, GENERIC_PHRASES, type AtsReport } from "@/lib/ats-engine";
import { useResume } from "@/lib/resume-store";

export const CheckView: React.FC = () => {
  const { resume } = useResume();
  const [report, setReport] = React.useState<AtsReport>(() => runAts(resume));
  const [jdDraft, setJdDraft] = React.useState<string>("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [jdActive, setJdActive] = React.useState<boolean>(false);

  // Recompute on resume change (live)
  React.useEffect(() => {
    if (!jdActive) setReport(runAts(resume));
  }, [resume, jdActive]);

  const runWithJd = () => {
    if (!jdDraft.trim()) { setJdActive(false); setReport(runAts(resume)); return; }
    setAnalyzing(true);
    setJdActive(true);
    setTimeout(() => {
      setReport(runAts(resume, jdDraft));
      setAnalyzing(false);
    }, 600);
  };

  const allIssues = React.useMemo(() => {
    const out: { dimension: string; severity: "high" | "medium" | "low"; message: string }[] = [];
    for (const d of Object.values(report.dimensions)) {
      for (const f of d.findings) {
        out.push({ dimension: d.label, severity: f.includes("very") || f.includes("No ") || f.includes("Missing") ? "high" : "medium", message: f });
      }
    }
    return out;
  }, [report]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-2xs font-medium uppercase tracking-wider text-accent-300">Check</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">ATS Check</h1>
        <p className="mt-1 text-sm text-ink-muted max-w-2xl">
          We measure four signals that real ATS systems use as proxies: parseability, keyword match, formatting hygiene, and content quality.{" "}
          <span className="text-ink">No magic number</span> — every dimension tells you exactly what to fix.
        </p>
      </div>

      {/* Optional JD input */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-md bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
            <ListChecks size={13} className="text-accent-300" />
          </div>
          <h2 className="text-sm font-semibold text-ink">Add a job description (optional)</h2>
        </div>
        <p className="text-xs text-ink-muted mb-3">
          Paste the JD and we'll score your keyword match against it. Without a JD we score against a generic tech baseline.
        </p>
        <textarea
          value={jdDraft}
          onChange={(e) => setJdDraft(e.target.value)}
          rows={4}
          placeholder="Paste the job description here…"
          className="w-full px-3 py-2 rounded-lg bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all leading-relaxed resize-y"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-2xs text-ink-subtle">
            {jdActive ? "✓ Scoring against this JD" : `${jdDraft.length} chars`}
          </p>
          <div className="flex gap-2">
            {jdActive && (
              <Button variant="ghost" size="sm" onClick={() => { setJdActive(false); setJdDraft(""); setReport(runAts(resume)); }}>
                Clear
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={runWithJd} loading={analyzing}>
              {analyzing ? "Analyzing…" : jdActive ? "Re-score" : "Score against this JD"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* LEFT: dimension breakdown */}
        <div className="space-y-4">
          {/* Hero score */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-2xs font-medium uppercase tracking-wider text-ink-subtle">Overall ATS Score</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-5xl font-semibold tracking-tight text-ink tabular-nums">{report.overall}</span>
                  <span className="text-ink-subtle">/ 100</span>
                </div>
                <p className="mt-2 text-sm text-ink-muted">
                  {report.overall >= 80 ? "Strong. Ready to apply." :
                   report.overall >= 60 ? "Decent. A few targeted fixes will lift it." :
                   report.overall >= 40 ? "Needs work. Focus on the high-priority issues." :
                   "Significant gaps. Start with parseability."}
                </p>
                <div className="mt-4 flex items-center gap-3 text-2xs text-ink-subtle">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-success" /> {report.quantifiedBullets}/{report.totalBullets} quantified
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> {report.humanizer.genericPhraseCount} generic
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.values(report.dimensions).map((d) => (
                  <DimensionCard key={d.key} dim={d} />
                ))}
              </div>
            </div>
          </Card>

          {/* Findings list */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-ink">What to fix</h2>
                <p className="text-2xs text-ink-muted mt-0.5">
                  {allIssues.length} issue{allIssues.length === 1 ? "" : "s"} — sorted by severity
                </p>
              </div>
              <Badge tone={allIssues.length === 0 ? "success" : "warning"}>
                {allIssues.length === 0 ? "All clear" : `${allIssues.length} open`}
              </Badge>
            </div>

            {allIssues.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-success-soft border border-success/20 mb-3">
                  <CheckCircle2 size={20} className="text-success" />
                </div>
                <p className="text-sm font-medium text-ink">No issues detected</p>
                <p className="text-xs text-ink-muted mt-1">Your resume is in great shape. Go apply!</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {allIssues.map((it, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-line bg-canvas-subtle hover:border-line-strong transition-colors"
                  >
                    <span className={cn(
                      "mt-0.5 h-6 w-6 rounded-md flex items-center justify-center shrink-0 border",
                      it.severity === "high"   && "bg-danger/[0.08] border-danger/20 text-danger",
                      it.severity === "medium" && "bg-amber-500/[0.08] border-amber-500/20 text-amber-300",
                      it.severity === "low"    && "bg-white/5 border-line text-ink-muted",
                    )}>
                      {it.severity === "high" ? <AlertCircle size={12} /> :
                       it.severity === "medium" ? <AlertTriangle size={12} /> :
                       <Info size={12} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink leading-snug">{it.message}</p>
                      <p className="text-2xs text-ink-subtle mt-1">
                        {it.dimension}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </Card>

          {/* Humanizer */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Lightbulb size={13} className="text-amber-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ink">Humanizer Check</h2>
                <p className="text-2xs text-ink-subtle">Generic phrases recruiters see a hundred times a day.</p>
              </div>
            </div>

            {report.humanizer.flaggedPhrases.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No generic phrases detected. Your bullets sound specific and personal.
              </p>
            ) : (
              <div className="space-y-2">
                {report.humanizer.flaggedPhrases.map((p) => (
                  <div key={p.phrase} className="p-3 rounded-lg border border-amber-500/15 bg-amber-500/[0.04]">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-mono font-semibold text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        "{p.phrase}"
                      </span>
                    </div>
                    <p className="text-2xs text-ink-muted mt-2"><span className="text-ink font-medium">Why:</span> {p.why}</p>
                    <p className="text-2xs text-ink-muted mt-1"><span className="text-success font-medium">Instead:</span> {p.better}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-line">
              <p className="text-2xs font-medium uppercase tracking-wider text-ink-subtle mb-2">
                All phrases we check for
              </p>
              <div className="flex flex-wrap gap-1.5">
                {GENERIC_PHRASES.map((g) => (
                  <span key={g.phrase} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-canvas-subtle text-ink-subtle border border-line">
                    {g.phrase}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: dimension detail + positive signals */}
        <aside className="space-y-3">
          {Object.values(report.dimensions).map((d) => (
            <Card key={d.key} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink">{d.label}</h3>
                <ScoreChip score={d.score} />
              </div>
              <p className="text-2xs text-ink-muted leading-relaxed">{d.description}</p>
              {d.positiveSignals.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {d.positiveSignals.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                      <CheckCircle2 size={12} className="text-success shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </aside>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Subcomponents                                 */
/* -------------------------------------------------------------------------- */

const DimensionCard: React.FC<{ dim: { key: string; label: string; score: number; weight: number; description: string } }> = ({ dim }) => {
  const color = dim.score >= 80 ? "text-success" : dim.score >= 60 ? "text-accent-300" : dim.score >= 40 ? "text-amber-300" : "text-danger";
  return (
    <div className="rounded-xl border border-line bg-canvas-subtle p-3">
      <p className="text-2xs font-medium uppercase tracking-wider text-ink-subtle">{dim.label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", color)}>{dim.score}</p>
      <div className="mt-1.5 h-1 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            dim.score >= 80 ? "bg-success" : dim.score >= 60 ? "bg-accent-500" : dim.score >= 40 ? "bg-amber-500" : "bg-danger",
          )}
          style={{ width: `${dim.score}%` }}
        />
      </div>
    </div>
  );
};

const ScoreChip: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 80 ? "success" : score >= 60 ? "accent" : score >= 40 ? "warning" : "danger";
  return <Badge tone={color as any} className="font-mono tabular-nums">{score}</Badge>;
};
