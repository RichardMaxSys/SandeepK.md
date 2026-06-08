import data from '@/data/resume-templates.json'
import type { Template, TemplatesData, TemplateCategory, ColorPreset, FontFamily, ColorVariant } from '@/types/template'

const typedData = data as TemplatesData

export function getAllTemplates(): Template[] {
  return typedData.templates
}

export function getTemplateBySlug(slug: string): Template | undefined {
  return typedData.templates.find((t) => t.slug === slug)
}

export function getTemplatesByCategory(categoryId: string): Template[] {
  if (categoryId === 'all') return typedData.templates
  return typedData.templates.filter((t) =>
    t.tags.includes(categoryId) || t.category.toLowerCase() === categoryId.toLowerCase()
  )
}

export function getFreeTemplates(): Template[] {
  return typedData.templates.filter((t) => t.tier === 'Free')
}

export function getProTemplates(): Template[] {
  return typedData.templates.filter((t) => t.tier === 'Pro')
}

export function getATSSafeTemplates(): Template[] {
  return typedData.templates.filter((t) => t.atsRating === 'High')
}

export function searchTemplates(query: string): Template[] {
  const q = query.toLowerCase()
  return typedData.templates.filter((t) =>
    t.name.toLowerCase().includes(q) ||
    t.tags.join(' ').toLowerCase().includes(q) ||
    t.targetUser.toLowerCase().includes(q) ||
    t.bestUse.toLowerCase().includes(q)
  )
}

export function getCategories(): TemplateCategory[] {
  return typedData.categories
}

export function getColorPresets(): ColorPreset[] {
  return typedData.colorPresets
}

export function getFontFamilies(): FontFamily[] {
  return typedData.fontFamilies
}

/* -------------------------------------------------------------------------- */
/*  TemplateDef — legacy shape used by Builder rendering code                 */
/* -------------------------------------------------------------------------- */

export interface TemplateDef {
  id: string
  name: string
  category: string
  tagline: string
  tier: 'free' | 'pro'
  style: {
    headerStyle: 'centered' | 'left' | 'sidebar' | 'banner' | 'split'
    accent: 'teal' | 'navy' | 'rose' | 'amber' | 'violet' | 'mono'
    density: 'compact' | 'comfortable' | 'spacious'
    font: 'sans' | 'serif' | 'mono'
  }
  atsRiskNote?: string
}

/* -------------------------------------------------------------------------- */
/*  Adapter: 200-template JSON catalog → TemplateDef                          */
/* -------------------------------------------------------------------------- */

function layoutTypeToHeaderStyle(layoutType: string): TemplateDef['style']['headerStyle'] {
  const lc = layoutType.toLowerCase()
  if (lc.includes('centered')) return 'centered'
  if (lc.includes('bold headline') || lc.includes('poster')) return 'banner'
  if (lc.includes('band') || (lc.includes('header') && lc.includes('dark'))) return 'banner'
  if (lc.includes('sidebar') || lc.includes('two-column') || lc.includes('coloured sidebar')) return 'sidebar'
  if (lc.includes('photo') && lc.includes('header')) return 'split'
  // Everything else: left-aligned (safest ATS default)
  return 'left'
}

