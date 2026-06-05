"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, X, Plus, Copy, Download,
  Briefcase, Building2, Check, RefreshCw, Wand2, ArrowRight, FileSignature, Sparkle,
  Linkedin, Bell, ListChecks, Save,
} from "lucide-react";
import { Card, Button, Badge, cn } from "@/components/ui/base";
import { useResume, BASE_VERSION } from "@/lib/resume-store";
import { VersionSelector } from "@/components/version-selector";
import { runAts } from "@/lib/ats-engine";
import { rewriteResume, generateCoverLetter, rewriteBullet, extractKeywords, compareKeywords, type KeywordAnalysis } from "@/lib/ai-rewrite";

const STORAGE_KEY_JD = "careerai.jd.v1";

const SAMPLE_JD = `Senior Python Developer — TechCorp, Toronto

We're looking for a Senior Python Developer to lead the build-out of our new FastAPI platform. You'll own services end-to-end, from API design through Kubernetes deployment.

What you'll do:
- Design and ship high-throughput Python services
- Lead async pipeline work (we use Celery + Redis heavily)
- Own deployment topology across multiple regions
- Mentor 2-3 mid-level engineers
- Partner with product on technical roadmap

What we're looking for:
- 5+ years building production Python services
- Deep FastAPI experience (Django or Flask also fine)
- Strong PostgreSQL + Redis
- Production Kubernetes experience
- Track record of mentoring engineers
- Excellent written communication

Nice to have:
- gRPC, Kafka, event-driven systems
- Experience with high-traffic systems (1M+ daily requests)
- Open-source contributions

Tech: Python, FastAPI, PostgreSQL, Redis, Docker, Kubernetes, AWS, gRPC, Kafka`;

