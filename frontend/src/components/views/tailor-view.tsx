"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, CheckCircle2, AlertTriangle, AlertCircle, Copy, Download,
  Check, Wand2, FileSignature, Sparkle, Eye, EyeOff,
  Linkedin, Bell, ListChecks, Save,
} from "lucide-react";
import { Card, Button, Badge, cn } from "@/components/ui/base";
import { useResume, BASE_VERSION } from "@/lib/resume-store";
import { runAts } from "@/lib/ats-engine";
import { rewriteResumeWithLlm, generateCoverLetter, compareKeywords, type KeywordAnalysis, type RewriteSource, type LlmRewriteResult } from "@/lib/ai-rewrite";
import { usePdfExport } from "@/components/builder/use-pdf-export";
import { getTemplate, TEMPLATES } from "@/lib/templates";
import { useAuth, authHeaders } from "@/lib/auth-store";

const STORAGE_KEY_JD = "resumeelevate.jd.v1";

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

const BACKEND_URL =
  typeof window !== "undefined" && (window as any).__BACKEND_URL
    ? (window as any).__BACKEND_URL
    : "http://localhost:8000";

/* -------------------------------------------------------------------------- */
/*                              Word diff helper                              */
/* -------------------------------------------------------------------------- */

function wordDiff(before: string, after: string): React.ReactNode {
  const bSet = new Set(before.split(/\s+/).map((w) => w.toLowerCase()));
  return after.split(/(\s+)/).map((word, i) => {
    if (/^\s+$/.test(word)) return word;
    return bSet.has(word.toLowerCase())
      ? <span key={i}>{word}</span>
      : <mark key={i} className="bg-yellow-100 dark:bg-yellow-900 rounded px-0.5">{word}</mark>;
  });
}

/* -------------------------------------------------------------------------- */
/*                          Bullet meta (index tracking)                      */
/* -------------------------------------------------------------------------- */

interface BulletMeta {
  index: number;
  type: "summary" | "experience" | "project";
  sectionLabel: string;
  expIndex: number;
  bulletIndex: number;
}

/* -------------------------------------------------------------------------- */
/*                              Main component                                */
/* -------------------------------------------------------------------------- */

