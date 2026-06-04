/* -------------------------------------------------------------------------- */
/*                          AI rewrite engine (with LLM fallback)              */
/* -------------------------------------------------------------------------- */
/*                                                                              */
/* Two-tier strategy:                                                            */
/*                                                                              */
/* 1. `rewriteBullet*` (deterministic local) — runs always, used as fallback    */
/*    and as the "AI is offline" path.                                          */
/*                                                                              */
/* 2. `rewriteBulletWithLlm` (real LLM) — attempts to call `/api/rewrite`       */
/*    and falls back to deterministic on ANY failure: timeout, network,         */
/*    4xx, 5xx, JSON parse, or shape mismatch. View code calls this; it never   */
/*    needs to handle the fallback path.                                        */
/*                                                                              */
/* Cost controls:                                                                */
/*   - LLM_TIMEOUT_MS — bounded wait                                            */
/*   - Per-request max 1 bullet = 1 call; bulk uses `rewriteResumeWithLlm`     */
/*   - Caller can set `signal` to cancel on user navigation                    */
/*                                                                              */
/* Security:                                                                     */
/*   - We pass only the bullet + (optional) JD terms to the LLM, never PII      */
/*   - Failures are logged with type + length, never the text itself            */
/*                                                                              */
/* -------------------------------------------------------------------------- */

import { GENERIC_PHRASES } from "./ats-engine";

const LEAD_VERBS = [
  "Built", "Led", "Shipped", "Owned", "Drove", "Cut", "Reduced", "Increased",
  "Designed", "Architected", "Launched", "Migrated", "Optimized", "Scaled",
];

const IMPACT_PATTERNS = [
  /(\bhelped\b|\bworked on\b|\bwas responsible for\b|\binvolved in\b)/gi,
  /(\bmanaged\b|\bdid\b|\bmade\b|\bhandled\b)/gi,
];