function hexToAccent(hex: string): TemplateDef['style']['accent'] {
  // Attempt to parse RGB for a broader hue heuristic
  let r = 0, g = 0, b = 0
  try {
    const h = hex.replace('#', '')
    r = parseInt(h.substring(0, 2), 16)
    g = parseInt(h.substring(2, 4), 16)
    b = parseInt(h.substring(4, 6), 16)
  } catch { /* fall through to exact match */ }

  // Exact-hex match for known color-preset accent values
  const upper = hex.toUpperCase()
  // Teal / cyan / green-teal
  if (/^(#14B8A6|#0D9488|#2DD4BF|#5EEAD4|#22D3EE|#CCFBF1|#4ADE80|#6EE7B7|#22C55E|#10B981)$/i.test(upper)) return 'teal'
  // Navy / blue
  if (/^(#38BDF8|#0EA5E9|#0284C7|#0369A1|#1E3A5F|#1E40AF|#3B82F6|#60A5FA|#93C5FD|#2563EB)$/i.test(upper)) return 'navy'
  // Rose / pink / red
  if (/^(#F43F5E|#FB7185|#E11D48|#BE123C|#F87171|#FF6B6B)$/i.test(upper)) return 'rose'
  // Amber / gold / warm
  if (/^(#F59E0B|#D97706|#FBBF24|#FCD34D|#D6A461)$/i.test(upper)) return 'amber'
  // Violet / purple / lavender
  if (/^(#8B5CF6|#A78BFA|#C4B5FD|#7C3AED|#6D28D9)$/i.test(upper)) return 'violet'

  // RGB heuristic for unlisted colors
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const saturation = max === 0 ? 0 : (max - min) / max

  // Gray / low saturation → mono
  if (saturation < 0.2) return 'mono'

  // Determine which channel dominates
  const isRed   = r === max && g < 180
  const isGreen = g === max && (g - b) > 40
  const isBlue  = b === max
  const isWarm  = r > 200 && g > 150 && b < 150

  if (isRed) return 'rose'
  if (isGreen) return 'teal'
  if (isBlue) return r > 150 ? 'violet' : 'navy'
  if (isWarm) return 'amber'

  return 'teal'
}

function colorVariantsToAccent(variants: ColorVariant[]): TemplateDef['style']['accent'] {
  // Use the first (default) variant's accent color
  const defaultVar = variants.find((v) => v.id === 'default') ?? variants[0]
  if (!defaultVar) return 'teal'

  // Try accent first, then primary
  const hex = defaultVar.accent || defaultVar.primary || '#000000'
  return hexToAccent(hex)
}

function fontToFamily(fontOptions: Template['fontOptions']): TemplateDef['style']['font'] {
  const defaultFont = fontOptions.find((f) => f.id === 'default') ?? fontOptions[0]
  if (!defaultFont) return 'sans'
  const display = defaultFont.display.toLowerCase()
  const body = defaultFont.body.toLowerCase()

  // Check for monospace fonts
  if (/mono|jetbrains|fira code|source code pro/i.test(display) || /mono|jetbrains|fira code|source code pro/i.test(body))
    return 'mono'

  // Check for serif fonts
  if (/playfair|cormorant|lora|merriweather|garamond|times|palatino|georgia/i.test(display) || /playfair|cormorant|lora|merriweather|garamond/i.test(body))
    return 'serif'

  return 'sans'
}

function atsRatingToNote(atsRating: Template['atsRating'], layoutType: string): string | undefined {
  const lc = layoutType.toLowerCase()
  // Templates with decorative elements may have ATS issues
  if (atsRating === 'Low') {
    return 'This layout includes decorative elements that may not render in all ATS parsers — content is preserved in text-only views.'
  }
  if (atsRating === 'Medium' || lc.includes('sidebar') || lc.includes('timeline') || lc.includes('infographic') || lc.includes('bento')) {
    return 'Visual layout may not appear in all ATS parsers, but all content is preserved for text-only extraction.'
  }
  return undefined
}

function templateToTemplateDef(t: Template): TemplateDef {
  const headerStyle = layoutTypeToHeaderStyle(t.layoutType)
  const headerAccent = colorVariantsToAccent(t.colorVariants)
  const font = fontToFamily(t.fontOptions)
  const atsRiskNote = atsRatingToNote(t.atsRating, t.layoutType)

  return {
    id: t.slug,
    name: t.name,
    category: t.category,
    tagline: t.bestUse,
    tier: t.tier === 'Free' ? 'free' : 'pro',
    style: {
      headerStyle,
      accent: headerAccent,
      density: 'comfortable',
      font,
    },
    atsRiskNote,
  }
}

/* -------------------------------------------------------------------------- */
/*  Legacy 18-template fallback (backward compat for saved template IDs)      */
/* -------------------------------------------------------------------------- */

const LEGACY_TEMPLATES: TemplateDef[] = [
  {
    id: 'modern-minimal', name: 'Modern Minimal', category: 'Minimal',
    tagline: 'Clean, scannable, ATS-safe. The default for most job seekers.',
    tier: 'free', style: { headerStyle: 'centered', accent: 'teal', density: 'comfortable', font: 'sans' },
  },
  {
    id: 'tech-pro', name: 'Tech Pro', category: 'Tech',
    tagline: 'Engineer-friendly. Sidebar layout, mono accents, skills-forward.',
    tier: 'free', style: { headerStyle: 'sidebar', accent: 'navy', density: 'compact', font: 'sans' },
  },
  {
    id: 'executive', name: 'Executive', category: 'Executive',
    tagline: 'Serif typography, generous spacing. Built for senior roles.',
    tier: 'pro', style: { headerStyle: 'centered', accent: 'mono', density: 'spacious', font: 'serif' },
  },
  {
    id: 'designer', name: 'Designer', category: 'Creative',
    tagline: 'Color-forward, personality-driven. Best for creative roles.',
    tier: 'pro', style: { headerStyle: 'banner', accent: 'rose', density: 'comfortable', font: 'sans' },
    atsRiskNote: 'Color header is decorative — ATS still parses plain content underneath.',
  },
  {
    id: 'engineer-mono', name: 'Engineer Mono', category: 'Tech',
    tagline: 'Monospace headers, terminal-inspired. Reads like a README.',
    tier: 'free', style: { headerStyle: 'left', accent: 'teal', density: 'compact', font: 'mono' },
  },
  {
    id: 'compact', name: 'Compact', category: 'Minimal',
    tagline: 'Maximum information density. Great for 10+ year veterans.',
    tier: 'free', style: { headerStyle: 'left', accent: 'mono', density: 'compact', font: 'sans' },
  },
  {
    id: 'bold', name: 'Bold', category: 'Modern',
    tagline: 'Large headings, strong typographic hierarchy. Confident.',
    tier: 'pro', style: { headerStyle: 'centered', accent: 'amber', density: 'spacious', font: 'sans' },
  },
  {
    id: 'academic', name: 'Academic', category: 'Minimal',
    tagline: 'Formal, sectioned. Suited for research, academia, and CVs.',
    tier: 'pro', style: { headerStyle: 'centered', accent: 'mono', density: 'spacious', font: 'serif' },
  },
  {
    id: 'startup', name: 'Startup', category: 'Modern',
    tagline: 'Casual tone, lets personality show. Series-A friendly.',
    tier: 'free', style: { headerStyle: 'left', accent: 'violet', density: 'comfortable', font: 'sans' },
  },
  {
    id: 'corporate', name: 'Corporate', category: 'Professional',
    tagline: 'Traditional, conservative. The Fortune-500 default.',
    tier: 'free', style: { headerStyle: 'centered', accent: 'navy', density: 'comfortable', font: 'serif' },
  },
  {
    id: 'creative', name: 'Creative', category: 'Creative',
    tagline: 'Two-column with sidebar, photo-ready. For designers and PMs.',
    tier: 'pro', style: { headerStyle: 'split', accent: 'rose', density: 'comfortable', font: 'sans' },
    atsRiskNote: 'Sidebar layouts can confuse some ATS parsers — we render the right text-only version behind it.',
  },
  {
    id: 'data-pro', name: 'Data Pro', category: 'Tech',
    tagline: 'Metrics-forward, visual. Ideal for analysts and ML engineers.',
    tier: 'pro', style: { headerStyle: 'left', accent: 'teal', density: 'compact', font: 'sans' },
  },
  {
    id: 'two-tone', name: 'Two-Tone', category: 'Modern',
    tagline: 'Split color block in the header. Modern and distinctive.',
    tier: 'pro', style: { headerStyle: 'banner', accent: 'violet', density: 'comfortable', font: 'sans' },
  },
  {
    id: 'timeline', name: 'Timeline', category: 'Creative',
    tagline: 'Vertical timeline for experience. Visual storytelling.',
    tier: 'pro', style: { headerStyle: 'left', accent: 'teal', density: 'spacious', font: 'sans' },
    atsRiskNote: 'Decorative timeline elements are stripped on ATS export — content is preserved.',
  },
  {
    id: 'card', name: 'Card', category: 'Modern',
    tagline: 'Sectioned in soft cards. Clean, modern, easy to skim.',
    tier: 'free', style: { headerStyle: 'centered', accent: 'amber', density: 'comfortable', font: 'sans' },
  },
  {
    id: 'gradient', name: 'Gradient', category: 'Modern',
    tagline: 'Modern gradient header, sans-serif throughout. Eye-catching.',
    tier: 'pro', style: { headerStyle: 'banner', accent: 'teal', density: 'comfortable', font: 'sans' },
  },
  {
    id: 'monochrome', name: 'Monochrome', category: 'Minimal',
    tagline: 'Black and white only. Maximum contrast, zero distractions.',
    tier: 'free', style: { headerStyle: 'left', accent: 'mono', density: 'compact', font: 'sans' },
  },
  {
    id: 'european', name: 'European', category: 'Professional',
    tagline: 'Photo-ready, structured for EU job applications (incl. DE/FR).',
    tier: 'pro', style: { headerStyle: 'split', accent: 'navy', density: 'comfortable', font: 'serif' },
    atsRiskNote: 'Photo included by request — remove for ATS-strict US roles.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Primary exports — 200-template catalog adapted to TemplateDef             */
/* -------------------------------------------------------------------------- */

/** All 200 templates adapted to the legacy TemplateDef shape. */
export const TEMPLATES: TemplateDef[] = typedData.templates.map(templateToTemplateDef)

/**
 * Find a template by ID/slug.
 *
 * Search order:
 *   1. New 200-template catalog (by slug)
 *   2. Legacy 18-template fallback (by id — backward compat for saved IDs)
 *   3. First template in catalog as default
 */
export function getTemplate(id: string): TemplateDef | undefined {
  // 1. Search new catalog by slug
  const matched = typedData.templates.find((t) => t.slug === id)
  if (matched) return templateToTemplateDef(matched)

  // 2. Fall back to legacy template by id
  const legacy = LEGACY_TEMPLATES.find((t) => t.id === id)
  if (legacy) return legacy

  // 3. Default to first template
  if (typedData.templates.length > 0) return templateToTemplateDef(typedData.templates[0])

  return undefined
}

export function accentGradient(accent: TemplateDef['style']['accent']): string {
  const map: Record<string, string> = {
    teal: 'from-accent-500/30 to-sky-500/10',
    navy: 'from-sky-700/30 to-slate-700/10',
    rose: 'from-rose-500/30 to-pink-500/10',
    amber: 'from-amber-500/30 to-orange-500/10',
    violet: 'from-violet-500/30 to-indigo-500/10',
    mono: 'from-white/20 to-white/5',
  }
  return map[accent] ?? map.teal
}

export function accentSolid(accent: TemplateDef['style']['accent']): string {
  const map: Record<string, string> = {
    teal: 'bg-accent-500',
    navy: 'bg-sky-600',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
    mono: 'bg-white',
  }
  return map[accent] ?? map.teal
}
