"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, FileText, Filter, Grid3x3, Eye, Edit3, Sparkles, X, CheckCircle2, Lock, Clock } from "lucide-react";
import { Button, Card, Badge, cn } from "@/components/ui/base";
import { TemplateCard, TEMPLATES } from "@/components/builder/template-card";
import { ResumeForm } from "@/components/builder/resume-form";
import { VersionSelector } from "@/components/version-selector";
import { useResume } from "@/lib/resume-store";
import { getTemplate, type TemplateDef } from "@/lib/templates";
import { runAts } from "@/lib/ats-engine";
import { usePdfExport } from "@/components/builder/use-pdf-export";
import { canUse, recordUse, getUsage, isPro as isProUser, timeUntilReset } from "@/lib/usage-limits";

const STORAGE_KEY_TEMPLATE = "careerai.template.v1";

export const BuilderView: React.FC = () => {
  const { resume, aiSkills, activeVersionId, versions } = useResume();
  const [templateId, setTemplateId] = React.useState<string>("modern-minimal");
  const [mode, setMode] = React.useState<"edit" | "preview">("edit");
  const [query, setQuery] = React.useState("");
  const [cat, setCat] = React.useState<string>("all");
  const [pdfToast, setPdfToast] = React.useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [quotaTick, setQuotaTick] = React.useState(0); // forces re-read of usage on action

  const { generate: generatePdf, isGenerating: generatingPdf, error: pdfError } = usePdfExport({
    onSuccess: (filename) => {
      setPdfToast({ kind: "success", message: `Downloaded ${filename}` });
      setQuotaTick((t) => t + 1);
      setTimeout(() => setPdfToast(null), 3500);
    },
    onError: () => {
      setPdfToast({ kind: "error", message: "PDF generation failed. Try again or use a different template." });
      setTimeout(() => setPdfToast(null), 4000);
    },
  });

  React.useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_TEMPLATE) : null;
    if (saved) setTemplateId(saved);
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY_TEMPLATE, templateId);
  }, [templateId]);

  const report = React.useMemo(() => runAts(resume), [resume]);
  const template = getTemplate(templateId) ?? TEMPLATES[0];

  // PDF export quota
  const pdfQuota = React.useMemo(() => getUsage("pdfExport"), [quotaTick]);
  const isPro = React.useMemo(() => isProUser(), [quotaTick]);
  const pdfCanExport = isPro || pdfQuota.remaining > 0;

  const handleDownloadPdf = async () => {
    if (!pdfCanExport || generatingPdf) return;
    // Record the use *before* generating so the quota counter is honest even
    // if the user closes the tab mid-render. (The PDF blob is still served
    // by the browser regardless of what we record here.)
    const result = recordUse("pdfExport");
    if (!result.ok) {
      setPdfToast({ kind: "error", message: `You've used all ${pdfQuota.quota} free PDF exports. Resets ${timeUntilReset("pdfExport")}.` });
      setTimeout(() => setPdfToast(null), 4000);
      return;
    }
    setQuotaTick((t) => t + 1);
    try {
      const activeVersion = versions[activeVersionId];
      await generatePdf({
        resume,
        template,
        watermark: !isPro,
        aiSkills: {
          level: aiSkills.level,
          bullets: aiSkills.bullets,
          includeInResume: aiSkills.includeInResume,
        },
      });
    } catch {
      // toast already shown by onError
    }
  };

  const filtered = React.useMemo(() => {
    return TEMPLATES.filter((t) => {
      if (cat !== "all" && t.category !== cat) return false;
      if (query && !t.name.toLowerCase().includes(query.toLowerCase()) && !t.tagline.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, cat]);

  const categories = ["all", "minimal", "modern", "classic", "creative", "executive", "technical"];

  return (
    <div className="space-y-6">
      {/* PDF export toast */}
      <AnimatePresence>
        {pdfToast && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "rounded-xl border p-3 flex items-center gap-2 text-sm",
              pdfToast.kind === "success"
                ? "border-success/30 bg-success/[0.06] text-success/90"
                : "border-danger/30 bg-danger/[0.06] text-danger/90",
            )}
          >
            {pdfToast.kind === "success" ? <CheckCircle2 size={14} /> : <X size={14} />}
            <span className="flex-1">{pdfToast.message}</span>
            {!isPro && pdfToast.kind === "success" && (
              <span className="text-2xs text-ink-muted">
                {pdfQuota.remaining} of {pdfQuota.quota} free exports left
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top action bar */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <p className="text-2xs font-medium uppercase tracking-wider text-accent-300">Builder</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Pick a template. Edit. Export.</h1>
          <p className="mt-1 text-sm text-ink-muted">
            18 pro templates. Your data is saved locally. Switch any time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <VersionSelector />
          <div className="inline-flex h-9 rounded-lg border border-line bg-canvas-subtle p-0.5">
            <button
              onClick={() => setMode("edit")}
              className={cn(
                "px-3 h-8 inline-flex items-center gap-1.5 text-xs font-medium rounded-md transition-colors",
                mode === "edit" ? "bg-white/10 text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              <Edit3 size={12} /> Edit
            </button>
            <button
              onClick={() => setMode("preview")}
              className={cn(
                "px-3 h-8 inline-flex items-center gap-1.5 text-xs font-medium rounded-md transition-colors",
                mode === "preview" ? "bg-white/10 text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              <Eye size={12} /> Preview
            </button>
          </div>
          <Button
            variant="secondary"
            size="md"
            disabled
            title="DOCX export ships in the next patch"
          >
            <FileText size={14} /> DOCX
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleDownloadPdf}
            loading={generatingPdf}
            disabled={!pdfCanExport}
            title={
              pdfCanExport
                ? isPro
                  ? "Download this resume as a PDF"
                  : `Download PDF${pdfQuota.remaining < pdfQuota.quota ? ` (${pdfQuota.remaining} of ${pdfQuota.quota} free exports left)` : ""}`
                : `Free limit reached. Resets in ${timeUntilReset("pdfExport")}.`
            }
          >
            {pdfCanExport ? <Download size={14} /> : <Lock size={14} />}
            {generatingPdf ? "Generating…" : "PDF"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_420px] gap-5">
        {/* LEFT: Template gallery */}
        <aside className="space-y-3">
          <Card className="p-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-canvas-subtle border border-line text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={cn(
                    "text-2xs font-medium px-2 py-1 rounded-md transition-colors capitalize",
                    cat === c ? "bg-accent-500/15 text-accent-300" : "text-ink-muted hover:text-ink hover:bg-white/5",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </Card>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                active={t.id === templateId}
                onSelect={() => setTemplateId(t.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-xs text-ink-muted">No templates match your search.</div>
            )}
          </div>
        </aside>

        {/* MIDDLE: editor / preview */}
        <main>
          <AnimatePresence mode="wait">
            {mode === "edit" ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <ResumeForm />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <ResumePreview template={template} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* RIGHT: ATS sidebar */}
        <aside className="space-y-3">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-md bg-accent-500/15 border border-accent-500/30 flex items-center justify-center">
                <Sparkles size={13} className="text-accent-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Live ATS score</h3>
                <p className="text-2xs text-ink-subtle">Updates as you type</p>
              </div>
            </div>

            <div className="flex items-center justify-center my-2">
              <ScoreRing value={report.overall} />
            </div>

            <div className="mt-4 space-y-2.5">
              {Object.values(report.dimensions).map((d) => (
                <div key={d.key}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">{d.label}</span>
                    <span className="text-ink font-semibold tabular-nums">{d.score}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        d.score >= 80 ? "bg-success" : d.score >= 60 ? "bg-accent-500" : d.score >= 40 ? "bg-amber-500" : "bg-danger",
                      )}
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {report.totalBullets > 0 && (
              <div className="mt-4 pt-4 border-t border-line">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">Quantified bullets</span>
                  <span className="text-ink font-semibold tabular-nums">
                    {report.quantifiedBullets}/{report.totalBullets}
                  </span>
                </div>
              </div>
            )}

            {report.humanizer.genericPhraseCount > 0 && (
              <div className="mt-4 pt-4 border-t border-line">
                <Badge tone="warning" className="w-full justify-center">
                  {report.humanizer.genericPhraseCount} generic phrase{report.humanizer.genericPhraseCount > 1 ? "s" : ""}
                </Badge>
                <p className="mt-2 text-2xs text-ink-muted text-center">
                  Switch to the Check tab for the full Humanizer breakdown.
                </p>
              </div>
            )}
          </Card>

          {/* Template info card */}
          <Card className="p-5">
            <Badge tone={template.tier === "pro" ? "accent" : "neutral"} className="mb-2">
              {template.tier === "pro" ? "Pro template" : "Free template"}
            </Badge>
            <h3 className="text-base font-semibold text-ink">{template.name}</h3>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">{template.tagline}</p>
            {template.atsRiskNote && (
              <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-2xs text-amber-300/90 leading-relaxed">
                {template.atsRiskNote}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Subcomponents                               */
/* -------------------------------------------------------------------------- */

const ScoreRing: React.FC<{ value: number }> = ({ value }) => {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 80 ? "#22c55e" : value >= 60 ? "#14b8a6" : value >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 144 144" className="h-full w-full -rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-ink tabular-nums">{value}</span>
        <span className="text-2xs text-ink-subtle uppercase tracking-wider mt-0.5">Overall</span>
      </div>
    </div>
  );
};

const ResumePreview: React.FC<{ template: TemplateDef }> = ({ template }) => {
  const { resume } = useResume();
  return (
    <Card className="p-8 bg-canvas">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Badge tone="neutral" className="capitalize">{template.category}</Badge>
          <h2 className="mt-2 text-xl font-semibold text-ink">{template.name}</h2>
        </div>
        <p className="text-2xs text-ink-subtle text-right max-w-[200px]">
          A4 portrait · ATS-clean export · 1 page
        </p>
      </div>

      {/* Document mock */}
      <div className="rounded-xl bg-white text-slate-900 p-10 max-w-[820px] mx-auto shadow-2xl aspect-[1/1.414] overflow-hidden relative">
        <DocumentBody resume={resume} template={template} />
      </div>
    </Card>
  );
};

const DocumentBody: React.FC<{ resume: ReturnType<typeof useResume>["resume"]; template: TemplateDef }> = ({ resume, template }) => {
  const fontCls = template.style.font === "serif" ? "font-serif" : template.style.font === "mono" ? "font-mono" : "font-sans";
  const accent = template.style.accent === "teal" ? "#0d9488" :
                 template.style.accent === "navy" ? "#0369a1" :
                 template.style.accent === "rose" ? "#e11d48" :
                 template.style.accent === "amber" ? "#d97706" :
                 template.style.accent === "violet" ? "#7c3aed" :
                 "#475569";

  return (
    <div className={cn("h-full flex flex-col gap-3 text-[10px] leading-relaxed text-slate-700", fontCls)}>
      {/* Header */}
      <header className={cn(
        "pb-3",
        template.style.headerStyle === "banner" ? "rounded-md text-white px-4 py-3" : "border-b border-slate-200",
        template.style.headerStyle === "banner" ? "" : "",
      )}
      style={template.style.headerStyle === "banner" ? { background: accent } : {}}
      >
        {template.style.headerStyle === "centered" && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{resume.contact.name}</h1>
            <p className="text-xs text-slate-600 mt-1">{resume.contact.title}</p>
            <p className="text-2xs text-slate-500 mt-1.5">
              {[resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}
        {template.style.headerStyle === "left" && (
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{resume.contact.name}</h1>
            <p className="text-xs text-slate-600 mt-1">{resume.contact.title}</p>
            <p className="text-2xs text-slate-500 mt-1.5">
              {[resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}
        {template.style.headerStyle === "banner" && (
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{resume.contact.name}</h1>
            <p className="text-xs opacity-80 mt-1">{resume.contact.title}</p>
            <p className="text-2xs opacity-70 mt-1.5">
              {[resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}
        {template.style.headerStyle === "sidebar" && (
          <div className="flex gap-4">
            <div className="w-1/3 text-white p-3 rounded" style={{ background: accent }}>
              <h1 className="text-base font-bold leading-tight">{resume.contact.name}</h1>
              <p className="text-2xs opacity-90 mt-1">{resume.contact.title}</p>
              <div className="mt-3 space-y-0.5">
                <p className="text-2xs opacity-80">{resume.contact.email}</p>
                <p className="text-2xs opacity-80">{resume.contact.phone}</p>
                <p className="text-2xs opacity-80">{resume.contact.location}</p>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Summary</h2>
              <p className="text-2xs text-slate-600">{resume.summary}</p>
            </div>
          </div>
        )}
        {template.style.headerStyle === "split" && (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{resume.contact.name}</h1>
              <p className="text-xs text-slate-600 mt-0.5">{resume.contact.title}</p>
              <p className="text-2xs text-slate-500 mt-1">
                {[resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Summary (if not in sidebar header) */}
      {template.style.headerStyle !== "sidebar" && resume.summary && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Summary</h2>
          <p className="text-2xs text-slate-600 leading-relaxed">{resume.summary}</p>
        </section>
      )}

      {/* Experience */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>Experience</h2>
        <div className="space-y-3">
          {resume.experience.map((exp) => (
            <div key={exp.id}>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{exp.role} <span className="font-normal text-slate-600">· {exp.company}</span></p>
                </div>
                <p className="text-2xs text-slate-500 tabular-nums">{exp.start} — {exp.end}</p>
              </div>
              <ul className="mt-1 space-y-0.5">
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <li key={i} className="text-2xs text-slate-700 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-slate-400">{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Skills + Education side by side */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Skills</h2>
          <p className="text-2xs text-slate-700">{resume.skills.join(" · ")}</p>
        </section>
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Education</h2>
          {resume.education.map((e) => (
            <p key={e.id} className="text-2xs text-slate-700">
              <span className="font-semibold text-slate-900">{e.degree} {e.field}</span> · {e.school} · {e.start}–{e.end}
            </p>
          ))}
        </section>
      </div>
    </div>
  );
};