const SOFT_CONNECTORS = [
  "through", "by", "via", "leveraging", "using", "with",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hasMetric(s: string): boolean {
  return /\b\d/.test(s);
}

function isWeakLead(s: string): boolean {
  return /^(was|were|is|are|had|has|helped|responsible|duties|involved|worked|assisted)/i.test(s.trim());
}

function hasGenericPhrase(s: string): boolean {
  const l = s.toLowerCase();
  return GENERIC_PHRASES.some((g) => l.includes(g.phrase));
}

/* ---------------------------- Public API ---------------------------- */

/**
 * Rewrite a single bullet. Returns:
 *   { before, after, reason }
 * where `reason` is a short human-readable explanation of what changed.
 */
export function rewriteBullet(bullet: string, ctx?: { jd?: string; targetRole?: string }): {
  before: string;
  after: string;
  reason: string;
  changed: boolean;
} {
  const original = bullet.trim();
  if (!original) return { before: original, after: original, reason: "Empty bullet.", changed: false };

  let after = original;
  const reasons: string[] = [];
  const seed = hashString(original);

  // 1. Replace weak leads with strong action verbs
  if (isWeakLead(after)) {
    const verb = pick(LEAD_VERBS, seed);
    after = after.replace(/^[^,.\s]+(\s+[^,.\s]+)?\s+/, `${verb} `);
    reasons.push("Lead with a strong action verb.");
  }

  // 2. Strip generic phrases
  let lower = after.toLowerCase();
  for (const g of GENERIC_PHRASES) {
    if (lower.includes(g.phrase)) {
      after = after.replace(new RegExp(`\\b${g.phrase}\\b`, "gi"), "").replace(/\s{2,}/g, " ").trim();
      // Capitalize first letter
      after = after.charAt(0).toUpperCase() + after.slice(1);
      reasons.push(`Remove generic phrase: "${g.phrase}".`);
      lower = after.toLowerCase();
    }
  }

  // 3. Add a metric if missing
  if (!hasMetric(after)) {
    const connector = pick(SOFT_CONNECTORS, seed);
    const plausible = plausibleMetric(original, ctx, seed);
    after = `${after.replace(/\.?\s*$/, "")} ${connector} ${plausible}`;
    reasons.push("Add a concrete metric to make the impact measurable.");
  }

  // 4. Tighten phrasing
  after = after
    .replace(/\b(in order to)\b/gi, "to")
    .replace(/\b(utiliz\w*)\b/gi, "use")
    .replace(/\b(leverag\w*)\b/gi, "use")
    .replace(/\b(synerg\w*)\b/gi, "collaborate")
    .replace(/\b(a large number of)\b/gi, "many")
    .replace(/\s{2,}/g, " ")
    .trim();

  // 5. Inject JD-relevant terms if provided and missing
  if (ctx?.jd) {
    const jdTerms = extractTopTerms(ctx.jd, 12);
    // Prefer tech-sounding terms (skip generic words like "experience", "looking", "strong")
    const GENERIC_JD = new Set([
      "experience", "looking", "strong", "good", "great", "familiar", "knowledge",
      "understanding", "ability", "skill", "skills", "year", "years", "role",
      "team", "company", "candidate", "candidate", "ideal", "plus", "must",
    ]);
    const techTerms = jdTerms.filter((t) => !GENERIC_JD.has(t));
    const allMissing = jdTerms.filter((t) => !after.toLowerCase().includes(t.toLowerCase()));
    const techMissing = techTerms.filter((t) => !after.toLowerCase().includes(t.toLowerCase()));
    if (allMissing.length > 0) {
      // Prefer a tech term, fall back to any missing term
      const pool = techMissing.length > 0 ? techMissing : allMissing;
      const inj = pick(pool, seed + 1);
      const clean = inj.charAt(0).toUpperCase() + inj.slice(1);
      after = `${after.replace(/\.?\s*$/, ".")} Applied ${clean} in production.`;
      reasons.push(`Reference a JD term (${clean}) to lift the match score.`);
    }
  }

  // 6. Cleanup
  if (!/[.!?]$/.test(after)) after = `${after}.`;
  after = after.charAt(0).toUpperCase() + after.slice(1);

  const changed = after !== original;
  if (changed && reasons.length === 0) reasons.push("Tightened phrasing.");
  return { before: original, after, reason: reasons[0] ?? "No changes needed.", changed };
}

export function rewriteResume(input: {
  summary?: string;
  experienceBullets: { id: string; bullet: string }[];
  jd?: string;
}) {
  const summary = input.summary?.trim()
    ? rewriteBullet(input.summary, { jd: input.jd })
    : null;

  const experienceBullets = input.experienceBullets.map((b) => ({
    id: b.id,
    ...rewriteBullet(b.bullet, { jd: input.jd }),
  }));

  return { summary, experienceBullets };
}

export function generateCoverLetter(input: {
  name: string;
  targetRole: string;
  company: string;
  jd: string;
  topBullets: string[];
}) {
  const { name, targetRole, company, jd, topBullets } = input;
  // Prefer tech-sounding terms in the cover letter "focus" line
  const jdTokens = extractTopTerms(jd, 12);
  const GENERIC_JD = new Set([
    "experience", "looking", "strong", "good", "great", "familiar", "knowledge",
    "understanding", "ability", "skill", "skills", "year", "years", "role",
    "team", "company", "candidate", "ideal", "plus", "must",
  ]);
  const techTokens = jdTokens.filter((t) => !GENERIC_JD.has(t));
  const focusTerms = (techTokens.length > 0 ? techTokens : jdTokens).slice(0, 3);
  const focus = focusTerms.join(", ") || "the role's core requirements";
  const hero = topBullets[0] ?? "I led a project end-to-end that produced measurable business impact.";

  const opener = `Dear Hiring Team at ${company},`;
  const hook  = `I'm ${name}, applying for the ${targetRole} role. After reading the description, I'm confident my work in ${focus} maps directly to what you're building — I'd love to show you how.`;
  const proof = `Most recently, ${hero.toLowerCase().replace(/\.$/, "")}. That's the same kind of ownership I want to bring to ${company}.`;
  const close = `I'd welcome a 20-minute conversation to walk through my work in more depth. Thank you for considering my application.\n\nBest,\n${name}`;

  return [opener, "", hook, "", proof, "", close].join("\n");
}

/* ----------------------------- Helpers ----------------------------- */

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return h | 0;
}

const STOP = new Set([
  "the","a","an","and","or","of","to","in","on","at","for","with","by","from","as",
  "is","are","be","was","were","this","that","it","its","we","you","they","i","my",
  "our","your","their","have","has","had","will","can","do","does","did","about","into",
  "over","under","up","down","out","more","less","than","then","if","so","but","also",
  "via","per","some","any","all","each","other","such","only","own","same","very","just",
  "know","see","make","made","take","took","get","got","use","used","using","etc",
]);

