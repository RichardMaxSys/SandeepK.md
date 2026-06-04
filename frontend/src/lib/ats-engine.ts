/* -------------------------------------------------------------------------- */
/*                              ATS scoring engine                            */
/* -------------------------------------------------------------------------- */

import type { ResumeData } from "./resume-store";

/**
 * The ATS engine is intentionally transparent and heuristic. We never pretend
 * to know the actual proprietary algorithm used by Workday / Taleo / Greenhouse.
 * Instead we measure four orthogonal dimensions that real ATS systems use as
 * proxies, and we tell users up-front what we're measuring.
 */

export interface DimensionScore {
  key: ParseabilityKey | KeywordKey | FormattingKey | ContentKey;
  label: string;
  score: number;        // 0-100
  weight: number;       // used for overall
  findings: string[];
  positiveSignals: string[];
  description: string;
}

export type ParseabilityKey = "parseability";
export type KeywordKey     = "keywords";
export type FormattingKey  = "formatting";
export type ContentKey     = "content";

export interface AtsReport {
  overall: number;
  dimensions: {
    parseability: DimensionScore;
    keywords:     DimensionScore;
    formatting:   DimensionScore;
    content:      DimensionScore;
  };
  humanizer: {
    genericPhraseCount: number;
    flaggedPhrases: { phrase: string; why: string; better: string }[];
  };
  totalBullets: number;
  quantifiedBullets: number;
}

/* ------------------------- Generic phrase bank ------------------------- */

const GENERIC_PHRASES: { phrase: string; why: string; better: string }[] = [
  { phrase: "passionate",         why: "Generic adjective recruiters see 100× a day.",     better: "Show the specific thing you care about, with proof." },
  { phrase: "results-driven",     why: "Vague. Every candidate claims this.",             better: "Replace with a concrete metric you drove." },
  { phrase: "team player",        why: "Filler. Doesn't say what you actually did.",      better: "Describe a specific collaboration and its outcome." },
  { phrase: "hard worker",        why: "Implied by every other bullet on the page.",      better: "Cut. Use the space for an achievement." },
  { phrase: "go-getter",          why: "Buzzword. Sounds AI-generated.",                   better: "Cut. Show momentum with a metric." },
  { phrase: "thought leader",     why: "Self-claimed label with no proof.",               better: "Cite a talk, post, or open-source project." },
  { phrase: "synergy",            why: "Corporate jargon, no specifics.",                  better: "Describe the actual collaboration." },
  { phrase: "self-starter",       why: "Generic. Implied by any shipped project.",        better: "Show a project you kicked off unprompted." },
  { phrase: "detail-oriented",    why: "Implied by your metrics and accuracy.",           better: "Cut. The work speaks." },
  { phrase: "proven track record",why: "Vague. Recruiters ignore it.",                    better: "Cite a specific result." },
  { phrase: "rockstar",           why: "Sounds AI. Triggers skepticism.",                 better: "Cut. Describe the actual impact." },
  { phrase: "ninja",              why: "Buzzword. Feels junior.",                          better: "Use a title or specific skill." },
  { phrase: "guru",               why: "Same as above.",                                  better: "Use a specific area of expertise." },
  { phrase: "best-in-class",      why: "Self-claimed superlative. Back it up or cut.",    better: "Use a benchmark number." },
  { phrase: "world-class",        why: "Same as above.",                                  better: "Cut. Show the work." },
];

/* ------------------------- Scoring ------------------------- */

const STOP_WORDS = new Set([
  "a","an","the","and","or","of","to","in","on","at","for","with","by","from","as","is","are",
  "be","was","were","this","that","these","those","it","its","we","you","they","i","my","our",
  "your","their","have","has","had","will","can","do","does","did","about","into","over",
  "under","up","down","out","more","less","than","then","if","so","but","also","via","per",
]);

