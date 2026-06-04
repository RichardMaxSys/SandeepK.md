/* -------------------------------------------------------------------------- */
/*                            Resume template library                         */
/* -------------------------------------------------------------------------- */

export type TemplateCategory = "minimal" | "modern" | "classic" | "creative" | "executive" | "technical";

export interface TemplateDef {
  id: string;
  name: string;
  category: TemplateCategory;
  tagline: string;
  /** Free vs paid; controls the lock state in the gallery */
  tier: "free" | "pro";
  /** Visual style hints for the preview card */
  style: {
    headerStyle: "centered" | "left" | "sidebar" | "banner" | "split";
    accent: "teal" | "navy" | "rose" | "amber" | "violet" | "mono";
    density: "compact" | "comfortable" | "spacious";
    font: "sans" | "serif" | "mono";
  };
  /** True if the layout has known ATS parsing limitations */
  atsRiskNote?: string;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    category: "minimal",
    tagline: "Clean, scannable, ATS-safe. The default for most job seekers.",
    tier: "free",
    style: { headerStyle: "centered", accent: "teal",   density: "comfortable", font: "sans"  },
  },
  {
    id: "tech-pro",
    name: "Tech Pro",
    category: "technical",
    tagline: "Engineer-friendly. Sidebar layout, mono accents, skills-forward.",
    tier: "free",
    style: { headerStyle: "sidebar",  accent: "navy",   density: "compact",    font: "sans"  },
  },
  {
    id: "executive",
    name: "Executive",
    category: "executive",
    tagline: "Serif typography, generous spacing. Built for senior roles.",
    tier: "pro",
    style: { headerStyle: "centered", accent: "mono",   density: "spacious",   font: "serif" },
  },
  {
    id: "designer",
    name: "Designer",
    category: "creative",
    tagline: "Color-forward, personality-driven. Best for creative roles.",
    tier: "pro",
    style: { headerStyle: "banner",   accent: "rose",   density: "comfortable", font: "sans" },
    atsRiskNote: "Color header is decorative — ATS still parses plain content underneath.",
  },
  {
    id: "engineer-mono",
    name: "Engineer Mono",
    category: "technical",
    tagline: "Monospace headers, terminal-inspired. Reads like a README.",
    tier: "free",
    style: { headerStyle: "left",     accent: "teal",   density: "compact",    font: "mono"  },
  },
  {
    id: "compact",
    name: "Compact",
    category: "minimal",
    tagline: "Maximum information density. Great for 10+ year veterans.",
    tier: "free",
    style: { headerStyle: "left",     accent: "mono",   density: "compact",    font: "sans"  },
  },
  {
    id: "bold",
    name: "Bold",
    category: "modern",
    tagline: "Large headings, strong typographic hierarchy. Confident.",
    tier: "pro",
    style: { headerStyle: "centered", accent: "amber",  density: "spacious",   font: "sans"  },
  },
  {
    id: "academic",
    name: "Academic",
    category: "classic",
    tagline: "Formal, sectioned. Suited for research, academia, and CVs.",
    tier: "pro",
    style: { headerStyle: "centered", accent: "mono",   density: "spacious",   font: "serif" },
  },
  {
    id: "startup",
    name: "Startup",
    category: "modern",
    tagline: "Casual tone, lets personality show. Series-A friendly.",
    tier: "free",
    style: { headerStyle: "left",     accent: "violet", density: "comfortable", font: "sans" },
  },
  {
    id: "corporate",
    name: "Corporate",
    category: "classic",
    tagline: "Traditional, conservative. The Fortune-500 default.",
    tier: "free",
    style: { headerStyle: "centered", accent: "navy",   density: "comfortable", font: "serif" },
  },
  {
    id: "creative",
    name: "Creative",
    category: "creative",
    tagline: "Two-column with sidebar, photo-ready. For designers and PMs.",
    tier: "pro",
    style: { headerStyle: "split",    accent: "rose",   density: "comfortable", font: "sans" },
    atsRiskNote: "Sidebar layouts can confuse some ATS parsers — we render the right text-only version behind it.",
  },
  {
    id: "data-pro",
    name: "Data Pro",
    category: "technical",
    tagline: "Metrics-forward, visual. Ideal for analysts and ML engineers.",
    tier: "pro",
    style: { headerStyle: "left",     accent: "teal",   density: "compact",    font: "sans"  },
  },
  {
    id: "two-tone",
    name: "Two-Tone",
    category: "modern",
    tagline: "Split color block in the header. Modern and distinctive.",
    tier: "pro",
    style: { headerStyle: "banner",   accent: "violet", density: "comfortable", font: "sans"  },
  },
  {
    id: "timeline",
    name: "Timeline",
    category: "creative",
    tagline: "Vertical timeline for experience. Visual storytelling.",
    tier: "pro",
    style: { headerStyle: "left",     accent: "teal",   density: "spacious",   font: "sans"  },
    atsRiskNote: "Decorative timeline elements are stripped on ATS export — content is preserved.",
  },
  {
    id: "card",
    name: "Card",
    category: "modern",
    tagline: "Sectioned in soft cards. Clean, modern, easy to skim.",
    tier: "free",
    style: { headerStyle: "centered", accent: "amber",  density: "comfortable", font: "sans" },
  },
  {
    id: "gradient",
    name: "Gradient",
    category: "modern",
    tagline: "Modern gradient header, sans-serif throughout. Eye-catching.",
    tier: "pro",
    style: { headerStyle: "banner",   accent: "teal",   density: "comfortable", font: "sans"  },
  },
  {
    id: "monochrome",
    name: "Monochrome",
    category: "minimal",
    tagline: "Black and white only. Maximum contrast, zero distractions.",
    tier: "free",
    style: { headerStyle: "left",     accent: "mono",   density: "compact",    font: "sans"  },
  },
  {
    id: "european",
    name: "European",
    category: "classic",
    tagline: "Photo-ready, structured for EU job applications (incl. DE/FR).",
    tier: "pro",
    style: { headerStyle: "split",    accent: "navy",   density: "comfortable", font: "serif" },
    atsRiskNote: "Photo included by request — remove for ATS-strict US roles.",
  },
];

/** Map accent name to a Tailwind gradient class for the preview thumbnail */
export function accentGradient(accent: TemplateDef["style"]["accent"]): string {
  switch (accent) {
    case "teal":   return "from-accent-500/30 to-sky-500/10";
    case "navy":   return "from-sky-700/30 to-slate-700/10";
    case "rose":   return "from-rose-500/30 to-pink-500/10";
    case "amber":  return "from-amber-500/30 to-orange-500/10";
    case "violet": return "from-violet-500/30 to-indigo-500/10";
    case "mono":   return "from-white/20 to-white/5";
  }
}

export function accentSolid(accent: TemplateDef["style"]["accent"]): string {
  switch (accent) {
    case "teal":   return "bg-accent-500";
    case "navy":   return "bg-sky-600";
    case "rose":   return "bg-rose-500";
    case "amber":  return "bg-amber-500";
    case "violet": return "bg-violet-500";
    case "mono":   return "bg-white";
  }
}

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
