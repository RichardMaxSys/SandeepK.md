'use client'

import { useMemo, useState, useEffect } from 'react'
import { getAllTemplates, getCategories } from '@/lib/templates'
import type { Template } from '@/types/template'
import FilterBar from '@/components/templates/FilterBar'
import TemplateCard from '@/components/templates/TemplateCard'

interface TemplateSelectorProps {
  onSelect: (template: Template) => void
  onSkip: () => void
}

export default function TemplateSelector({
  onSelect,
  onSkip,
}: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro'>('all')
  const [atsFilter, setAtsFilter] = useState(false)
  const [visibleCount, setVisibleCount] = useState(48)

  const allTemplates = getAllTemplates()
  const categories = getCategories()

  const filteredTemplates = useMemo(() => {
    let results = allTemplates
    if (activeCategory !== 'all') {
      results = results.filter(
        (t) =>
          t.tags.includes(activeCategory) ||
          t.category.toLowerCase() === activeCategory.toLowerCase(),
      )
    }
    if (tierFilter === 'free') results = results.filter((t) => t.tier === 'Free')
    if (tierFilter === 'pro') results = results.filter((t) => t.tier === 'Pro')
    if (atsFilter) results = results.filter((t) => t.atsRating === 'High')
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.tags.join(' ').toLowerCase().includes(q) ||
          t.targetUser.toLowerCase().includes(q) ||
          t.bestUse.toLowerCase().includes(q),
      )
    }
    return results
  }, [allTemplates, activeCategory, tierFilter, atsFilter, searchQuery])

  useEffect(() => {
    setVisibleCount(48)
  }, [activeCategory, tierFilter, atsFilter, searchQuery])

  const visibleTemplates = filteredTemplates.slice(0, visibleCount)

  function handleClearAll() {
    setActiveCategory('all')
    setSearchQuery('')
    setTierFilter('all')
    setAtsFilter(false)
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Choose your template</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Start with a design that fits your style
          </p>
        </div>
        <button
          onClick={onSkip}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          Skip — start with blank resume →
        </button>
      </div>

      {/* Filter bar */}
      <FilterBar
        categories={categories}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        tierFilter={tierFilter}
        atsFilter={atsFilter}
        resultCount={Math.min(visibleCount, filteredTemplates.length)}
        totalCount={filteredTemplates.length}
        onCategoryChange={(id) => setActiveCategory(id)}
        onSearchChange={(q) => setSearchQuery(q)}
        onTierChange={(t) => setTierFilter(t)}
        onATSToggle={() => setAtsFilter((v) => !v)}
        onClearAll={handleClearAll}
      />

      {/* Grid area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filteredTemplates.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleTemplates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onUse={() => onSelect(t)}
                  onPreview={() => {}}
                  ctaLabel="Start with this template →"
                />
              ))}
            </div>

            {filteredTemplates.length > visibleCount && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((v) => v + 48)}
                  className="border border-teal-600 text-teal-600 hover:bg-teal-50 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  Load 48 more ({filteredTemplates.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <svg
              width="48" height="48" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="1.5"
              className="text-gray-300"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-gray-500 text-base">No templates match your filters</p>
            <button
              onClick={handleClearAll}
              className="border border-teal-600 text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-center items-center gap-2">
        <span className="text-sm text-gray-400">Or skip and start with a blank resume</span>
        <button
          onClick={onSkip}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
        >
          Start blank →
        </button>
      </div>
    </div>
  )
}
