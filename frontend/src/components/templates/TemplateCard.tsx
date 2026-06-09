'use client'

import TemplatePreview from '@/components/templates/TemplatePreview'
import type { Template } from '@/types/template'

interface TemplateCardProps {
  template: Template
  isSelected?: boolean
  onPreview: (template: Template) => void
  onUse?: (template: Template) => void
  ctaLabel?: string
}

/**
 * TemplateCard
 * Renders a CSS-only resume preview using the template's actual color palette
 * and layout metadata. No image files needed — previews are generated from
 * colorPalette, modernFeatures, and layoutType fields in the JSON data.
 */
export default function TemplateCard({
  template,
  isSelected = false,
  onPreview,
  onUse,
  ctaLabel,
}: TemplateCardProps) {
  const tierBadgeClass =
    template.tier === 'Pro'
      ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
      : 'bg-teal-100 text-teal-700 ring-1 ring-teal-200'

  // Top 3 tags for the hover row
  const hoverTags = [
    template.atsRating === 'High' ? 'ATS-Safe' : null,
    template.tags?.includes('two-column') || template.tags?.includes('sidebar')
      ? 'Two-Column'
      : null,
    template.category,
  ]
    .filter(Boolean)
    .slice(0, 3) as string[]

  return (
    <div
      className={`group relative flex flex-col rounded-xl border bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isSelected
          ? 'border-teal-500 ring-2 ring-teal-500/40'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Preview area */}
      <div
        className="relative cursor-pointer overflow-hidden rounded-t-xl bg-gray-50"
        style={{ aspectRatio: '0.707' }}
        onClick={() => onPreview(template)}
      >
        <div className="h-full w-full">
          <TemplatePreview template={template} size="card" />
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierBadgeClass}`}
          >
            {template.tier}
          </span>
          {template.atsRating === 'High' && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 ring-1 ring-green-200">
              ATS
            </span>
          )}
        </div>

        {isSelected && (
          <div className="absolute right-2 top-2 rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Active
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
            Preview →
          </span>
          <div className="flex flex-wrap justify-center gap-1 px-3">
            {hoverTags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Card info */}
      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{template.name}</h3>
        </div>
        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-400">
          {template.category}
        </p>

        {/* Quick colour swatch row (first 6 colorVariants) */}
        {template.colorVariants && template.colorVariants.length > 0 && (
          <div className="mt-2.5 flex gap-1.5">
            {template.colorVariants.slice(0, 6).map((v) => (
              <span
                key={v.id}
                title={v.label}
                className="h-4 w-4 rounded-full ring-1 ring-black/10"
                style={{
                  background: `linear-gradient(135deg, ${v.primary} 50%, ${v.accent} 50%)`,
                }}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => (onUse ? onUse(template) : onPreview(template))}
          className="mt-3 w-full rounded-lg bg-teal-600 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
        >
          {ctaLabel ?? 'Use This Template'}
</button>
      </div>
    </div>
  )
}