function tokenize(s: string): string[] {
  return s.toLowerCase()
    .replace(/[^a-z0-9+#./\- ]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

function hasNumber(s: string): boolean {
  return /\b\d+(\.\d+)?(%|x|k|m|b|ms|s|sec|min|hr|h|req|users?|customers?|kpi|ms|p99|p50)?\b/i.test(s);
}

function bulletsOf(resume: ResumeData): string[] {
  const out: string[] = [];
  resume.experience.forEach((e) => e.bullets.forEach((b) => out.push(b)));
  resume.projects.forEach((p) => p.bullets.forEach((b) => out.push(b)));
  return out.filter((b) => b.trim().length > 0);
}

function totalContent(resume: ResumeData): string {
  return [
    resume.summary,
    resume.contact.name,
    resume.contact.title,
    resume.skills.join(" "),
    ...resume.experience.map((e) => `${e.role} ${e.company} ${e.bullets.join(" ")}`),
    ...resume.education.map((e) => `${e.degree} ${e.field} ${e.school}`),
    ...resume.projects.map((p) => `${p.name} ${p.description} ${p.bullets.join(" ")} ${p.tech.join(" ")}`),
  ].join(" ");
}

function wordCount(resume: ResumeData): number {
  return tokenize(totalContent(resume)).length;
}

function detectGenericPhrases(text: string) {
  const lower = text.toLowerCase();
  const flagged: { phrase: string; why: string; better: string }[] = [];
  for (const g of GENERIC_PHRASES) {
    if (lower.includes(g.phrase)) flagged.push(g);
  }
  return flagged;
}

function extractKeywords(jd: string): string[] {
  const counts = new Map<string, number>();
  for (const t of tokenize(jd)) counts.set(t, (counts.get(t) ?? 0) + 1);
  // Return top 40 most-frequent non-stop tokens
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([k]) => k);
}

function scoreParseability(resume: ResumeData, content: string): DimensionScore {
  const findings: string[] = [];
  const positive: string[] = [];
  let score = 100;

  const wc = wordCount(resume);
  if (wc < 150) {
    score -= 25;
    findings.push("Resume is very short. Aim for 350-700 words to give the ATS enough signal.");
  } else if (wc < 250) {
    score -= 10;
    findings.push("Resume is on the short side. Add 1-2 more bullets to strengthen it.");
  } else if (wc <= 800) {
    positive.push(`Healthy word count (${wc}).`);
  } else {
    score -= 8;
    findings.push(`Resume is long (${wc} words). Recruiters spend ~7s on first scan.`);
  }

  if (!resume.contact.email) { score -= 10; findings.push("Missing email — ATS won't be able to route you."); }
  else positive.push("Contact email present.");
  if (!resume.contact.phone) { score -= 4; findings.push("No phone number on file."); }
  if (!resume.contact.location) { score -= 3; findings.push("No location — many ATS filters require it."); }

  if (resume.experience.length === 0) { score -= 25; findings.push("No experience section. ATS will skip you."); }
  else positive.push(`${resume.experience.length} experience entries.`);

  if (resume.education.length === 0) {
    score -= 8;
    findings.push("No education section. Add at least one entry.");
  }

  return {
    key: "parseability",
    label: "Parseability",
    score: Math.max(0, Math.min(100, score)),
    weight: 0.3,
    findings,
    positiveSignals: positive,
    description: "How cleanly an ATS can read the structure and content of your resume.",
  };
}

function scoreKeywords(resume: ResumeData, jd: string | null): DimensionScore {
  const findings: string[] = [];
  const positive: string[] = [];
  const content = totalContent(resume);
  const resumeTokens = new Set(tokenize(content));

  if (!jd) {
    // Without a JD, score against a generic professional baseline
    const baseline = ["python","typescript","sql","aws","docker","git","api","rest","database","cloud"];
    const present = baseline.filter((k) => resumeTokens.has(k));
    const score = Math.round((present.length / baseline.length) * 100);
    if (present.length === 0) {
      findings.push("No common tech keywords detected. Add skills to the Skills section.");
    } else {
      positive.push(`Found ${present.length} common baseline keywords.`);
    }
    return {
      key: "keywords",
      label: "Keyword Coverage",
      score,
      weight: 0.25,
      findings,
      positiveSignals: positive,
      description: "Coverage of common baseline keywords. Paste a job description in the Tailor tab for a precise match score.",
    };
  }

  const kws = extractKeywords(jd);
  if (kws.length === 0) {
    return {
      key: "keywords",
      label: "Keyword Coverage",
      score: 0,
      weight: 0.25,
      findings: ["Job description has no detectable keywords. Paste a fuller JD."],
      positiveSignals: [],
      description: "Coverage of keywords extracted from the job description.",
    };
  }
  const present = kws.filter((k) => resumeTokens.has(k));
  const missing = kws.filter((k) => !resumeTokens.has(k));
  const score = Math.round((present.length / kws.length) * 100);
  if (present.length > 0) positive.push(`${present.length}/${kws.length} JD keywords present.`);
  if (missing.length > 0) findings.push(`Missing ${missing.length} keywords: ${missing.slice(0, 5).join(", ")}…`);
  if (score < 40) findings.push("Low match. Either tailor your resume to this JD, or apply to a closer-fit role.");

  return {
    key: "keywords",
    label: "Keyword Match",
    score,
    weight: 0.25,
    findings,
    positiveSignals: positive,
    description: "How many keywords from the job description appear in your resume.",
  };
}

function scoreFormatting(resume: ResumeData): DimensionScore {
  const findings: string[] = [];
  const positive: string[] = [];
  let score = 100;

  const bullets = bulletsOf(resume);
  if (bullets.length === 0) {
    score -= 30;
    findings.push("No bullet points. ATS scoring degrades without structured bullets.");
  } else {
    positive.push(`${bullets.length} structured bullets.`);
  }

  // Average bullet length
  const avgLen = bullets.reduce((acc, b) => acc + b.length, 0) / Math.max(1, bullets.length);
  if (avgLen > 250) { score -= 10; findings.push("Bullets are too long. Aim for 1-2 lines each."); }
  else if (avgLen < 30 && bullets.length > 0) { score -= 5; findings.push("Bullets are very short. Add more impact."); }

  // Section ordering
  if (resume.experience.length > 0 && resume.education.length > 0) positive.push("Standard section order: Experience, Education.");

  // Dates
  const noDates = resume.experience.filter((e) => !e.start || !e.end);
  if (noDates.length > 0) { score -= 8; findings.push(`${noDates.length} experience entries missing dates.`); }
  else if (resume.experience.length > 0) positive.push("All experience entries have dates.");

  // Skills list
  if (resume.skills.length < 5) { score -= 8; findings.push("Fewer than 5 skills listed. Add more."); }
  else if (resume.skills.length > 30) { score -= 5; findings.push("Skills list is very long. Group or trim."); }
  else positive.push(`${resume.skills.length} skills listed.`);

  return {
    key: "formatting",
    label: "Formatting Hygiene",
    score: Math.max(0, Math.min(100, score)),
    weight: 0.2,
    findings,
    positiveSignals: positive,
    description: "Section ordering, bullet structure, date completeness, and skill list length.",
  };
}

function scoreContent(resume: ResumeData): DimensionScore {
  const bullets = bulletsOf(resume);
  const findings: string[] = [];
  const positive: string[] = [];
  let score = 100;

  if (bullets.length === 0) {
    return {
      key: "content",
      label: "Content Quality",
      score: 0, weight: 0.25,
      findings: ["No bullets to score."], positiveSignals: [],
      description: "Bullets include quantified impact and specific accomplishments.",
    };
  }

  const quantified = bullets.filter(hasNumber);
  const quantPct = (quantified.length / bullets.length) * 100;

  if (quantPct >= 70) positive.push(`${Math.round(quantPct)}% of bullets include quantified impact.`);
  else if (quantPct >= 40) {
    score -= 10;
    findings.push(`Only ${Math.round(quantPct)}% of bullets have numbers. Aim for 70%+.`);
  } else {
    score -= 25;
    findings.push(`Just ${Math.round(quantPct)}% of bullets have numbers. Recruiters scan for metrics first.`);
  }

  // Average bullet length
  const avgWords = bullets.reduce((acc, b) => acc + b.split(/\s+/).length, 0) / bullets.length;
  if (avgWords < 8) { score -= 5; findings.push("Bullets feel thin. Add context: what you did, how, what happened."); }
  else if (avgWords > 35) { score -= 5; findings.push("Bullets are dense. Trim to 1-2 lines each."); }
  else positive.push("Bullet length is in the readable sweet spot.");

  // Action verbs at the start
  const weak = bullets.filter((b) => /^(was|were|is|are|had|has|helped|responsible for|duties included)\b/i.test(b.trim()));
  if (weak.length > 0) {
    score -= 8;
    findings.push(`${weak.length} bullet${weak.length > 1 ? "s" : ""} start with weak verbs. Lead with action verbs (Built, Led, Cut, Owned).`);
  } else {
    positive.push("All bullets lead with action verbs.");
  }

  // Generic phrases (humanizer)
  const text = bullets.join(" ");
  const generic = detectGenericPhrases(text);
  if (generic.length > 0) {
    score -= Math.min(20, generic.length * 4);
    findings.push(`${generic.length} generic phrase${generic.length > 1 ? "s" : ""} detected. See Humanizer tab.`);
  }

  return {
    key: "content",
    label: "Content Quality",
    score: Math.max(0, Math.min(100, score)),
    weight: 0.25,
    findings,
    positiveSignals: positive,
    description: "Bullets include quantified impact, lead with action verbs, and avoid generic phrasing.",
  };
}

export function runAts(resume: ResumeData, jd?: string | null): AtsReport {
  const jdNorm = jd?.trim() || null;
  const dims = {
    parseability: scoreParseability(resume, totalContent(resume)),
    keywords:     scoreKeywords(resume, jdNorm),
    formatting:   scoreFormatting(resume),
    content:      scoreContent(resume),
  };

  const overall = Math.round(
    dims.parseability.score * dims.parseability.weight +
    dims.keywords.score     * dims.keywords.weight +
    dims.formatting.score   * dims.formatting.weight +
    dims.content.score      * dims.content.weight,
  );

  const bullets = bulletsOf(resume);
  const quantified = bullets.filter(hasNumber).length;
  const flagged = detectGenericPhrases([
    resume.summary,
    ...bullets,
  ].join(" "));

  return {
    overall,
    dimensions: dims,
    humanizer: {
      genericPhraseCount: flagged.length,
      flaggedPhrases: flagged,
    },
    totalBullets: bullets.length,
    quantifiedBullets: quantified,
  };
}

export { GENERIC_PHRASES };
