'use client'

import { useState, useRef } from 'react'
import type { Template, ColorVariant, FontOption } from '@/types/template'
import { getColorPresets } from '@/lib/templates'

interface CustomizePanelProps {
  template: Template
  selectedColor: ColorVariant
  selectedFont: FontOption
  spacing: 'compact' | 'normal' | 'spacious'
  layout: 'single' | 'two-column'
  enabledSections: string[]
  sectionOrder: string[]
  onColorChange: (v: ColorVariant) => void
  onFontChange: (f: FontOption) => void
  onSpacingChange: (s: 'compact' | 'normal' | 'spacious') => void
  onLayoutChange: (l: 'single' | 'two-column') => void
  onSectionsChange: (sections: string[]) => void
  onSectionReorder: (sections: string[]) => void
}

/* ------------------------------------------------------------------ */
/*  Lock icon (12×14 padlock)                                          */
/* ------------------------------------------------------------------ */

function LockIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 10 12" fill="none">
      <rect x="1" y="5" width="8" height="7" rx="1" fill="#9CA3AF" />
      <path
        d="M3 5V3.5a2 2 0 0 1 4 0V5"
        stroke="#9CA3AF"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Section label helper                                               */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      {children}
    </p>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function CustomizePanel({
  template,
  selectedColor,
  selectedFont,
  spacing,
  layout,
  enabledSections,
  sectionOrder,
  onColorChange,
  onFontChange,
  onSpacingChange,
  onLayoutChange,
  onSectionsChange,
  onSectionReorder,
}: CustomizePanelProps) {
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [expandedColors, setExpandedColors] = useState(false)
  const dragIndex = useRef<number | null>(null)

  const colorPresets = getColorPresets()

  const hasLayoutChoice =
    template.layoutType.toLowerCase().includes('two') ||
    template.modernFeatures.hasColorSidebar

  function isLocked(name: string) {
    return name === 'Header'
  }

  function toggleSection(name: string) {
    if (isLocked(name)) return
    if (enabledSections.includes(name)) {
      onSectionsChange(enabledSections.filter((s) => s !== name))
    } else {
      onSectionsChange([...enabledSections, name])
    }
  }

  function handleDragStart(index: number) {
    return () => {
      dragIndex.current = index
    }
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setDropTarget(index)
  }

  function handleDrop(index: number) {
    return () => {
      if (dragIndex.current === null || dragIndex.current === index) {
        setDropTarget(null)
        return
      }
      const newOrder = [...sectionOrder]
      const [moved] = newOrder.splice(dragIndex.current, 1)
      newOrder.splice(index, 0, moved)
      onSectionReorder(newOrder)
      dragIndex.current = null
      setDropTarget(null)
    }
  }

  return (
    <div className="w-80 h-full overflow-y-auto bg-white border-l border-gray-100 flex flex-col">
      {/* ── COLOR THEME ── */}
      <div className="px-4 py-4 border-b border-gray-50">
        <SectionLabel>Color Theme</SectionLabel>

        {/* Primary variant swatches */}
        <div className="flex flex-wrap gap-2">
          {template.colorVariants.map((v) => (
            <button
              key={v.id}
              style={{ background: v.primary }}
              title={v.label}
              onClick={() => onColorChange(v)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                selectedColor.id === v.id
                  ? 'border-teal-600 scale-110 shadow-md'
                  : 'border-transparent hover:border-gray-300'
              }`}
            />
          ))}
        </div>

        {/* More colors disclosure */}
        <button
          onClick={() => setExpandedColors(!expandedColors)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-2"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`transition-transform ${expandedColors ? 'rotate-90' : ''}`}
          >
            <path d="M3 2l4 3-4 3" />
          </svg>
          More colors
        </button>

        {expandedColors && (
          <div className="flex flex-wrap gap-2 mt-3">
            {colorPresets.map((p) => (
              <button
                key={p.id}
                style={{ background: p.primary }}
                title={p.label}
                className="w-6 h-6 rounded-full border border-gray-200 hover:ring-2 hover:ring-teal-400"
              />
            ))}
          </div>
        )}

        <p className="text-xs text-center text-gray-500 mt-2">
          {selectedColor.label}
        </p>
      </div>

      {/* ── FONT STYLE ── */}
      <div className="px-4 py-4 border-b border-gray-50">
        <SectionLabel>Font Style</SectionLabel>

        <div className="grid grid-cols-2 gap-2">
          {template.fontOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onFontChange(opt)}
              className={`border rounded-xl p-3 cursor-pointer transition-all text-left ${
                selectedFont.id === opt.id
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-100 hover:border-gray-300 bg-white'
              }`}
            >
              <p
                className="text-2xl font-bold text-gray-800 leading-none"
                style={{ fontFamily: opt.display }}
              >
                Aa
              </p>
              <p className="text-xs font-medium text-gray-700 mt-1 truncate">
                {opt.display}
              </p>
              <p className="text-xs text-gray-400 truncate">{opt.body}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── LAYOUT ── */}
      {hasLayoutChoice && (
        <div className="px-4 py-4 border-b border-gray-50">
          <SectionLabel>Layout</SectionLabel>

          <div className="grid grid-cols-2 gap-2">
            {/* Single column */}
            <button
              onClick={() => onLayoutChange('single')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                layout === 'single'
                  ? 'bg-teal-600 text-white border border-teal-600'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-400'
              }`}
            >
              <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor">
                <rect x="1" y="1" width="14" height="18" rx="2" />
              </svg>
              Single Column
            </button>

            {/* Two column */}
            <button
              onClick={() => onLayoutChange('two-column')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition ${
                layout === 'two-column'
                  ? 'bg-teal-600 text-white border border-teal-600'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-400'
              }`}
            >
              <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor">
                <rect x="1" y="1" width="5.5" height="18" rx="1.5" />
                <rect x="9.5" y="1" width="5.5" height="18" rx="1.5" />
              </svg>
              Two Column
            </button>
          </div>
        </div>
      )}

      {/* ── SPACING ── */}
      <div className="px-4 py-4 border-b border-gray-50">
        <SectionLabel>Spacing</SectionLabel>

        <div className="grid grid-cols-3 gap-1.5">
          {(['compact', 'normal', 'spacious'] as const).map((s) => (
            <button
              key={s}
              onClick={() => onSpacingChange(s)}
              className={`text-xs font-medium py-2 rounded-lg transition capitalize ${
                spacing === s
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTIONS ── */}
      <div className="px-4 py-4 border-b border-gray-50">
        <SectionLabel>Resume Sections</SectionLabel>

        <div className="space-y-0.5">
          {sectionOrder.map((name, index) => {
            const locked = isLocked(name)
            const enabled = enabledSections.includes(name) || locked

            return (
              <div
                key={name}
                draggable={!locked}
                onDragStart={handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop(index)}
                className={`flex items-center gap-2 py-2.5 px-2 rounded-lg hover:bg-gray-50 transition ${
                  dropTarget === index ? 'border-t-2 border-teal-500' : ''
                } ${locked ? 'opacity-80' : 'cursor-grab active:cursor-grabbing'}`}
              >
                {/* Drag handle */}
                {!locked && (
                  <svg
                    width="10"
                    height="14"
                    viewBox="0 0 10 14"
                    fill="none"
                    className="shrink-0"
                  >
                    <circle cx="3" cy="3" r="1.2" fill="#9CA3AF" />
                    <circle cx="7" cy="3" r="1.2" fill="#9CA3AF" />
                    <circle cx="3" cy="7" r="1.2" fill="#9CA3AF" />
                    <circle cx="7" cy="7" r="1.2" fill="#9CA3AF" />
                    <circle cx="3" cy="11" r="1.2" fill="#9CA3AF" />
                    <circle cx="7" cy="11" r="1.2" fill="#9CA3AF" />
                  </svg>
                )}

                {/* Toggle switch */}
                <button
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => toggleSection(name)}
                  disabled={locked}
                  className={`relative inline-flex w-8 h-[18px] rounded-full transition-colors shrink-0 ${
                    enabled ? 'bg-teal-500' : 'bg-gray-200'
                  } ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${
                      enabled ? 'translate-x-[15px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                {/* Section name */}
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {name}
                </span>

                {/* Lock icon */}
                {locked && <LockIcon />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