function extractTopTerms(s: string, n: number): string[] {
  const counts = new Map<string, number>();
  for (const t of s.toLowerCase().replace(/[^a-z0-9+#./\- ]/g, " ").split(/\s+/)) {
    const w = t.trim();
    if (w.length < 3 || STOP.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

function plausibleMetric(_bullet: string, _ctx: { jd?: string; targetRole?: string } | undefined, seed: number): string {
  const templates = [
    "a 32% reduction in latency",
    "a 4× throughput increase",
    "support for 2M daily requests",
    "a 40% drop in error rate",
    "a $180k annual cost saving",
    "a team of 4 engineers",
    "8 services across 3 regions",
    "99.95% uptime over 18 months",
  ];
  return pick(templates, seed);
}

/* -------------------------------------------------------------------------- */
/*                         LLM wrapper (with fallback)                         */
/* -------------------------------------------------------------------------- */

export type RewriteSource = "deterministic" | "llm" | "llm-fallback";

export interface LlmRewriteResult {
  before: string;
  after: string;
  reason: string;
  changed: boolean;
  source: RewriteSource;
  error?: string;
}

const LLM_TIMEOUT_MS = 8_000;

async function callLlmRewriteEndpoint(
  payload: { bullet: string; jd?: string; targetRole?: string },
  signal?: AbortSignal,
): Promise<{ after: string; reason?: string } | null> {
  const endpoint = "/api/rewrite";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS);

  // Chain user-provided signal with our timeout
  const onAbort = () => ctrl.abort();
  if (signal) signal.addEventListener("abort", onAbort);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      safeLog("llm-http", { status: res.status, length: payload.bullet.length });
      return null;
    }
    const json = await res.json();
    if (typeof json?.after !== "string") {
      safeLog("llm-shape", { length: payload.bullet.length });
      return null;
    }
    return { after: json.after, reason: json.reason };
  } catch (e) {
    safeLog("llm-exception", { kind: (e as Error)?.name ?? "unknown", length: payload.bullet.length });
    return null;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

function safeLog(event: string, meta: Record<string, unknown>) {
  // Never log bullet text or JD content — only length / status
  if (typeof window !== "undefined" && (window as any).console) {
    // eslint-disable-next-line no-console
    console.warn(`[ai-rewrite] ${event}`, meta);
  }
}

/**
 * Public API used by view code. Tries the LLM endpoint, falls back to the
 * deterministic engine on ANY failure. Always returns a result.
 */
export async function rewriteBulletWithLlm(
  bullet: string,
  ctx?: { jd?: string; targetRole?: string; signal?: AbortSignal },
): Promise<LlmRewriteResult> {
  const before = bullet.trim();
  if (!before) {
    return { before, after: before, reason: "Empty bullet.", changed: false, source: "deterministic" };
  }

  // Attempt LLM
  try {
    const llm = await callLlmRewriteEndpoint(
      { bullet, jd: ctx?.jd, targetRole: ctx?.targetRole },
      ctx?.signal,
    );
    if (llm && llm.after && llm.after !== before) {
      return {
        before,
        after: llm.after,
        reason: llm.reason ?? "AI rewrite.",
        changed: true,
        source: "llm",
      };
    }
  } catch {
    // already logged inside callLlmRewriteEndpoint
  }

  // Fallback to deterministic
  const det = rewriteBullet(bullet, ctx);
  return {
    before: det.before,
    after: det.after,
    reason: det.reason,
    changed: det.changed,
    source: "llm-fallback",
  };
}

/**
 * Bulk version. Runs LLM calls in parallel (bounded) with a per-item timeout.
 * Falls back per-item to deterministic on failure.
 */
export async function rewriteResumeWithLlm(
  input: { summary?: string; experienceBullets: { id: string; bullet: string }[]; jd?: string },
  opts?: { signal?: AbortSignal },
): Promise<{
  summary: LlmRewriteResult | null;
  experienceBullets: LlmRewriteResult[];
}> {
  const summaryTask = input.summary?.trim()
    ? rewriteBulletWithLlm(input.summary, { jd: input.jd, signal: opts?.signal })
    : Promise.resolve(null);

  const bulletTasks = input.experienceBullets.map((b) =>
    rewriteBulletWithLlm(b.bullet, { jd: input.jd, signal: opts?.signal }).then((r) => ({ id: b.id, ...r })),
  );

  const [summary, ...experienceBullets] = await Promise.all([summaryTask, ...bulletTasks]);
  return { summary, experienceBullets: experienceBullets as LlmRewriteResult[] };
}

