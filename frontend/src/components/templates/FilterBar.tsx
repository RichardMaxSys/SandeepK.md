'use client'

import type { TemplateCategory } from '@/types/template'

interface FilterBarProps {
  categories: TemplateCategory[]
  activeCategory: string
  searchQuery: string
  tierFilter: 'all' | 'free' | 'pro'
  atsFilter: boolean
  resultCount: number
  totalCount: number
  onCategoryChange: (id: string) => void
  onSearchChange: (q: string) => void
  onTierChange: (t: 'all' | 'free' | 'pro') => void
  onATSToggle: () => void
  onClearAll: () => void
}

export default function FilterBar({
  categories,
  activeCategory,
  searchQuery,
  tierFilter,
  atsFilter,
  resultCount,
  totalCount,
  onCategoryChange,
  onSearchChange,
  onTierChange,
  onATSToggle,
  onClearAll,
}: FilterBarProps) {
  const filtersActive =
    activeCategory !== 'all' ||
    searchQuery !== '' ||
    tierFilter !== 'all' ||
    atsFilter

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 space-y-3">
      {/* Row 1: category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {/* All Templates pill */}
        <button
          onClick={() => onCategoryChange('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
            activeCategory === 'all'
              ? 'bg-teal-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-400'
          }`}
        >
          All Templates
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              activeCategory === cat.id
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Row 2: search + controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-full focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Tier segmented control */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0">
          {(['all', 'free', 'pro'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTierChange(t)}
              className={`px-3 py-2 text-xs font-medium capitalize transition ${
                tierFilter === t
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'all' ? 'All' : t === 'free' ? 'Free' : 'Pro'}
            </button>
          ))}
        </div>

        {/* ATS toggle */}
        <button
          onClick={onATSToggle}
          className={`shrink-0 px-3 py-2 text-xs font-medium rounded-lg border transition ${
            atsFilter
              ? 'bg-green-50 border-green-300 text-green-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
          }`}
        >
          {atsFilter ? '✓ ATS Safe only' : 'ATS Safe only'}
        </button>

        {/* Results count */}
        <span className="text-sm text-gray-400 ml-auto whitespace-nowrap shrink-0">
          Showing {resultCount} of {totalCount}
        </span>

        {/* Clear all button */}
        {filtersActive && (
          <button
            onClick={onClearAll}
            className="text-xs text-teal-600 hover:text-teal-700 underline cursor-pointer shrink-0"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