export const TailorView: React.FC = () => {
  const {
    versions, activeVersionId, setActiveVersion,
    resume, updateSummary, updateExperience, createTailoredVersion, resume: r,
  } = useResume();
  if (!resume || !resume.contact || (!resume.contact.name && resume.experience.length === 0)) {
    return <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-ink-muted text-lg">No resume found.</p>
      <button onClick={() => window.dispatchEvent(new CustomEvent('careerai:navigate', { detail: { tab: 'builder' } }))}
        className="text-accent-500 underline">Build one first →</button>
    </div>
  }
  const [sourceVersionId, setSourceVersionId] = React.useState<string>(BASE_VERSION);
  const [jd, setJd] = React.useState<string>("");
  const [company, setCompany] = React.useState<string>("");
  const [role, setRole] = React.useState<string>("");
  const [hydrated, setHydrated] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<KeywordAnalysis | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [rewrites, setRewrites] = React.useState<Record<string, { before: string; after: string; reason: string; changed: boolean }>>({});
  const [summaryRewrite, setSummaryRewrite] = React.useState<{ before: string; after: string; changed: boolean; reason: string } | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [coverLetter, setCoverLetter] = React.useState<string | null>(null);
  const [generatingLetter, setGeneratingLetter] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [savedToast, setSavedToast] = React.useState<string | null>(null);

  // Default the source version to the base on mount (the user is "starting from base")
  React.useEffect(() => {
    setSourceVersionId(BASE_VERSION);
  }, []);

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_JD) : null;
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setJd(p.jd ?? "");
        setCompany(p.company ?? "");
        setRole(p.role ?? "");
      } catch {}
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY_JD, JSON.stringify({ jd, company, role }));
  }, [jd, company, role, hydrated]);

  const report = React.useMemo(
    () => jd.trim() ? runAts(resume, jd) : null,
    [resume, jd],
  );

  const sourceVersion = versions[sourceVersionId] ?? versions[BASE_VERSION];
  const sourceResume = sourceVersion.data;

  const handleAnalyze = () => {
    if (!jd.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      const text = [
        sourceResume.summary,
        ...sourceResume.experience.flatMap((e) => [e.role, e.company, ...e.bullets]),
        ...sourceResume.skills,
        ...sourceResume.projects.flatMap((p) => [p.name, ...p.bullets, ...p.tech]),
      ].join("\n");
      const a = compareKeywords(jd, text);
      setAnalysis(a);
      setAnalyzing(false);
    }, 400);
  };

  const handleGenerate = () => {
    if (!jd.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const out = rewriteResume({
        summary: sourceResume.summary,
        experienceBullets: sourceResume.experience.flatMap((e) =>
          e.bullets.map((b, i) => ({ id: `${e.id}-${i}`, bullet: b })),
        ),
        jd,
      });
      const map: typeof rewrites = {};
      for (const r of out.experienceBullets) map[r.id] = r;
      setRewrites(map);
      setSummaryRewrite(out.summary);
      setGenerating(false);
    }, 500);
  };

  const handleSaveTailoredVersion = () => {
    if (!jd.trim()) return;
    // Build the new resume data: apply all accepted rewrites to a clone of the source
    const newData = structuredClone(sourceResume);
    // Apply summary rewrite if changed
    if (summaryRewrite?.changed) newData.summary = summaryRewrite.after;
    // Apply bullet rewrites that are still pending acceptance
    for (const [id, rw] of Object.entries(rewrites)) {
      if (!rw.changed) continue;
      const [expId, idxStr] = id.split("-");
      const idx = parseInt(idxStr, 10);
      const exp = newData.experience.find((e) => e.id === expId);
      if (exp) exp.bullets[idx] = rw.after;
    }
    const newId = createTailoredVersion({
      sourceVersionId: sourceVersion.id,
      targetRole: role || "Custom role",
      company,
      jd,
      data: newData,
      matchScoreAtSave: analysis?.score,
    });
    setSavedToast(`Saved as new version. Switched to it.`);
    setTimeout(() => setSavedToast(null), 3000);
    return newId;
  };

  const acceptOne = (id: string) => {
    const rw = rewrites[id];
    if (!rw || !rw.changed) return;
    const [expId, idxStr] = id.split("-");
    const idx = parseInt(idxStr, 10);
    // Apply against the *active* resume (so if a tailored version is selected,
    // rewrites go to that version rather than the base)
    const exp = resume.experience.find((e) => e.id === expId);
    if (!exp) return;
    const next = [...exp.bullets];
    next[idx] = rw.after;
    updateExperience(exp.id, { bullets: next });
    setRewrites((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const acceptSummary = () => {
    if (!summaryRewrite?.changed) return;
    updateSummary(summaryRewrite.after);
    setSummaryRewrite(null);
  };

  const acceptAll = () => {
    for (const id of Object.keys(rewrites)) acceptOne(id);
    if (summaryRewrite) acceptSummary();
  };

  const handleCoverLetter = () => {
    if (!jd.trim()) return;
    setGeneratingLetter(true);
    setTimeout(() => {
      const top = resume.experience[0]?.bullets[0] ?? "";
      const out = generateCoverLetter({
        name: resume.contact.name || "Sandeep K",
        targetRole: role || "this role",
        company: company || "your company",
        jd,
        topBullets: [top],
      });
      setCoverLetter(out);
      setGeneratingLetter(false);
    }, 500);
  };

  const copyLetter = async () => {
    if (!coverLetter) return;
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const fillSample = () => {
    setJd(SAMPLE_JD);
    setCompany("TechCorp");
    setRole("Senior Python Developer");
  };

  const hasRewrites = Object.keys(rewrites).length > 0 || (summaryRewrite && summaryRewrite.changed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-2xs font-medium uppercase tracking-wider text-accent-300">Tailor</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Tailor to a specific job</h1>
          <p className="mt-1 text-sm text-ink-muted max-w-2xl">
            Paste a job description. We'll score your match and rewrite your bullets and summary to fit — without making them generic.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!jd && (
            <Button variant="ghost" size="sm" onClick={fillSample}>
              <Sparkle size={12} /> Use sample JD
            </Button>
          )}
        </div>
      </div>

      {/* Step 1: Source + JD input */}
      <Card className="p-5">
        {/* Source resume dropdown */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-2xs font-medium uppercase tracking-wider text-ink-subtle shrink-0">Use this resume as base</span>
          <select
            value={sourceVersionId}
            onChange={(e) => setSourceVersionId(e.target.value)}
            className="h-8 px-2 rounded-lg bg-canvas-subtle border border-line text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40"
          >
            {Object.values(versions)
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} {v.source === "base" ? "· base" : `· tailored`}
                </option>
              ))}
          </select>
          <span className="text-2xs text-ink-subtle hidden md:inline">
            — changes only affect the new tailored version you save.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px_240px] gap-3 mb-3">
          <div>
            <span className="block text-2xs font-medium uppercase tracking-wider text-ink-subtle mb-1.5">Job description</span>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={6}
              placeholder="Paste the full job description here…"
              className="w-full h-32 px-3 py-2 rounded-lg bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all leading-relaxed resize-y"
            />
          </div>
          <div>
            <span className="block text-2xs font-medium uppercase tracking-wider text-ink-subtle mb-1.5">Role (optional)</span>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Senior Python Developer"
              className="w-full h-9 px-3 rounded-lg bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40"
            />
          </div>
          <div>
            <span className="block text-2xs font-medium uppercase tracking-wider text-ink-subtle mb-1.5">Company (optional)</span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="TechCorp"
              className="w-full h-9 px-3 rounded-lg bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-2xs text-ink-subtle">
            {report ? (
              <>Live match: <span className={cn("font-semibold tabular-nums",
                report.dimensions.keywords.score >= 70 ? "text-success" :
                report.dimensions.keywords.score >= 50 ? "text-accent-300" : "text-amber-300")}>{report.dimensions.keywords.score}%</span></>
            ) : (
              <>{jd.length} characters</>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" onClick={handleAnalyze} disabled={!jd.trim()} loading={analyzing}>
              <ListChecks size={14} />
              {analysis ? "Re-analyze" : "Analyze job description"}
            </Button>
            <Button variant="primary" size="md" onClick={handleGenerate} disabled={!jd.trim()} loading={generating}>
              <Wand2 size={14} />
              {generating ? "Rewriting…" : hasRewrites ? "Regenerate" : "Rewrite for this JD"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Step 1b: Keyword analysis */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
                    <ListChecks size={13} className="text-accent-300" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-ink">Keyword analysis</h2>
                    <p className="text-2xs text-ink-subtle">
                      Match score: <span className={cn("font-semibold tabular-nums",
                        analysis.score >= 70 ? "text-success" :
                        analysis.score >= 50 ? "text-accent-300" : "text-amber-300")}>{analysis.score}%</span>
                      {analysis.required.length > 0 && ` · ${analysis.matched.length} of ${analysis.required.length} required keywords present`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Matched */}
                <div className="rounded-xl border border-success/20 bg-success/[0.04] p-4">
                  <p className="text-2xs font-medium uppercase tracking-wider text-success/90 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={11} /> Matched ({analysis.matched.length})
                  </p>
                  {analysis.matched.length === 0 ? (
                    <p className="text-2xs text-ink-subtle">No matches yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.matched.map((k) => (
                        <span key={k} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-success/10 text-success/90 border border-success/20">{k}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Missing */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                  <p className="text-2xs font-medium uppercase tracking-wider text-amber-300/90 mb-2 flex items-center gap-1.5">
                    <AlertCircle size={11} /> Missing ({analysis.missing.length})
                  </p>
                  {analysis.missing.length === 0 ? (
                    <p className="text-2xs text-ink-subtle">Nothing critical missing.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missing.map((k) => (
                        <span key={k} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/90 border border-amber-500/20">{k}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Extra / nice-to-have */}
                <div className="rounded-xl border border-line bg-canvas-subtle p-4">
                  <p className="text-2xs font-medium uppercase tracking-wider text-ink-muted mb-2 flex items-center gap-1.5">
                    <Sparkle size={11} /> Nice-to-have / extra
                  </p>
                  {analysis.niceToHave.length === 0 && analysis.extra.length === 0 ? (
                    <p className="text-2xs text-ink-subtle">No bonus keywords detected.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.niceToHave.map((k) => (
                        <span key={k} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300/90 border border-sky-500/20">{k}</span>
                      ))}
                      {analysis.extra.slice(0, 8).map((k) => (
                        <span key={k} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-canvas text-ink-subtle border border-line">{k}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-line/60 bg-canvas-subtle/50 p-3 flex items-start gap-2">
                <AlertCircle size={11} className="text-ink-muted shrink-0 mt-0.5" />
                <p className="text-2xs text-ink-muted leading-relaxed">
                  <span className="text-ink font-medium">No fabrication.</span> The rewrite below only reframes what your source resume already says. To add a missing skill, edit the source resume in the Build tab first.
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 2: Rewrites (only when jd present) */}
      <AnimatePresence>
        {hasRewrites && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="space-y-4"
          >
            {/* Banner */}
            <Card className="p-4 bg-gradient-to-br from-accent-500/10 to-canvas-raised border-accent-500/20">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
                  <Sparkles size={16} className="text-accent-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">Rewrites ready for review</p>
                  <p className="text-2xs text-ink-muted">
                    {Object.keys(rewrites).length + (summaryRewrite?.changed ? 1 : 0)} change{Object.keys(rewrites).length !== 1 ? "s" : ""} suggested. Accept what you like, or save the whole thing as a tailored version below.
                  </p>
                </div>
                <Button variant="primary" size="md" onClick={acceptAll}>
                  <Check size={14} />
                  Accept all
                </Button>
              </div>

              {/* Diff & confirmation row */}
              <div className="mt-4 pt-4 border-t border-accent-500/15 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2 text-2xs text-ink-muted">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md border border-danger/15 bg-danger/[0.04] p-2 min-w-[140px]">
                      <p className="text-2xs uppercase tracking-wider text-danger/70 mb-1">Before</p>
                      <p className="text-2xs text-ink-muted line-clamp-2">{summaryRewrite?.before ?? resume.summary}</p>
                    </div>
                    <div className="rounded-md border border-success/20 bg-success/[0.04] p-2 min-w-[140px]">
                      <p className="text-2xs uppercase tracking-wider text-success/80 mb-1">After</p>
                      <p className="text-2xs text-ink line-clamp-2">{summaryRewrite?.after ?? resume.summary}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="primary" size="md" onClick={handleSaveTailoredVersion} disabled={!jd.trim()}>
                    <Save size={14} />
                    Save as tailored version
                  </Button>
                </div>
              </div>

              {/* Saved toast */}
              <AnimatePresence>
                {savedToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="mt-3 rounded-md border border-success/20 bg-success/[0.06] px-3 py-2 text-2xs text-success/90 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={11} /> {savedToast}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Summary rewrite */}
            {summaryRewrite?.changed && (
              <RewriteCard
                label="Summary"
                before={summaryRewrite.before}
                after={summaryRewrite.after}
                reason={summaryRewrite.reason}
                onAccept={acceptSummary}
              />
            )}

            {/* Bullet rewrites */}
            {Object.entries(rewrites).map(([id, rw]) => {
              if (!rw.changed) return null;
              const [expId, idxStr] = id.split("-");
              const exp = resume.experience.find((e) => e.id === expId);
              if (!exp) return null;
              return (
                <RewriteCard
                  key={id}
                  label={`${exp.role} · ${exp.company}`}
                  before={rw.before}
                  after={rw.after}
                  reason={rw.reason}
                  onAccept={() => acceptOne(id)}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 3: Cover Letter */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                <FileSignature size={13} className="text-violet-300" />
              </div>
              <h2 className="text-base font-semibold text-ink">Cover letter</h2>
              <Badge tone="accent" className="ml-1">Bundled</Badge>
            </div>
            <p className="text-2xs text-ink-muted mt-1">
              Generated from your resume + this job description.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {coverLetter && (
              <>
                <Button variant="secondary" size="sm" onClick={copyLetter}>
                  <Copy size={14} /> {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="secondary" size="sm">
                  <Download size={14} /> Download
                </Button>
              </>
            )}
            <Button variant="primary" size="sm" onClick={handleCoverLetter} disabled={!jd.trim()} loading={generatingLetter}>
              <FileSignature size={14} />
              {generatingLetter ? "Generating…" : coverLetter ? "Regenerate" : "Generate cover letter"}
            </Button>
          </div>
        </div>

        {coverLetter ? (
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 rounded-lg bg-canvas-subtle border border-line text-sm text-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all font-mono"
          />
        ) : (
          <div className="rounded-xl border border-dashed border-line p-8 text-center">
            <FileSignature size={28} className="mx-auto text-ink-subtle mb-2" />
            <p className="text-sm font-medium text-ink">No cover letter yet</p>
            <p className="text-xs text-ink-muted mt-1">Paste a JD above, then click "Generate cover letter".</p>
          </div>
        )}
      </Card>

      {/* Phase 2: LinkedIn Optimizer teaser */}
      <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-canvas-raised via-canvas-raised to-sky-500/[0.04] border-sky-500/15">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
            <Linkedin size={22} className="text-sky-300" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge tone="info">Phase 2</Badge>
              <p className="text-2xs font-medium uppercase tracking-wider text-ink-subtle">Coming soon</p>
            </div>
            <h3 className="text-base font-semibold text-ink">LinkedIn Optimizer</h3>
            <p className="text-sm text-ink-muted mt-1 max-w-2xl">
              Paste your LinkedIn About + experience, and we'll score your profile visibility,
              align it with your resume, and rewrite your headline and About for recruiter search.
              Same anti-generic, metric-focused logic as the Tailor tab.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="md">
              <Bell size={14} /> Notify me
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Subcomponents                                 */
/* -------------------------------------------------------------------------- */

const RewriteCard: React.FC<{
  label: string;
  before: string;
  after: string;
  reason: string;
  onAccept: () => void;
}> = ({ label, before, after, reason, onAccept }) => (
  <Card className="p-5">
    <div className="flex items-center justify-between mb-3">
      <div>
        <Badge tone="accent" className="mb-1.5">AI rewrite</Badge>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-2xs text-ink-muted mt-0.5">{reason}</p>
      </div>
      <Button variant="primary" size="sm" onClick={onAccept}>
        <Check size={14} /> Accept
      </Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-xl border border-danger/15 bg-danger/[0.04] p-4">
        <p className="text-2xs font-medium uppercase tracking-wider text-danger/80 mb-2">Before</p>
        <p className="text-sm text-ink-muted leading-relaxed line-through decoration-danger/40">{before}</p>
      </div>
      <div className="rounded-xl border border-success/20 bg-success/[0.04] p-4">
        <p className="text-2xs font-medium uppercase tracking-wider text-success/80 mb-2">After</p>
        <p className="text-sm text-ink leading-relaxed">{after}</p>
      </div>
    </div>
  </Card>
);
