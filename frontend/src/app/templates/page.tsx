'use client'

import { useMemo, useState, useEffect } from 'react'
import { getAllTemplates, getCategories } from '@/lib/templates'
import type { Template } from '@/types/template'
import FilterBar from '@/components/templates/FilterBar'
import TemplateCard from '@/components/templates/TemplateCard'
import TemplatePreviewModal from '@/components/templates/TemplatePreviewModal'

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro'>('all')
  const [atsFilter, setAtsFilter] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
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

  // Reset visible count when filters change
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

  function handleSelect(template: Template) {
    console.log('Selected:', template.name)
    setPreviewTemplate(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="pt-8 pb-4 px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Resume Templates</h1>
        <p className="text-gray-500 mt-2 text-base">
          200 professionally designed templates. ATS-safe, modern, and fully
          customizable.
        </p>
      </div>

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

      <main className="max-w-7xl mx-auto px-4 py-6">
        {filteredTemplates.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {visibleTemplates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onUse={handleSelect}
                  onPreview={setPreviewTemplate}
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
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gray-300"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-gray-500 text-base">
              No templates match your filters
            </p>
            <button
              onClick={handleClearAll}
              className="border border-teal-600 text-teal-600 hover:bg-teal-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleSelect}
      />
    </div>
  )
}
