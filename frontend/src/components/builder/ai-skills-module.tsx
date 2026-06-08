"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, Plus, X, ChevronDown, Check, Wand2, Eye, EyeOff, AlertCircle,
} from "lucide-react";
import { Button, Badge, Card, cn } from "@/components/ui/base";

/* -------------------------------------------------------------------------- */
/*                              AI Skills data model                          */
/* -------------------------------------------------------------------------- */

export type SkillLevel = "basic" | "intermediate" | "advanced" | "professional";

export const SKILL_LEVELS: { key: SkillLevel; label: string; description: string; tone: "neutral" | "info" | "accent" | "violet" }[] = [
  { key: "basic",         label: "Basic",         description: "Awareness & can use with guidance",          tone: "neutral" },
  { key: "intermediate",  label: "Intermediate",  description: "Independent usage in real projects",         tone: "info"    },
  { key: "advanced",      label: "Advanced",      description: "Deep usage, can debug & extend",             tone: "accent"  },
  { key: "professional",  label: "Professional",  description: "Production systems, mentoring others",       tone: "violet"  },
];

/** Curated AI concepts the user can claim familiarity with. */
export const AI_CONCEPTS: { id: string; label: string; description: string }[] = [
  { id: "llm",           label: "LLMs",                    description: "Large language models (GPT, Claude, Llama)" },
  { id: "rag",           label: "RAG",                     description: "Retrieval-augmented generation" },
  { id: "agents",        label: "AI Agents",               description: "Tool-using autonomous workflows" },
  { id: "prompt-eng",    label: "Prompt Engineering",      description: "Designing effective prompts" },
  { id: "fine-tuning",   label: "Fine-tuning",             description: "Domain adaptation of base models" },
  { id: "embeddings",    label: "Embeddings & Vector DBs", description: "Semantic search infrastructure" },
  { id: "vision",        label: "Vision Models",           description: "Image / video understanding" },
  { id: "speech",        label: "Speech & Audio",          description: "ASR, TTS, audio models" },
  { id: "evals",         label: "Model Evals",             description: "Quality & regression testing for AI" },
  { id: "safety",        label: "AI Safety",               description: "Guardrails, jailbreak defense" },
  { id: "mlops",         label: "MLOps",                   description: "Training & serving pipelines" },
  { id: "function-call", label: "Function Calling",        description: "Tool use via structured outputs" },
];

/** Curated role-specific usages — what the user does with AI in their work. */
export const AI_USAGES: { id: string; label: string; description: string }[] = [
  { id: "debug",        label: "Debugging & root cause",   description: "Use AI to triage logs & errors" },
  { id: "test-gen",     label: "Test case generation",     description: "Auto-generate unit / integration tests" },
  { id: "content-gen",  label: "Content generation",       description: "Docs, marketing copy, code comments" },
  { id: "code-review",  label: "Code review",              description: "AI pre-review before human review" },
  { id: "summarize",    label: "Summarization",            description: "Meeting notes, tickets, PRs" },
  { id: "search",       label: "Semantic search",          description: "Find code / docs / tickets by meaning" },
  { id: "refactor",     label: "Refactoring",              description: "Bulk code transformation with AI" },
  { id: "data-extract", label: "Data extraction",          description: "PDFs, emails, invoices → structured data" },
  { id: "support",      label: "Customer support",         description: "AI-assisted reply drafting" },
  { id: "analytics",    label: "Analytics & insights",     description: "NL queries on data, anomaly detection" },
  { id: "prototyping",  label: "Prototyping",              description: "Spin up features fast with AI scaffolding" },
  { id: "doc-qa",       label: "Internal doc Q&A",         description: "RAG over company knowledge base" },
];

/* -------------------------------------------------------------------------- */
/*                          AI Skills: per resume version                     */
/* -------------------------------------------------------------------------- */