export const TailorView: React.FC = () => {
  const {
    versions,
    resume, createTailoredVersion,
  } = useResume();
  const { token, user, isPro, rewritesRemaining, refreshUser } = useAuth();

  if (!resume || !resume.contact || (!resume.contact.name && resume.experience.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-ink-muted text-lg">No resume found.</p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("resumeelevate:navigate", { detail: { tab: "builder" } }))}
          className="text-accent-500 underline"
        >
          Build one first →
        </button>
      </div>
    );
  }

  /* ── Inputs ─────────────────────────────────────────────────────────── */
  const [sourceVersionId, setSourceVersionId] = React.useState<string>(BASE_VERSION);
  const [jd, setJd] = React.useState<string>("");
  const [company, setCompany] = React.useState<string>("");
  const [role, setRole] = React.useState<string>("");
  const [hydrated, setHydrated] = React.useState(false);

  /* ── Keyword analysis ───────────────────────────────────────────────── */
  const [analysis, setAnalysis] = React.useState<KeywordAnalysis | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);

  /* ── Rewrite results (flat array, indexed by bulletMeta) ────────────── */
  const [rewriteResults, setRewriteResults] = React.useState<LlmRewriteResult[]>([]);
  const bulletMetaRef = React.useRef<BulletMeta[]>([]);
  const [rewriting, setRewriting] = React.useState(false);

  /* ── Per-bullet accept / reject ─────────────────────────────────────── */
  const [acceptedIndices, setAcceptedIndices] = React.useState<Set<number>>(new Set());
  const [rejectedIndices, setRejectedIndices] = React.useState<Set<number>>(new Set());

  /* ── Save state ──────────────────────────────────────────────────────── */
  const [savedVersionId, setSavedVersionId] = React.useState<string | null>(null);
  const [savedToast, setSavedToast] = React.useState<string | null>(null);

  /* ── DOWNLOAD (lazy — usePdfExport is a hook, call at top level) ────── */
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const { generate: generatePdf, isGenerating: generatingPdf } = usePdfExport({
    onSuccess: (filename) => {
      setDownloadError(null);
    },
    onError: (e) => {
      setDownloadError(String(e));
    },
  });

  /* ── ATS check ──────────────────────────────────────────────────────── */
  const [atsLoading, setAtsLoading] = React.useState(false);
  const [atsResult, setAtsResult] = React.useState<any>(null);

  /* ── Cover letter ───────────────────────────────────────────────────── */
  const [coverLetter, setCoverLetter] = React.useState<string | null>(null);
  const [generatingLetter, setGeneratingLetter] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  /* ── LinkedIn notify ──────────────────────────────────────────────── */
  const [notifyLinkedIn, setNotifyLinkedIn] = React.useState<boolean | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  /* ────────────────────────────────────────────────────────────────────── */
  /*                               Effects                                 */
  /* ────────────────────────────────────────────────────────────────────── */

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
      } catch {
        /* ignore corrupt localStorage */
      }
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY_JD, JSON.stringify({ jd, company, role }));
  }, [jd, company, role, hydrated]);

  /* ── Live ATS report (for the input widget only) ────────────────────── */
  const report = React.useMemo(() => (jd.trim() ? runAts(resume, jd) : null), [resume, jd]);

  const sourceVersion = versions[sourceVersionId] ?? versions[BASE_VERSION];
  const sourceResume = sourceVersion.data;

  /* ────────────────────────────────────────────────────────────────────── */
  /*                          Handler functions                             */
  /* ────────────────────────────────────────────────────────────────────── */

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

  /* ──────────────────────────────────────────────────────────────────── */
  /*  Generate rewrites: extract bullets + meta → call LLM → store flat   */
  /* ──────────────────────────────────────────────────────────────────── */

  const handleGenerate = async () => {
    if (!jd.trim()) return;

    // Auth gate — must be logged in for LLM rewrite
    if (!user) {
      window.dispatchEvent(new CustomEvent("resumeelevate:open-auth"));
      return;
    }
    if (!isPro && rewritesRemaining <= 0) {
      setError("You've used all 3 free AI rewrites. Upgrade to Pro for unlimited access.");
      return;
    }

    setRewriting(true);
    setRewriteResults([]);
    setAcceptedIndices(new Set());
    setRejectedIndices(new Set());
    setSavedVersionId(null);
    setError(null);
    setDownloadError(null);
    setAtsResult(null);

    // Build flat bullet arrays + meta
    const meta: BulletMeta[] = [];
    const bullets: string[] = [];
    const sectionLabels: string[] = [];

    const push = (txt: string, type: BulletMeta["type"], label: string, expIdx: number, bulletIdx: number) => {
      const idx = bullets.length;
      bullets.push(txt);
      sectionLabels.push(label);
      meta.push({ index: idx, type, sectionLabel: label, expIndex: expIdx, bulletIndex: bulletIdx });
    };

    if (sourceResume.summary?.trim()) {
      push(sourceResume.summary, "summary", "Summary", -1, -1);
    }

    sourceResume.experience.forEach((exp, ei) => {
      const label = `${exp.role} · ${exp.company}`;
      exp.bullets.forEach((b, bi) => push(b, "experience", label, ei, bi));
    });

    sourceResume.projects.forEach((proj, pi) => {
      const label = `Project: ${proj.name}`;
      proj.bullets.forEach((b, bi) => push(b, "project", label, pi, bi));
    });

    if (bullets.length === 0) {
      setError("No bullets found. Add experience in the Build tab first.");
      setRewriting(false);
      return;
    }

    bulletMetaRef.current = meta;

    try {
      // rewriteResumeWithLlm expects { summary, experienceBullets: {id, bullet}[], jd }
      // We'll send the summary as a single "experience bullet" so the API handles it,
      // then reconstruct which result maps to summary vs regular bullets.
      const experienceBullets = meta
        .filter((m) => m.type === "experience" || m.type === "project")
        .map((m) => ({
          id: `b${m.index}`,
          bullet: bullets[m.index],
        }));

      const summaryBullet = meta.find((m) => m.type === "summary");
      const out = await rewriteResumeWithLlm(
        {
          summary: summaryBullet ? bullets[summaryBullet.index] : undefined,
          experienceBullets,
          jd,
        },
      );

      // Reconstruct flat results array matching bulletMeta
      const results: LlmRewriteResult[] = [];
      let bulletIdx = 0;

      for (let i = 0; i < meta.length; i++) {
        const m = meta[i];
        if (m.type === "summary" && out.summary) {
          results.push(out.summary);
        } else if (m.type === "experience" || m.type === "project") {
          const llm = out.experienceBullets[bulletIdx];
          if (llm) {
            results.push(llm);
          } else {
            // Fallback: return original unchanged
            results.push({
              before: bullets[i],
              after: bullets[i],
              reason: "No rewrite returned",
              changed: false,
              source: "deterministic",
            });
          }
          bulletIdx++;
        }
      }

      setRewriteResults(results);
    } catch (err) {
      console.warn("[tailor] LLM rewrite threw, falling back to deterministic", err);
      // Per-item fallback: return originals
      const fallback: LlmRewriteResult[] = meta.map((m) => ({
        before: bullets[m.index],
        after: bullets[m.index],
        reason: "",
        changed: false,
        source: "deterministic" as RewriteSource,
      }));
      setRewriteResults(fallback);
    } finally {
      setRewriting(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────────── */
  /*  Per-bullet accept / reject                                          */
  /* ──────────────────────────────────────────────────────────────────── */

  const acceptBullet = (index: number) => {
    setAcceptedIndices((prev) => new Set(prev).add(index));
    setRejectedIndices((prev) => {
      const s = new Set(prev);
      s.delete(index);
      return s;
    });
  };

  const rejectBullet = (index: number) => {
    setRejectedIndices((prev) => new Set(prev).add(index));
    setAcceptedIndices((prev) => {
      const s = new Set(prev);
      s.delete(index);
      return s;
    });
  };

  const acceptAll = () => {
    setAcceptedIndices(new Set(rewriteResults.map((_, i) => i)));
    setRejectedIndices(new Set());
  };

  /** Number of accept/reject decisions made */
  const decidedCount = acceptedIndices.size + rejectedIndices.size;
  const totalCount = rewriteResults.length;
  const allDecided = totalCount > 0 && decidedCount >= totalCount;

  /* ──────────────────────────────────────────────────────────────────── */
  /*  Save tailored version — apply only accepted bullets                  */
  /* ──────────────────────────────────────────────────────────────────── */

  const handleSave = () => {
    if (!jd.trim()) return;
    const meta = bulletMetaRef.current;
    const newData = structuredClone(sourceResume);

    acceptedIndices.forEach((idx) => {
      const m = meta[idx];
      const r = rewriteResults[idx];
      if (!r || !m) return;
      const newText = r.after;
      if (!newText || !r.changed) return;

      if (m.type === "summary") {
        newData.summary = newText;
      } else if (m.type === "experience") {
        const exp = newData.experience[m.expIndex];
        if (exp && exp.bullets[m.bulletIndex] !== undefined) {
          exp.bullets[m.bulletIndex] = newText;
        }
      } else if (m.type === "project") {
        const proj = newData.projects[m.expIndex];
        if (proj && proj.bullets[m.bulletIndex] !== undefined) {
          proj.bullets[m.bulletIndex] = newText;
        }
      }
    });

    const newId = createTailoredVersion({
      sourceVersionId: sourceVersion.id,
      targetRole: role || "Custom role",
      company,
      jd,
      data: newData,
      matchScoreAtSave: analysis?.score,
    });
    setSavedVersionId(newId);
    setSavedToast(`Saved as new version · ${acceptedIndices.size} change${acceptedIndices.size !== 1 ? "s" : ""} applied`);
    setTimeout(() => setSavedToast(null), 3500);
  };

  /* ──────────────────────────────────────────────────────────────────── */
  /*  Download the saved version as PDF                                    */
  /* ──────────────────────────────────────────────────────────────────── */

  const savedVersion = savedVersionId ? versions[savedVersionId] : null;
  // Use the default template for export
  const defaultTemplate = React.useMemo(() => getTemplate("modern-minimal") ?? TEMPLATES[0], []);

  const handleDownload = async () => {
    if (!savedVersion) return;
    try {
      await generatePdf({
        resume: savedVersion.data,
        template: defaultTemplate,
        watermark: !isPro,
      });
    } catch {
      // error handled by usePdfExport's onError
    }
  };

  /* ──────────────────────────────────────────────────────────────────── */
  /*  ATS check — runs on the SAVED version data                          */
  /* ──────────────────────────────────────────────────────────────────── */

  const handleAtsCheck = async () => {
    if (!jd.trim() || !savedVersion) return;
    setAtsLoading(true);
    setAtsResult(null);
    try {
      const parts: string[] = [];
      if (savedVersion.data.summary) parts.push(savedVersion.data.summary);
      savedVersion.data.experience.forEach((exp) => {
        parts.push(`${exp.role} at ${exp.company} (${exp.start}–${exp.end})`);
        parts.push(...exp.bullets);
      });
      savedVersion.data.education.forEach((edu) => {
        parts.push(`${edu.degree} ${edu.field}, ${edu.school} (${edu.start}–${edu.end})`);
      });
      parts.push("Skills: " + savedVersion.data.skills.join(", "));
      const resumeText = parts.filter(Boolean).join("\n\n");

      const res = await fetch(`${BACKEND_URL}/api/ats/analyze`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ job_description: jd, resume_text: resumeText }),
      });
      if (res.status === 403) {
        const data = await res.json();
        const msg = data.detail?.message ?? "Upgrade to Pro to continue.";
        setAtsResult({ error: msg });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAtsResult(await res.json());
      // Refresh user to update rewrites_used counter
      refreshUser();
    } catch (err) {
      console.warn("[tailor] ATS check failed", err);
      setAtsResult({ error: "ATS check unavailable. Try again later." });
    } finally {
      setAtsLoading(false);
    }
  };

  /* ── Cover letter ──────────────────────────────────────────────────── */

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

  const downloadCoverLetter = () => {
    if (!coverLetter) return;
    const blob = new Blob([coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${company || "company"}-${role || "role"}.txt`.replace(/[^a-z0-9.-]/gi, "-").toLowerCase();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const fillSample = () => {
    setJd(SAMPLE_JD);
    setCompany("TechCorp");
    setRole("Senior Python Developer");
  };

  /* ── Group rewrite results by section for display ──────────────────── */

  const grouped = React.useMemo(() => {
    const map = new Map<string, Array<{ result: LlmRewriteResult; meta: BulletMeta; index: number }>>();
    rewriteResults.forEach((result, i) => {
      const m = bulletMetaRef.current[i];
      const label = m?.sectionLabel ?? "Resume";
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push({ result, meta: m!, index: i });
    });
    return Array.from(map.entries());
  }, [rewriteResults]);

  const hasRewrites = rewriteResults.length > 0;

  /* ── Live preview of assembled resume with accepted changes ─────────── */
  const [showPreview, setShowPreview] = React.useState(false);

  const changedIndices = React.useMemo(() => {
    const set = new Set<number>();
    acceptedIndices.forEach((idx) => {
      const r = rewriteResults[idx];
      if (r?.changed) set.add(idx);
    });
    return set;
  }, [acceptedIndices, rewriteResults]);

  const previewData = React.useMemo(() => {
    if (!hasRewrites) return null;
    const meta = bulletMetaRef.current;
    const assembled = {
      summary: sourceResume.summary,
      experience: sourceResume.experience.map((e) => ({
        ...e,
        bullets: [...e.bullets],
      })),
      projects: sourceResume.projects.map((p) => ({
        ...p,
        bullets: [...p.bullets],
      })),
    };

    acceptedIndices.forEach((idx) => {
      const m = meta[idx];
      const r = rewriteResults[idx];
      if (!r || !m) return;
      const text = r.after;
      if (!text) return;

      if (m.type === "summary") {
        assembled.summary = text;
      } else if (m.type === "experience") {
        const exp = assembled.experience[m.expIndex];
        if (exp && exp.bullets[m.bulletIndex] !== undefined) {
          exp.bullets[m.bulletIndex] = text;
        }
      } else if (m.type === "project") {
        const proj = assembled.projects[m.expIndex];
        if (proj && proj.bullets[m.bulletIndex] !== undefined) {
          proj.bullets[m.bulletIndex] = text;
        }
      }
    });

    return assembled;
  }, [hasRewrites, acceptedIndices, sourceResume, rewriteResults]);

  /* ────────────────────────────────────────────────────────────────────── */
  /*                               Render                                   */
  /* ────────────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-2xs font-medium uppercase tracking-wider text-accent-300">Tailor</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Tailor to a specific job</h1>
          <p className="mt-1 text-sm text-ink-muted max-w-2xl">
            Paste a job description. We'll score your match and rewrite your bullets to fit — without making them generic.
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

      {/* ── Step 1: Source + JD input ──────────────────────────────────── */}
      <Card className="p-5">
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
                  {v.label} {v.source === "base" ? "· base" : "· tailored"}
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
            <Button variant="primary" size="md" onClick={handleGenerate} disabled={!jd.trim() || rewriting} loading={rewriting}>
              <Wand2 size={14} />
              {rewriting ? "Rewriting…" : hasRewrites ? "Regenerate" : "Rewrite for this JD"}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Keyword analysis ────────────────────────────────────────────── */}
      <AnimatePresence>
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
                    <ListChecks size={13} className="text-accent-300" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-ink">Keyword analysis</h2>
                    <p className="text-2xs text-ink-subtle">
                      Match score:{" "}
                      <span className={cn("font-semibold tabular-nums",
                        analysis.score >= 70 ? "text-success" :
                        analysis.score >= 50 ? "text-accent-300" : "text-amber-300")}>{analysis.score}%</span>
                      {analysis.required.length > 0 && ` · ${analysis.matched.length} of ${analysis.required.length} required keywords present`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <div className="rounded-xl border border-line bg-canvas-subtle p-4">
                  <p className="text-2xs font-medium uppercase tracking-wider text-ink-muted mb-2 flex items-center gap-1.5">
                    <Sparkle size={11} /> Extra
                  </p>
                  {analysis.extra.length === 0 ? (
                    <p className="text-2xs text-ink-subtle">No extra keywords.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.extra.slice(0, 8).map((k) => (
                        <span key={k} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-canvas text-ink-subtle border border-line">{k}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 flex items-start gap-2">
          <AlertCircle size={12} className="text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-danger/90">{error}</p>
        </div>
      )}

      {/* ── Step 2: Rewrite results (grouped by section) ───────────────── */}
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
                    {totalCount} bullet{totalCount !== 1 ? "s" : ""} · {decidedCount}/{totalCount} reviewed
                    {allDecided && " · all reviewed"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {previewData && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview((v) => !v)}
                      aria-expanded={showPreview}
                    >
                      {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span className="hidden sm:inline">{showPreview ? "Hide preview" : "Show preview"}</span>
                    </Button>
                  )}
                  <Button variant="primary" size="md" onClick={acceptAll} disabled={allDecided}>
                    <Check size={14} />
                    Accept all
                  </Button>
                </div>
              </div>

              {/* Save button row */}
              <div className="mt-4 pt-4 border-t border-accent-500/15 flex items-center justify-end gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  disabled={!jd.trim() || !hasRewrites || acceptedIndices.size === 0}
                >
                  <Save size={14} />
                  Save as tailored version ({acceptedIndices.size} accepted)
                </Button>
              </div>

              {/* Saved toast + Download + ATS Check */}
              <AnimatePresence>
                {savedToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="mt-3 space-y-3"
                  >
                    <div className="rounded-md border border-success/20 bg-success/[0.06] px-3 py-2 text-2xs text-success/90 flex items-center gap-1.5">
                      <CheckCircle2 size={11} /> {savedToast}
                    </div>
                    {savedVersion && (
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={handleDownload} loading={generatingPdf}>
                          <Download size={14} />
                          {generatingPdf ? "Generating PDF…" : "Download PDF"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleAtsCheck}
                          loading={atsLoading}
                        >
                          <ListChecks size={14} />
                          {atsLoading ? "Analyzing…" : atsResult ? "Re-run ATS check" : "Run ATS check"}
                        </Button>
                      </div>
                    )}
                    {downloadError && (
                      <p className="text-2xs text-danger/90">{downloadError}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* ── Live tailored resume preview ── */}
            <AnimatePresence>
              {showPreview && previewData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <Card className="p-5 border-accent-500/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
                          <Eye size={13} className="text-accent-300" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-ink">Tailored resume preview</h3>
                          <p className="text-2xs text-ink-muted">
                            Assembled from accepted rewrites &middot; {changedIndices.size} of {totalCount} bullet{totalCount !== 1 ? "s" : ""} changed
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="sm:hidden">
                        <EyeOff size={14} /> Hide
                      </Button>
                    </div>
                    <TailoredPreview
                      resume={sourceResume}
                      previewData={previewData}
                      changedBullets={changedIndices}
                      meta={bulletMetaRef.current}
                    />
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grouped diff cards */}
            {grouped.map(([section, items]) => (
              <div key={section}>
                <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-3 px-1">
                  {section}
                </h3>
                {items.map(({ result, meta: m, index }) => {
                  const isAccepted = acceptedIndices.has(index);
                  const isRejected = rejectedIndices.has(index);
                  const beforeText = result.before || rewriteResults[index]?.before || "";
                  const afterText = result.after || rewriteResults[index]?.after || beforeText;
                  const changed = result.changed && beforeText !== afterText;

                  return (
                    <Card
                      key={index}
                      className={cn("p-4 mb-3 transition-colors",
                        isAccepted && "border-success/40 bg-success/[0.03]",
                        isRejected && "opacity-50",
                      )}
                    >
                      {/* Header row: source badge + status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {result.source === "llm" ? (
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">✨ AI</span>
                          ) : (
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">⚡ Local</span>
                          )}
                          {isAccepted && <span className="text-xs text-success font-medium">✓ Accepted</span>}
                          {isRejected && <span className="text-xs text-ink-subtle">Original kept</span>}
                        </div>
                      </div>

                      {/* Before / After diff */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-danger/15 bg-danger/[0.04] p-4">
                          <p className="text-2xs font-medium uppercase tracking-wider text-danger/80 mb-2">Before</p>
                          <p className="text-sm text-ink-muted leading-relaxed line-through decoration-danger/40">{beforeText}</p>
                        </div>
                        <div className="rounded-xl border border-success/20 bg-success/[0.04] p-4">
                          <p className="text-2xs font-medium uppercase tracking-wider text-success/80 mb-2">After</p>
                          <p className="text-sm text-ink leading-relaxed">
                            {changed ? wordDiff(beforeText, afterText) : afterText}
                          </p>
                        </div>
                      </div>

                      {/* Reason */}
                      {result.reason && result.reason !== "Local fallback" && (
                        <p className="text-xs text-ink-muted italic mt-2">{result.reason}</p>
                      )}

                      {/* Action buttons */}
                      {!isAccepted && !isRejected && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => acceptBullet(index)}
                            className="text-xs px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => rejectBullet(index)}
                            className="text-xs px-3 py-1.5 rounded border border-line text-ink-muted hover:text-ink hover:bg-canvas-subtle transition-colors"
                          >
                            ✕ Keep original
                          </button>
                        </div>
                      )}
                      {isAccepted && (
                        <button onClick={() => rejectBullet(index)} className="text-xs mt-2 text-ink-subtle underline hover:text-ink-muted">
                          Undo
                        </button>
                      )}
                      {isRejected && (
                        <button onClick={() => acceptBullet(index)} className="text-xs mt-2 text-ink-subtle underline hover:text-ink-muted">
                          Re-accept
                        </button>
                      )}
                    </Card>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ATS results (shown after save) ──────────────────────────────── */}
      <AnimatePresence>
        {atsResult && !atsResult.error && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-5">
              <h2 className="text-base font-semibold text-ink mb-4">ATS Check Results</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold",
                  atsResult.score >= 70 ? "bg-success/15 text-success" :
                  atsResult.score >= 40 ? "bg-amber-500/15 text-amber-300" : "bg-danger/15 text-danger",
                )}>
                  {atsResult.score ?? "—"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">ATS Match Score</p>
                  <Badge tone={
                    atsResult.overall_fit === "strong" ? "success" :
                    atsResult.overall_fit === "moderate" ? "warning" : "danger"
                  } className="mt-1 capitalize">
                    {atsResult.overall_fit ?? "unknown"} fit
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-success/20 bg-success/[0.04] p-4">
                  <p className="text-2xs font-medium uppercase tracking-wider text-success/90 mb-2">Present ({atsResult.present_keywords?.length ?? 0})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(atsResult.present_keywords ?? []).map((k: string) => (
                      <span key={k} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-success/10 text-success/90 border border-success/20">{k}</span>
                    ))}
                    {(atsResult.present_keywords ?? []).length === 0 && <p className="text-2xs text-ink-subtle">None.</p>}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                  <p className="text-2xs font-medium uppercase tracking-wider text-amber-300/90 mb-2">Missing ({atsResult.missing_keywords?.length ?? 0})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(atsResult.missing_keywords ?? []).map((k: string) => (
                      <span key={k} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300/90 border border-amber-500/20">{k}</span>
                    ))}
                    {(atsResult.missing_keywords ?? []).length === 0 && <p className="text-2xs text-ink-subtle">None.</p>}
                  </div>
                </div>
              </div>
              {(atsResult.missing_skills ?? []).length > 0 && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.04] p-4 mt-3">
                  <p className="text-2xs font-medium uppercase tracking-wider text-orange-300/90 mb-2">Missing skills ({atsResult.missing_skills.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {atsResult.missing_skills.map((k: string) => (
                      <span key={k} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-300/90 border border-orange-500/20">{k}</span>
                    ))}
                  </div>
                </div>
              )}
              {(atsResult.suggestions ?? []).length > 0 && (
                <div className="rounded-xl border border-line bg-canvas-subtle p-4 mt-3">
                  <p className="text-2xs font-medium uppercase tracking-wider text-ink-muted mb-2">Suggestions</p>
                  <ol className="space-y-1.5 list-decimal list-inside">
                    {atsResult.suggestions.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-ink-muted leading-relaxed">{s}</li>
                    ))}
                  </ol>
                </div>
              )}
              {atsResult.fallback && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-2 mt-3">
                  <AlertTriangle size={12} className="text-amber-300 shrink-0 mt-0.5" />
                  <p className="text-2xs text-amber-300/90">LLM unavailable — ATS results are keyword-match only.</p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {atsResult?.error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 flex items-start gap-2">
          <AlertCircle size={12} className="text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-danger/90">{atsResult.error}</p>
        </div>
      )}

      {/* ── Step 3: Cover Letter ────────────────────────────────────────── */}
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
                <Button variant="secondary" size="sm" onClick={downloadCoverLetter}>
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

      {/* ── LinkedIn teaser ──────────────────────────────────────────────── */}
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
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="md" onClick={() => setNotifyLinkedIn(true)} disabled={notifyLinkedIn === true}>
              <Bell size={14} /> {notifyLinkedIn === true ? "Notified ✓" : "Notify me"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                     Live Tailored Resume Preview                           */
/* -------------------------------------------------------------------------- */

interface PreviewData {
  summary: string;
  experience: Array<{ id: string; role: string; company: string; start: string; end: string; bullets: string[] }>;
  projects: Array<{ id: string; name: string; bullets: string[]; tech: string[] }>;
}

const TailoredPreview: React.FC<{
  resume: {
    contact: { name?: string; title?: string; email?: string; phone?: string; location?: string };
    education: Array<{ id: string; degree: string; field: string; school: string; start: string; end: string }>;
    skills: string[];
  };
  previewData: PreviewData;
  changedBullets: Set<number>;
  meta: BulletMeta[];
}> = ({ resume, previewData, changedBullets, meta }) => {
  function isChanged(type: BulletMeta["type"], expIndex: number, bulletIndex: number): boolean {
    return meta.some((m) => m.type === type && m.expIndex === expIndex && m.bulletIndex === bulletIndex && changedBullets.has(m.index));
  }

  return (
    <div className="space-y-5 text-sm leading-relaxed max-h-[600px] overflow-y-auto pr-1">
      {/* Contact info */}
      <div>
        <p className="text-base font-semibold text-ink">{resume.contact.name || "(Your name)"}</p>
        <p className="text-xs text-ink-muted mt-0.5">{resume.contact.title}</p>
        <p className="text-xs text-ink-subtle mt-1">
          {[resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join(" · ") || "Contact info"}
        </p>
      </div>

      {/* Summary */}
      {previewData.summary && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent-300 mb-1.5">Summary</h4>
          <p className="text-xs text-ink-muted leading-relaxed">{previewData.summary}</p>
        </div>
      )}

      {/* Experience */}
      {previewData.experience.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent-300 mb-2">Experience</h4>
          <div className="space-y-3">
            {previewData.experience.map((exp, ei) => (
              <div key={exp.id}>
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-ink">
                    {exp.role} <span className="font-normal text-ink-muted">· {exp.company}</span>
                  </p>
                  <p className="text-2xs text-ink-subtle tabular-nums">{exp.start} — {exp.end}</p>
                </div>
                <ul className="mt-1 space-y-1">
                  {exp.bullets.filter(Boolean).map((b, bi) => {
                    const changed = isChanged("experience", ei, bi);
                    return (
                      <li key={bi} className="flex items-start gap-2 text-xs text-ink-muted">
                        <span className="text-ink-subtle shrink-0 mt-0.5">·</span>
                        <span className="flex-1">{b}</span>
                        {changed && (
                          <span className="shrink-0 text-2xs font-medium text-success px-1 py-0.5 rounded bg-success/[0.08] border border-success/20 whitespace-nowrap">
                            Changed
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {previewData.projects.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent-300 mb-2">Projects</h4>
          <div className="space-y-2">
            {previewData.projects.map((proj, pi) => (
              <div key={proj.id}>
                <p className="text-sm font-semibold text-ink">{proj.name}</p>
                {proj.tech.length > 0 && (
                  <p className="text-2xs text-ink-subtle mt-0.5">{proj.tech.join(" · ")}</p>
                )}
                <ul className="mt-1 space-y-1">
                  {proj.bullets.filter(Boolean).map((b, bi) => {
                    const changed = isChanged("project", pi, bi);
                    return (
                      <li key={bi} className="flex items-start gap-2 text-xs text-ink-muted">
                        <span className="text-ink-subtle shrink-0 mt-0.5">·</span>
                        <span className="flex-1">{b}</span>
                        {changed && (
                          <span className="shrink-0 text-2xs font-medium text-success px-1 py-0.5 rounded bg-success/[0.08] border border-success/20 whitespace-nowrap">
                            Changed
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education + Skills */}
      {resume.education.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent-300 mb-1.5">Education</h4>
          {resume.education.map((e) => (
            <p key={e.id} className="text-xs text-ink-muted">
              <span className="font-semibold text-ink">{e.degree} {e.field}</span> · {e.school} · {e.start}–{e.end}
            </p>
          ))}
        </div>
      )}

      {resume.skills.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-accent-300 mb-1.5">Skills</h4>
          <p className="text-xs text-ink-muted">{resume.skills.join(" · ")}</p>
        </div>
      )}
    </div>
  );
};
