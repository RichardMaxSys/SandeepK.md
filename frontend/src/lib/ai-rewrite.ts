/* -------------------------------------------------------------------------- */
/*                          AI rewrite engine (deterministic)                   */
/* -------------------------------------------------------------------------- */
/*                                                                              */
/* Local rewrite engine that produces "before / after" pairs from a resume     */
/* + (optional) job description. The output is realistic enough for the UX     */
/* to feel real during MVP. The real LLM call (OpenRouter) can be added on top */
/* by importing this module's functions from a thin wrapper.                    */
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
