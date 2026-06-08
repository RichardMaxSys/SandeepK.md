// frontend/src/types/template.ts
// Shared types for the resume-template system.
// Matches the shape of resume-templates-200-modern.json.

export interface ColorPalette {
  name: string
  primary: string
  accent: string
  neutral: string
  text: string
}

export interface ColorVariant {
  id: string
  label: string
  primary: string
  accent: string
  neutral: string
  text: string
}

export interface FontPairing {
  display: string
  body: string
  note?: string
}

export interface FontOption {
  id: string
  label: string
  display: string
  body: string
}

export interface SectionOptions {
  available: string[]
  defaultEnabled: string[]
}

export interface ModernFeatures {
  hasColorSidebar: boolean
  hasDarkHeader: boolean
  hasAccentRules: boolean
  hasPhotoSupport: boolean
  hasSkillBars: boolean
  hasIconContacts: boolean
  hasTimeline: boolean
  hasBentoGrid: boolean
}

export type Rating = 'High' | 'Medium' | 'Low'
export type Tier = 'Free' | 'Pro'

export interface Template {
  id: number
  name: string
  slug: string
  category: string
  tags: string[]
  tier: Tier
  pageOptions: string
  layoutType: string
  targetUser: string
  atsRating: Rating
  premiumRating: number
  uniquenessRating: number
  recruiterReadability: Rating
  bestUse: string
  colorPalette: ColorPalette
  colorVariants: ColorVariant[]
  fontPairing: FontPairing
  fontOptions: FontOption[]
  sections: string[]
  sectionOptions: SectionOptions
  thumbnailDescription: string
  thumbnailStyle: string
  designNotes: string
  modernFeatures: ModernFeatures
}

export interface TemplatesFile {
  version: string
  generated: string
  count: number
  categories: { id: string; label: string; icon: string }[]
  colorPresets: ColorVariant[]
  fontFamilies: FontOption[]
  templates: Template[]
}

/* -------------------------------------------------------------------------- */
/*  Backward-compat aliases for code still using old names                   */
/* -------------------------------------------------------------------------- */

export type TemplateCategory = { id: string; label: string; icon: string }
export type ColorPreset = ColorVariant
export type FontFamily = FontOption
export type TemplatesData = TemplatesFile