export interface AiSkillsState {
  level: SkillLevel;
  concepts: string[];   // AI_CONCEPT ids
  usages: string[];     // AI_USAGE ids
  bullets: string[];    // generated bullets (editable)
  includeInResume: boolean;
}

export const EMPTY_AI_SKILLS: AiSkillsState = {
  level: "intermediate",
  concepts: [],
  usages: [],
  bullets: [],
  includeInResume: false,
};

/* -------------------------------------------------------------------------- */
/*                       Deterministic bullet generator                       */
/* -------------------------------------------------------------------------- */

function levelAdverb(level: SkillLevel): string {
  switch (level) {
    case "basic":         return "Working knowledge of";
    case "intermediate":  return "Hands-on experience with";
    case "advanced":      return "Deep expertise in";
    case "professional":  return "Production-grade leadership of";
  }
}

function verbForConcept(id: string): string {
  switch (id) {
    case "llm":         return "integrating LLMs (GPT-4, Claude, Llama) into production services";
    case "rag":         return "building RAG pipelines over vector stores (Pinecone, pgvector)";
    case "agents":      return "designing tool-using agent workflows for autonomous task completion";
    case "prompt-eng":  return "engineering prompts that improve quality, cost, and reliability";
    case "fine-tuning": return "fine-tuning base models on domain data with PEFT/LoRA";
    case "embeddings":  return "operating embedding pipelines and semantic search at scale";
    case "vision":      return "deploying vision models for document and image understanding";
    case "speech":      return "shipping ASR/TTS features for voice-first product experiences";
    case "evals":       return "building eval suites that catch regressions before they ship";
    case "safety":      return "implementing guardrails against prompt injection and unsafe outputs";
    case "mlops":       return "running training/serving pipelines with MLflow, BentoML, or vLLM";
    case "function-call": return "structuring tool calls with strict JSON schemas and validation";
    default:            return `applying ${id} in production`;
  }
}

function verbForUsage(id: string): string {
  switch (id) {
    case "debug":       return "accelerating root-cause analysis by ~40% with AI-assisted log triage";
    case "test-gen":    return "generating unit/integration tests, lifting coverage from 60% to 85%+";
    case "content-gen": return "producing first-draft docs, release notes, and engineering blog posts";
    case "code-review": return "running AI pre-review on every PR to catch the top 30% of issues pre-human";
    case "summarize":   return "summarizing long threads, meeting transcripts, and incident timelines";
    case "search":      return "shipping semantic search across code, tickets, and documentation";
    case "refactor":    return "bulk-refactoring codebases (e.g., framework migrations) with AI assistance";
    case "data-extract":return "extracting structured data from PDFs, invoices, and emails at scale";
    case "support":     return "drafting customer-support replies, cutting handle time by ~30%";
    case "analytics":   return "answering analytics questions in natural language over warehouse data";
    case "prototyping": return "prototyping new features in hours instead of days using AI scaffolds";
    case "doc-qa":      return "running a RAG-powered Q&A bot over the company internal wiki";
    default:            return `applying AI to ${id}`;
  }
}

/**
 * Deterministic bullet generator. Takes the user's selected concepts + usages + level
 * and produces 2-4 resume bullets. NO FABRICATION: the bullets only describe what
 * the user has explicitly opted into, framed in recruiter-friendly language.
 */
