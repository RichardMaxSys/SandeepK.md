/* -------------------------------------------------------------------------- */
/*                              Usage / rate limits                            */
/* -------------------------------------------------------------------------- */
/*                                                                              */
/* Free-tier limits. Enforced client-side for now (localStorage); the backend   */
/* becomes the source of truth once auth lands. The contract here is what the   */
/* backend will need to honor, so swapping in a server check is a one-liner.   */
/*                                                                              */

const STORAGE_KEY = "resumeelevate.usage.v1";

export type FeatureKey = "atsCheck" | "tailor" | "pdfExport";

export interface FeatureLimit {
  key: FeatureKey;
  label: string;
  /** How many uses per period */
  quota: number;
  /** "day" | "week" | "month" | "lifetime" */
  period: "day" | "week" | "month" | "lifetime";
  /** Soft hint for UI (e.g., "1 free check per day") */
  description: string;
}

export const LIMITS: Record<FeatureKey, FeatureLimit> = {
  atsCheck:  { key: "atsCheck",  label: "ATS Check",  quota: 1,  period: "day",      description: "1 free ATS check per day" },
  tailor:    { key: "tailor",    label: "Tailor",     quota: 1,  period: "week",     description: "1 free tailor scan per week" },
  pdfExport: { key: "pdfExport", label: "PDF Export", quota: 3,  period: "month",    description: "3 free PDF exports per month" },
};

interface UsageState {
  atsCheck:  number[];  // timestamps
  tailor:    number[];
  pdfExport: number[];
  proSince?: number;    // ms epoch; bypasses limits if set
}

/* ----------------------------- Storage ----------------------------- */

function read(): UsageState {
  if (typeof window === "undefined") return { atsCheck: [], tailor: [], pdfExport: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { atsCheck: [], tailor: [], pdfExport: [] };
    const parsed = JSON.parse(raw);
    return {
      atsCheck: Array.isArray(parsed.atsCheck) ? parsed.atsCheck : [],
      tailor: Array.isArray(parsed.tailor) ? parsed.tailor : [],
      pdfExport: Array.isArray(parsed.pdfExport) ? parsed.pdfExport : [],
      proSince: typeof parsed.proSince === "number" ? parsed.proSince : undefined,
    };
  } catch {
    return { atsCheck: [], tailor: [], pdfExport: [] };
  }
}

function write(state: UsageState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

/* ----------------------------- Period helpers ----------------------------- */

function periodStart(period: FeatureLimit["period"]): number {
  const now = new Date();
  if (period === "day") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  if (period === "week") {
    // Week starts Monday
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    return monday.getTime();
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }
  return 0; // lifetime
}

function filterToPeriod(timestamps: number[], period: FeatureLimit["period"]): number[] {
  const start = periodStart(period);
  return timestamps.filter((t) => t >= start);
}

/* ----------------------------- Public API ----------------------------- */

export function isPro(): boolean {
  // Dev override: check for a "resumeelevate.pro" flag in localStorage
  if (typeof window !== "undefined" && localStorage.getItem("resumeelevate.pro") === "true") {
    return true;
  }
  return typeof read().proSince === "number";
}

export function setPro(on: boolean): void {
  const s = read();
  if (on) s.proSince = Date.now();
  else delete s.proSince;
  write(s);
}

export function getUsage(feature: FeatureKey): { used: number; quota: number; remaining: number; resetsAt: number } {
  const limit = LIMITS[feature];
  const s = read();
  const used = filterToPeriod(s[feature], limit.period).length;
  return {
    used,
    quota: limit.quota,
    remaining: Math.max(0, limit.quota - used),
    resetsAt: nextReset(limit.period),
  };
}

export function canUse(feature: FeatureKey): boolean {
  if (isPro()) return true;
  return getUsage(feature).remaining > 0;
}

export function recordUse(feature: FeatureKey): { ok: boolean; reason?: "limit-reached" | "pro"; remaining: number } {
  if (isPro()) return { ok: true, reason: "pro", remaining: Infinity };
  const s = read();
  const filtered = filterToPeriod(s[feature], LIMITS[feature].period);
  if (filtered.length >= LIMITS[feature].quota) {
    return { ok: false, reason: "limit-reached", remaining: 0 };
  }
  s[feature] = [...filtered, Date.now()];
  write(s);
  return { ok: true, remaining: LIMITS[feature].quota - s[feature].length };
}

export function nextReset(period: FeatureLimit["period"]): number {
  const start = periodStart(period);
  if (period === "day")   return start + 24 * 60 * 60 * 1000;
  if (period === "week")  return start + 7 * 24 * 60 * 60 * 1000;
  if (period === "month") {
    const d = new Date(start);
    return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  }
  return Number.MAX_SAFE_INTEGER;
}

export function timeUntilReset(feature: FeatureKey): string {
  const ms = nextReset(LIMITS[feature].period) - Date.now();
  if (ms <= 0) return "now";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 1) {
    const mins = Math.floor(ms / (60 * 1000));
    return `${mins} min`;
  }
  if (hours < 24) return `${hours} hr`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}
