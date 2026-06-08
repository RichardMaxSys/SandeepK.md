'use client'

/**
 * TemplatePreviewModal.tsx
 *
 * IMPORTANT — why this modal does NOT use the PNG thumbnail:
 * The left panel must respond to the colour-variant and font switchers in REAL TIME.
 * A static PNG can't recolour, so the modal keeps the live CSS <TemplatePreview>.
 * Only the grid CARDS use the PNGs (for fast, realistic browsing).
 *
 * This is a reference implementation. If you already have a modal, the only rule is:
 *   - Cards  → <img src="/thumbnails/{slug}.png">  (static, fast)
 *   - Modal  → <TemplatePreview ... />              (live, recolourable)
 *
 * No localStorage is used anywhere (safe for sandboxed iframes); the selected
 * colour variant and font live in React state and are passed down as props.
 */

import { useState } from 'react'
import TemplatePreview from '@/components/templates/TemplatePreview'
import type { Template, ColorVariant, FontOption } from '@/types/template'

interface TemplatePreviewModalProps {
  template: Template | null
  isOpen: boolean
  onClose: () => void
  onUse: (template: Template, variant: ColorVariant, font: FontOption) => void
}

export default function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onUse,
}: TemplatePreviewModalProps) {
  // Live customization state — defaults to the template's own palette/font.
  const [variantId, setVariantId] = useState<string>('default')
  const [fontId, setFontId] = useState<string>('default')

  if (!isOpen || !template) return null

  const activeVariant =
    template.colorVariants?.find((v) => v.id === variantId) ??
    template.colorVariants?.[0] ?? {
      id: 'default',
      label: 'Original',
      ...template.colorPalette,
    }

  const activeFont =
    template.fontOptions?.find((f) => f.id === fontId) ??
    template.fontOptions?.[0] ?? {
      id: 'default',
      label: 'Default',
      display: template.fontPairing.display,
      body: template.fontPairing.body,
    }

  // Merge the chosen variant/font into a template object the preview can render live.
  const livePreviewTemplate: Template = {
    ...template,
    colorPalette: {
      name: activeVariant.label,
      primary: activeVariant.primary,
      accent: activeVariant.accent,
      neutral: activeVariant.neutral,
      text: activeVariant.text,
    },
    fontPairing: {
      ...template.fontPairing,
      display: activeFont.display,
      body: activeFont.body,
    },
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT — live recolourable preview */}
        <div className="hidden flex-1 items-start justify-center overflow-y-auto bg-gray-100 p-6 md:flex">
          <div className="w-full max-w-md shadow-lg">
            <TemplatePreview template={livePreviewTemplate} size="modal" />
          </div>
        </div>

        {/* RIGHT — controls */}
        <div className="flex w-full flex-col md:w-80">
          <div className="flex items-start justify-between border-b border-gray-100 p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{template.name}</h2>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                {template.category} · {template.tier}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-2.5 py-1 text-gray-500 hover:bg-gray-200"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* Colours */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Colour
              </p>
              <div className="flex flex-wrap gap-2">
                {template.colorVariants?.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    title={v.label}
                    onClick={() => setVariantId(v.id)}
                    className={`h-8 w-8 rounded-full ring-2 transition ${
                      variantId === v.id ? 'ring-teal-500' : 'ring-transparent'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${v.primary} 50%, ${v.accent} 50%)`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Fonts */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Font
              </p>
              <div className="grid grid-cols-2 gap-2">
                {template.fontOptions?.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontId(f.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                      fontId === f.id
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="block font-semibold">{f.label}</span>
                    <span className="block text-[10px] text-gray-400">
                      {f.display}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Meta */}
            <div className="space-y-1.5 text-xs text-gray-600">
              <div>
                <span className="font-semibold text-gray-700">Best for: </span>
                {template.bestUse}
              </div>
              <div>
                <span className="font-semibold text-gray-700">ATS: </span>
                {template.atsRating} · Readability {template.recruiterReadability}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 p-5">
            <button
              type="button"
              onClick={() => onUse(template, activeVariant, activeFont)}
              className="w-full rounded-lg bg-teal-600 py-2.5 font-medium text-white hover:bg-teal-700"
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