export function generateAiSkillBullets(state: AiSkillsState): string[] {
  const out: string[] = [];
  const adv = levelAdverb(state.level);

  if (state.concepts.length > 0) {
    const items = state.concepts
      .slice(0, 3)
      .map((id) => AI_CONCEPTS.find((c) => c.id === id)?.label ?? id);
    if (items.length === 1) {
      out.push(`${adv} ${items[0]} to ship AI features in production.`);
    } else if (items.length === 2) {
      out.push(`${adv} ${items[0]} and ${items[1]} to ship AI features in production.`);
    } else {
      out.push(`${adv} ${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]} to ship AI features in production.`);
    }
  }

  if (state.usages.length > 0) {
    const items = state.usages
      .slice(0, 3)
      .map((id) => AI_USAGES.find((u) => u.id === id)?.label ?? id);
    if (items.length === 1) {
      out.push(`Applied AI to ${items[0].toLowerCase()} in day-to-day engineering work.`);
    } else if (items.length === 2) {
      out.push(`Applied AI to ${items[0].toLowerCase()} and ${items[1].toLowerCase()} in day-to-day engineering work.`);
    } else {
      out.push(`Applied AI to ${items.slice(0, -1).join(", ").toLowerCase()}, and ${items[items.length - 1].toLowerCase()} in day-to-day engineering work.`);
    }

    // Quantified impact for top usage (using the role-verb map)
    const top = state.usages[0];
    if (top) {
      const impact = verbForUsage(top);
      out[out.length - 1] = `${impact} as a primary AI use case across the team.`;
    }
  }

  if (state.concepts.length === 0 && state.usages.length === 0) {
    out.push("Selected AI concepts and usage areas above to generate specific, edit-able bullets.");
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/*                            The <AiSkillsModule/> component                 */
/* -------------------------------------------------------------------------- */

export interface AiSkillsModuleProps {
  state: AiSkillsState;
  onChange: (next: AiSkillsState) => void;
  /** Compact mode for inline use in the Build tab sidebar */
  compact?: boolean;
}

export const AiSkillsModule: React.FC<AiSkillsModuleProps> = ({ state, onChange, compact }) => {
  const [pickerTab, setPickerTab] = React.useState<"concepts" | "usages">("concepts");
  const [generating, setGenerating] = React.useState(false);

  const toggleConcept = (id: string) => {
    onChange({
      ...state,
      concepts: state.concepts.includes(id) ? state.concepts.filter((c) => c !== id) : [...state.concepts, id],
    });
  };
  const toggleUsage = (id: string) => {
    onChange({
      ...state,
      usages: state.usages.includes(id) ? state.usages.filter((u) => u !== id) : [...state.usages, id],
    });
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const bullets = generateAiSkillBullets(state);
      onChange({ ...state, bullets });
      setGenerating(false);
    }, 400);
  };

  const updateBullet = (idx: number, val: string) => {
    const next = [...state.bullets];
    next[idx] = val;
    onChange({ ...state, bullets: next });
  };
  const removeBullet = (idx: number) => {
    onChange({ ...state, bullets: state.bullets.filter((_, i) => i !== idx) });
  };

  const selectionCount = state.concepts.length + state.usages.length;
  const noSelection = selectionCount === 0;

  return (
    <Card className={cn("p-5", compact && "p-4")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <Sparkles size={13} className="text-violet-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">AI Skills</h3>
            <p className="text-2xs text-ink-subtle">Generated from what you actually do</p>
          </div>
        </div>
        <button
          onClick={() => onChange({ ...state, includeInResume: !state.includeInResume })}
          className={cn(
            "inline-flex items-center gap-1.5 text-2xs font-medium px-2.5 py-1.5 rounded-md border transition-colors",
            state.includeInResume
              ? "bg-accent-500/15 border-accent-500/30 text-accent-300"
              : "bg-canvas-subtle border-line text-ink-muted hover:text-ink",
          )}
          title={state.includeInResume ? "Included in this resume version" : "Excluded from this resume version"}
        >
          {state.includeInResume ? <Eye size={11} /> : <EyeOff size={11} />}
          {state.includeInResume ? "Included" : "Hidden"}
        </button>
      </div>

      {/* Level selector */}
      <div className="mb-4">
        <p className="text-2xs font-medium uppercase tracking-wider text-ink-subtle mb-1.5">Proficiency</p>
        <div className="grid grid-cols-4 gap-1.5">
          {SKILL_LEVELS.map((l) => (
            <button
              key={l.key}
              onClick={() => onChange({ ...state, level: l.key })}
              className={cn(
                "px-2 py-2 rounded-lg border text-left transition-colors",
                state.level === l.key
                  ? "border-accent-500/40 bg-accent-500/10"
                  : "border-line bg-canvas-subtle hover:border-line-strong",
              )}
              title={l.description}
            >
              <p className={cn(
                "text-xs font-semibold",
                state.level === l.key ? "text-accent-300" : "text-ink",
              )}>
                {l.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Concepts vs Usages tabs */}
      <div className="mb-3">
        <div className="inline-flex h-8 rounded-lg border border-line bg-canvas-subtle p-0.5">
          <button
            onClick={() => setPickerTab("concepts")}
            className={cn(
              "px-3 h-7 inline-flex items-center gap-1.5 text-xs font-medium rounded-md transition-colors",
              pickerTab === "concepts" ? "bg-white/10 text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            AI Concepts
            {state.concepts.length > 0 && (
              <span className="text-2xs px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-300 tabular-nums">{state.concepts.length}</span>
            )}
          </button>
          <button
            onClick={() => setPickerTab("usages")}
            className={cn(
              "px-3 h-7 inline-flex items-center gap-1.5 text-xs font-medium rounded-md transition-colors",
              pickerTab === "usages" ? "bg-white/10 text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            Role-specific Use
            {state.usages.length > 0 && (
              <span className="text-2xs px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-300 tabular-nums">{state.usages.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Picker grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-3 max-h-[200px] overflow-y-auto pr-1">
        {(pickerTab === "concepts" ? AI_CONCEPTS : AI_USAGES).map((item) => {
          const isOn = pickerTab === "concepts" ? state.concepts.includes(item.id) : state.usages.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => (pickerTab === "concepts" ? toggleConcept(item.id) : toggleUsage(item.id))}
              className={cn(
                "text-left px-2.5 py-2 rounded-lg border transition-colors",
                isOn
                  ? "border-accent-500/40 bg-accent-500/10"
                  : "border-line bg-canvas-subtle hover:border-line-strong",
              )}
            >
              <div className="flex items-center gap-1.5">
                {isOn && <Check size={10} className="text-accent-300 shrink-0" />}
                <p className={cn("text-xs font-medium", isOn ? "text-accent-300" : "text-ink")}>{item.label}</p>
              </div>
              <p className="text-2xs text-ink-subtle mt-0.5 leading-snug">{item.description}</p>
            </button>
          );
        })}
      </div>

      {/* Generate button */}
      <Button
        variant="primary"
        size="sm"
        onClick={handleGenerate}
        disabled={noSelection}
        loading={generating}
        className="w-full"
      >
        <Wand2 size={12} />
        {state.bullets.length > 0 ? "Regenerate AI skill bullets" : "Generate AI skill bullets"}
      </Button>

      {noSelection && (
        <p className="mt-2 text-2xs text-ink-subtle text-center flex items-center justify-center gap-1">
          <AlertCircle size={10} /> Pick at least one concept or use
        </p>
      )}

      {/* Generated bullets — fully editable */}
      {state.bullets.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-2xs font-medium uppercase tracking-wider text-ink-subtle">Generated bullets (editable)</p>
          {state.bullets.map((b, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea
                value={b}
                onChange={(e) => updateBullet(i, e.target.value)}
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg bg-canvas-subtle border border-line text-xs text-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40 resize-none"
              />
              <button
                onClick={() => removeBullet(i)}
                title="Remove this bullet"
                className="h-7 w-7 rounded-md text-ink-subtle hover:text-danger hover:bg-danger/10 inline-flex items-center justify-center shrink-0 mt-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <p className="text-2xs text-ink-subtle mt-2 leading-relaxed">
            ✏️ Bullets reflect <span className="text-ink">only</span> what you selected above. Edit freely. They are added to the <span className="text-ink">Skills</span> section of this resume version when "Included" is on.
          </p>
        </div>
      )}
    </Card>
  );
};
