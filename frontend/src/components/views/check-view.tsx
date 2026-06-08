"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  Upload, FileText, AlertCircle, AlertTriangle, CheckCircle2, X, Sparkles, Lightbulb,
  Mail, Phone, MapPin, ListChecks, TrendingUp, Info, ArrowRight, ArrowLeft, Download,
  FileSignature, Wand2, Check, Briefcase,
} from "lucide-react";
import { Card, Button, Badge, cn } from "@/components/ui/base";
import { WeightedBreakdown } from "@/components/ui/weighted-breakdown";
import { runAts, GENERIC_PHRASES, type AtsReport } from "@/lib/ats-engine";
import { useResume, BASE_VERSION } from "@/lib/resume-store";
import { VersionSelector } from "@/components/version-selector";

export const CheckView: React.FC = () => {
  const { resume, versions, activeVersionId, setActiveVersion, versionList } = useResume();
  if (!resume || !resume.contact || (!resume.contact.name && resume.experience.length === 0)) {
    return <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-ink-muted text-lg">No resume found.</p>
      <button onClick={() => window.dispatchEvent(new CustomEvent('resumeelevate:navigate', { detail: { tab: 'builder' } }))}
        className="text-accent-500 underline">Build one first →</button>
    </div>
  }
  const [report, setReport] = React.useState<AtsReport>(() => runAts(resume));
  const [baseReport, setBaseReport] = React.useState<AtsReport | null>(null);
  const [jdDraft, setJdDraft] = React.useState<string>("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [jdActive, setJdActive] = React.useState<boolean>(false);

  const activeVersion = versions[activeVersionId];
  const baseVersion = versions[BASE_VERSION];
  const isTailored = activeVersion?.source === "tailored";
  const savedJd = isTailored ? activeVersion.jd ?? "" : "";

  // Default the JD field to the version's saved JD if tailored
  React.useEffect(() => {
    if (isTailored && savedJd) setJdDraft(savedJd);
  }, [isTailored, savedJd]);

  // Recompute on resume change (live)
  React.useEffect(() => {
    if (!jdActive) setReport(runAts(resume));
  }, [resume, jdActive]);

  // Recompute base comparison when active is a tailored version
  React.useEffect(() => {
    if (isTailored && baseVersion) {
      setBaseReport(runAts(baseVersion.data, jdActive ? jdDraft : savedJd));
    } else {
      setBaseReport(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTailored, activeVersionId, jdActive]);

  const runWithJd = () => {
    if (!jdDraft.trim()) { setJdActive(false); setReport(runAts(resume)); return; }
    setAnalyzing(true);
    setJdActive(true);
    setTimeout(() => {
      setReport(runAts(resume, jdDraft));
      if (isTailored && baseVersion) setBaseReport(runAts(baseVersion.data, jdDraft));
      setAnalyzing(false);
    }, 600);
  };

  // For the "default to most recent tailored" on first mount
  const firstRun = React.useRef(true);
  React.useEffect(() => {
    if (!firstRun.current) return;
    firstRun.current = false;
    const mostRecentTailored = versionList.find((v) => v.source === "tailored");
    if (mostRecentTailored && activeVersion?.source === "base") {
      setActiveVersion(mostRecentTailored.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allIssues = React.useMemo(() => {
    const out: { dimension: string; severity: "high" | "medium" | "low"; message: string }[] = [];
    for (const d of Object.values(report.dimensions)) {
      for (const f of d.findings) {
        out.push({ dimension: d.label, severity: f.includes("very") || f.includes("No ") || f.includes("Missing") ? "high" : "medium", message: f });
      }
    }
    return out;
  }, [report]);

  const suggestionFor = (msg: string): string | null => {
    if (msg.includes("Missing") && msg.includes("keywords")) return "Paste this JD in the Tailor tab to add missing keywords.";
    if (msg.toLowerCase().includes("generic phrase") || msg.toLowerCase().includes("generic")) return "Replace with a concrete achievement in the Build tab.";
    if (msg.includes("weak verb")) return "Swap for action verbs: Built, Led, Reduced, Drove, Launched.";
    if (msg.includes("number") || msg.includes("quantified") || msg.includes("% of bullet")) return "Add a metric: users, revenue, % improvement, or time saved.";
    if (msg.includes("Missing email")) return "Add your email in the Build tab contact section.";
    if (msg.includes("Missing")) return "Add the missing section in the Build tab.";
    if (msg.includes("No experience")) return "Add work experience in the Build tab first.";
    if (msg.includes("No education")) return "Add your education in the Build tab.";
    if (msg.includes("short")) return "Expand with more detail to strengthen this section.";
    if (msg.includes("long") || msg.includes("dense")) return "Condense to 1-2 lines per bullet for readability.";
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-2xs font-medium uppercase tracking-wider text-accent-300">Check</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">ATS Check</h1>
          <p className="mt-1 text-sm text-ink-muted max-w-2xl">
            We measure four signals that real ATS systems use as proxies: parseability, keyword match, formatting hygiene, and content quality.{" "}
            <span className="text-ink">No magic number</span> — every dimension tells you exactly what to fix.
          </p>
        </div>
        <VersionSelector />
      </div>

      {/* Base comparison + version info */}
      {isTailored && baseReport && (
        <Card className="p-5 border-violet-500/20 bg-violet-500/[0.04]">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-md bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
              <Briefcase size={13} className="text-violet-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-ink">Tailored version check</h2>
              <p className="text-2xs text-ink-muted">
                Comparing <span className="text-ink font-medium">{activeVersion?.label}</span> against the base resume
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-line bg-canvas-subtle p-3">
              <p className="text-2xs font-medium uppercase tracking-wider text-ink-subtle">Base</p>
              <p className="text-3xl font-semibold text-ink mt-1 tabular-nums">{baseReport.overall}</p>
            </div>
            <div className="rounded-xl border border-line bg-canvas-subtle p-3">
              <p className="text-2xs font-medium uppercase tracking-wider text-ink-subtle">This version</p>
              <p className={cn(
                "text-3xl font-semibold mt-1 tabular-nums",
                report.overall >= 80 ? "text-success" : report.overall >= 60 ? "text-accent-300" : report.overall >= 40 ? "text-amber-300" : "text-danger",
              )}>{report.overall}</p>
            </div>
            <div className="rounded-xl border border-line bg-canvas-subtle p-3">
              <p className="text-2xs font-medium uppercase tracking-wider text-ink-subtle">Delta</p>
              <p className={cn(
                "text-3xl font-semibold mt-1 tabular-nums",
                report.overall > baseReport.overall ? "text-success" : report.overall < baseReport.overall ? "text-danger" : "text-ink-muted",
              )}>
                {report.overall > baseReport.overall ? "+" : ""}{report.overall - baseReport.overall}
              </p>
            </div>
          </div>

          {/* Per-dimension improvement list */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.values(report.dimensions).map((d) => {
              const baseDim = baseReport.dimensions[d.key];
              const delta = d.score - baseDim.score;
              if (delta === 0 && d.score < 80) {
                return (
                  <div key={d.key} className="flex items-center gap-2 text-2xs px-2.5 py-1.5 rounded-md border border-line bg-canvas-subtle/50 text-ink-muted">
                    <span className="text-ink-muted tabular-nums w-4 text-center">·</span>
                    <span className="flex-1">{d.label}: no change ({d.score})</span>
                  </div>
                );
              }
              if (delta > 0) {
                return (
                  <div key={d.key} className="flex items-center gap-2 text-2xs px-2.5 py-1.5 rounded-md border border-success/20 bg-success/[0.04] text-success/90">
                    <span className="font-semibold tabular-nums w-4 text-center">+{delta}</span>
                    <span className="flex-1 text-ink">{d.label} improved ({baseDim.score} → {d.score})</span>
                  </div>
                );
              }
              if (delta < 0) {
                return (
                  <div key={d.key} className="flex items-center gap-2 text-2xs px-2.5 py-1.5 rounded-md border border-danger/20 bg-danger/[0.04] text-danger/90">
                    <span className="font-semibold tabular-nums w-4 text-center">{delta}</span>
                    <span className="flex-1 text-ink">{d.label} dropped ({baseDim.score} → {d.score})</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </Card>
      )}

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

              <WeightedBreakdown dims={Object.values(report.dimensions)} overall={report.overall} />
            </div>
          </Card>

          {/* Mobile dimension details (positive signals visible early) */}
          <div className="lg:hidden space-y-3">
            {Object.values(report.dimensions).map((d) => (
              <Card key={d.key} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-ink">{d.label}</h3>
                  <Badge tone={
                    d.score >= 80 ? "success" : d.score >= 60 ? "accent" : d.score >= 40 ? "warning" : "danger"
                  } className="font-mono tabular-nums">{d.score}</Badge>
                </div>
                <p className="text-2xs text-ink-muted leading-relaxed">{d.description}</p>
                {d.positiveSignals.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {d.positiveSignals.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-ink-muted">
                        <CheckCircle2 size={11} className="text-success shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>

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
                      <p className="text-2xs text-ink-subtle mt-1">{it.dimension}</p>
                      {(() => {
                        const tip = suggestionFor(it.message);
                        return tip ? (
                          <p className="text-2xs text-accent-300 mt-1.5 flex items-center gap-1">
                            <ArrowRight size={10} className="shrink-0" />
                            {tip}
                          </p>
                        ) : null;
                      })()}
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

        {/* RIGHT: dimension detail + positive signals (desktop only) */}
        <aside className="hidden lg:block space-y-3">
          {Object.values(report.dimensions).map((d) => (
            <Card key={d.key} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink">{d.label}</h3>
                <Badge tone={
                  d.score >= 80 ? "success" : d.score >= 60 ? "accent" : d.score >= 40 ? "warning" : "danger"
                } className="font-mono tabular-nums">{d.score}</Badge>
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

      {/* Final CTA: Go back to Tailor OR Download */}
      <Card className="p-5 bg-gradient-to-br from-canvas-raised via-canvas-raised to-accent-500/[0.04] border-accent-500/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-10 w-10 rounded-xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center shrink-0">
              {report.overall >= 70 ? <CheckCircle2 size={18} className="text-success" /> : <Wand2 size={18} className="text-accent-300" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">
                {report.overall >= 70
                  ? "This version is checked and ready to submit."
                  : "Score is below 70. A few targeted rewrites would lift it."}
              </h3>
              <p className="text-xs text-ink-muted mt-1 max-w-2xl">
                {report.overall >= 70
                  ? `Download the ATS-optimized PDF/DOCX using the exact content that was just checked.`
                  : `Switch back to the Tailor tab to rewrite specific bullets, or jump to the issues above and fix them in the Build tab.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {report.overall < 70 && (
              <Button variant="secondary" size="md" onClick={() => {
                // Switch to the base resume + navigate user to Tailor with the same JD pre-filled
                setActiveVersion(BASE_VERSION);
                // Use sessionStorage so the Tailor tab can read the JD
                if (jdActive && jdDraft) sessionStorage.setItem("resumeelevate.tailor.jd", jdDraft);
                // Trigger tab change via a custom event
                window.dispatchEvent(new CustomEvent("resumeelevate:navigate", { detail: { tab: "tailor" } }));
              }}>
                <ArrowLeft size={14} /> Go back to Tailor
              </Button>
            )}
            <span className="text-2xs text-ink-subtle flex items-center gap-1">
              <Download size={11} /> PDF export — next patch
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Subcomponents                                 */
/* -------------------------------------------------------------------------- */

// WeightedBreakdown extracted to src/components/ui/weighted-breakdown.tsx
