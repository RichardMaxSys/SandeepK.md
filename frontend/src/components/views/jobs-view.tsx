'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Badge, cn } from '@/components/ui/base';
import type { JobSearchFilters } from '@/lib/api';
import {
  Search, MapPin, DollarSign, ExternalLink, Building, Loader2, Sparkles,
  X, SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight,
  MapPinned, Briefcase, Clock, ClipboardCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Job {
  id?: number;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  salary_min?: number;
  salary_max?: number;
  url?: string;
  match_score?: number;
  tags?: string[];
  posted_date?: string;
  job_type?: string;
  description?: string;
}

interface JobsViewProps {
  jobs: Job[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearch: () => void;
  onTailor: (jobId: number) => void;
  onATSViewJob?: (job: Job) => void;
  resumeId: number | null;
  filters: JobSearchFilters;
  onFilterChange: (filters: JobSearchFilters) => void;
  totalJobs: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const LOCATION_PILLS = [
  { label: 'All Canada', value: 'Canada' },
  { label: 'Remote', value: 'Remote' },
  { label: 'Toronto, ON', value: 'Toronto' },
  { label: 'Vancouver, BC', value: 'Vancouver' },
  { label: 'Montreal, QC', value: 'Montreal' },
  { label: 'Calgary, AB', value: 'Calgary' },
  { label: 'Ottawa, ON', value: 'Ottawa' },
  { label: 'Edmonton, AB', value: 'Edmonton' },
  { label: 'Winnipeg, MB', value: 'Winnipeg' },
  { label: 'Halifax, NS', value: 'Halifax' },
];

function formatPostedDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

function getScoreGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'A', color: '#10b981' };
  if (score >= 80) return { grade: 'B', color: '#10b981' };
  if (score >= 70) return { grade: 'C', color: '#f59e0b' };
  if (score >= 60) return { grade: 'D', color: '#f59e0b' };
  return { grade: 'F', color: '#ef4444' };
}

function ScoreBadge({ score }: { score: number }) {
  const { grade, color } = getScoreGrade(score);
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {grade}
      </div>
      <span className="text-xs font-semibold text-gray-400">{score}%</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 bg-surface-lighter rounded" />
          <div className="h-4 w-1/2 bg-surface-lighter rounded" />
          <div className="h-4 w-1/3 bg-surface-lighter rounded" />
        </div>
        <div className="w-9 h-9 rounded-lg bg-surface-lighter" />
      </div>
      <div className="h-4 w-2/3 bg-surface-lighter rounded mb-3" />
      <div className="h-4 w-1/4 bg-surface-lighter rounded mb-3" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-surface-lighter rounded-full" />
        <div className="h-6 w-20 bg-surface-lighter rounded-full" />
        <div className="h-6 w-14 bg-surface-lighter rounded-full" />
      </div>
      <div className="h-9 w-full bg-surface-lighter rounded-lg" />
    </Card>
  );
}

// --- Filter Sidebar Component ---

function FilterSidebar({
  filters,
  onFilterChange,
  onClose,
  isMobile,
}: {
  filters: JobSearchFilters;
  onFilterChange: (f: JobSearchFilters) => void;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const [localFilters, setLocalFilters] = useState(filters);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const updateFilter = useCallback((key: keyof JobSearchFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange({ ...localFilters, [key]: value });
    }, 500);
  }, [localFilters, onFilterChange]);

  const clearAll = useCallback(() => {
    const cleared: JobSearchFilters = { location: 'Canada', page: 1, results_per_page: 20 };
    setLocalFilters(cleared);
    onFilterChange(cleared);
  }, [onFilterChange]);

  // Sync external filter changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const dateOptions = [
    { label: 'Any time', value: undefined },
    { label: 'Last 24 hours', value: 1 },
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 14 days', value: 14 },
    { label: 'Last 30 days', value: 30 },
  ];

  return (
    <div className={cn('space-y-5', isMobile && 'p-4')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <SlidersHorizontal size={16} />
          Filters
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Date Posted */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Date Posted</h4>
        <div className="space-y-2">
          {dateOptions.map(opt => (
            <label key={opt.label} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={cn(
                'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                localFilters.max_days_old === opt.value
                  ? 'border-teal bg-teal'
                  : 'border-gray-500 group-hover:border-gray-400'
              )}>
                {localFilters.max_days_old === opt.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-charcoal" />
                )}
              </div>
              <input
                type="radio"
                name="dateFilter"
                className="sr-only"
                checked={localFilters.max_days_old === opt.value}
                onChange={() => updateFilter('max_days_old', opt.value)}
              />
              <span className="text-sm text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-surface-border" />

      {/* Job Type */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Job Type</h4>
        <div className="space-y-2">
          {[
            { label: 'Full-time', value: 'full-time' },
            { label: 'Part-time', value: 'part-time' },
            { label: 'Contract', value: 'contract' },
            { label: 'Internship', value: 'internship' },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={cn(
                'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                localFilters.job_type === opt.value
                  ? 'border-teal bg-teal'
                  : 'border-gray-500 group-hover:border-gray-400'
              )}>
                {localFilters.job_type === opt.value && (
                  <X size={10} className="text-charcoal" strokeWidth={3} />
                )}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={localFilters.job_type === opt.value}
                onChange={() => updateFilter('job_type', localFilters.job_type === opt.value ? '' : opt.value)}
              />
              <span className="text-sm text-gray-300">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-surface-border" />

      {/* Salary Range */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Salary</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-graphite text-gray-200 placeholder:text-gray-500 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none"
            value={localFilters.salary_min ?? ''}
            onChange={(e) => updateFilter('salary_min', e.target.value ? Number(e.target.value) : undefined)}
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            className="w-full px-3 py-2 text-sm rounded-lg border border-surface-border bg-graphite text-gray-200 placeholder:text-gray-500 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none"
            value={localFilters.salary_max ?? ''}
            onChange={(e) => updateFilter('salary_max', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      <div className="h-px bg-surface-border" />

      {/* Location */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Location</h4>
        <div className="relative">
          <MapPinned size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="City or province"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-border bg-graphite text-gray-200 placeholder:text-gray-500 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none"
            value={localFilters.location || ''}
            onChange={(e) => updateFilter('location', e.target.value || undefined)}
          />
        </div>
      </div>

      {/* Clear All */}
      <Button variant="outline" className="w-full text-xs" onClick={clearAll}>
        Reset All Filters
      </Button>
    </div>
  );
}

// --- Main Jobs View ---

export function JobsView({
  jobs,
  loading,
  searchQuery,
  onSearchChange,
  onSearch,
  onTailor,
  onATSViewJob,
  resumeId,
  filters,
  onFilterChange,
  totalJobs,
  totalPages,
  currentPage,
  onPageChange,
}: JobsViewProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [locationInput, setLocationInput] = useState(filters.location || 'Canada');

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchSubmit();
  };

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '...' : text;

  // Generate pagination range
  const getPageRange = () => {
    const range: (number | string)[] = [];
    const showPages = 5;
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);
    if (end - start < showPages - 1) start = Math.max(1, end - showPages + 1);
    if (start > 1) range.push(1);
    if (start > 2) range.push('...');
    for (let i = start; i <= end; i++) range.push(i);
    if (end < totalPages - 1) range.push('...');
    if (end < totalPages) range.push(totalPages);
    return range;
  };

  const handleLocationPill = (location: string) => {
    setLocationInput(location);
    onFilterChange({ ...filters, location: location === 'Canada' ? undefined : location, page: 1 });
  };

  return (
    <div className="pb-8 space-y-0">
      {/* === TOP SEARCH BAR (Indeed.ca style, sticky) === */}
      <div className="sticky top-0 z-10 -mx-4 lg:-mx-6 px-4 lg:px-6 pt-0 pb-4 bg-charcoal/95 backdrop-blur-sm">
        <form onSubmit={handleSearchSubmit}>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* What field */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                className="w-full h-12 pl-11 pr-4 text-sm rounded-lg border border-surface-border bg-graphite text-gray-200 placeholder:text-gray-500 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none transition-all"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            {/* Where field */}
            <div className="relative sm:w-56">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="City or province"
                className="w-full h-12 pl-10 pr-4 text-sm rounded-lg border border-surface-border bg-graphite text-gray-200 placeholder:text-gray-500 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none transition-all"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onBlur={() => {
                  if (locationInput !== (filters.location || 'Canada')) {
                    onFilterChange({ ...filters, location: locationInput || undefined, page: 1 });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && locationInput !== (filters.location || 'Canada')) {
                    onFilterChange({ ...filters, location: locationInput || undefined, page: 1 });
                  }
                }}
              />
            </div>
            <Button type="submit" disabled={loading} className="h-12 px-8 text-base">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              Find Jobs
            </Button>
          </div>
        </form>
      </div>

      <div className="flex gap-6">
        {/* === LEFT FILTER SIDEBAR (desktop) === */}
        <div className="hidden lg:block w-[240px] shrink-0">
          <div className="sticky top-24">
            <FilterSidebar filters={filters} onFilterChange={onFilterChange} />
          </div>
        </div>

        {/* === RESULTS AREA === */}
        <div className="flex-1 min-w-0">
          {/* Location Quick Pills */}
          {!loading && jobs.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {LOCATION_PILLS.map((pill) => {
                  const isActive = pill.value === 'Canada'
                    ? !filters.location || filters.location === 'Canada'
                    : filters.location === pill.value;
                  return (
                    <button
                      key={pill.value}
                      onClick={() => handleLocationPill(pill.value)}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-full border transition-all duration-200',
                        isActive
                          ? 'bg-teal/15 border-teal/40 text-teal font-medium'
                          : 'bg-surface-card border-surface-border text-gray-400 hover:text-gray-200 hover:border-gray-500'
                      )}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results header */}
          {!loading && (totalJobs > 0 || jobs.length > 0) && (
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-sm text-gray-400">
                <span className="text-white font-semibold">{totalJobs.toLocaleString()}</span> jobs found
                {searchQuery && <> for <span className="text-teal font-medium">&ldquo;{searchQuery}&rdquo;</span></>}
              </p>
              <div className="flex items-center gap-3">
                {/* Mobile filter toggle */}
                <button
                  className="lg:hidden flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-surface-border"
                  onClick={() => setShowMobileFilters(true)}
                >
                  <SlidersHorizontal size={14} />
                  Filters
                </button>
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Sort by:</label>
                  <select
                    className="text-xs bg-graphite border border-surface-border text-gray-300 rounded-lg px-2.5 py-1.5 focus:border-teal focus:outline-none"
                    value={filters.sort_by || 'relevance'}
                    onChange={(e) => onFilterChange({ ...filters, sort_by: e.target.value, page: 1 })}
                  >
                    <option value="relevance">Most relevant</option>
                    <option value="date">Most recent</option>
                    <option value="salary">Highest salary</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          <AnimatePresence mode="wait">
            {jobs.length === 0 && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-lighter flex items-center justify-center">
                  <Search size={28} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No jobs found</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Try broadening your search — adjust filters, try different keywords, or remove location constraints.
                </p>
              </motion.div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <motion.div key="loading" className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => <SkeletonCard key={i} />)}
              </motion.div>
            )}

            {/* Job Cards */}
            {!loading && jobs.length > 0 && (
              <motion.div key="results" className="space-y-3">
                {jobs.map((job, index) => {
                  const score = job.match_score ?? 75;
                  const { color } = getScoreGrade(score);

                  return (
                    <motion.div
                      key={job.id ?? `${job.title}-${job.company}-${index}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    >
                      <Card
                        hover
                        className="p-5 border-l-4 transition-all duration-200 cursor-pointer"
                        style={{ borderLeftColor: color }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Title + Company */}
                            <h3 className="text-base font-semibold text-white mb-0.5 truncate">
                              {job.title}
                            </h3>
                            <p className="text-sm text-gray-400 mb-2">{job.company || 'Unknown'}</p>

                            {/* Location + Salary + Type */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 text-sm">
                              {job.location && (
                                <span className="flex items-center gap-1.5 text-gray-400">
                                  <MapPin size={13} />
                                  {job.location}
                                </span>
                              )}
                              {job.salary && (
                                <span className="flex items-center gap-1.5 font-semibold text-gray-200">
                                  <DollarSign size={13} />
                                  {job.salary}
                                </span>
                              )}
                              {job.job_type && (
                                <span className="flex items-center gap-1.5 text-gray-400">
                                  <Briefcase size={13} />
                                  {job.job_type}
                                </span>
                              )}
                            </div>

                            {/* Description snippet */}
                            {job.description && (
                              <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
                                {truncate(job.description.replace(/<[^>]*>/g, ''), 200)}
                              </p>
                            )}

                            {/* Tags */}
                            {job.tags && job.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                {job.tags.slice(0, 5).map((tag) => (
                                  <Badge key={tag} variant="default" className="text-[10px]">{tag}</Badge>
                                ))}
                                {job.tags.length > 5 && (
                                  <Badge variant="default" className="text-[10px]">+{job.tags.length - 5}</Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right column: score + date */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <ScoreBadge score={score} />
                            {job.posted_date && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                                <Clock size={11} />
                                {formatPostedDate(job.posted_date)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom actions */}
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-surface-border">
                          <Button
                            className="flex-1 text-xs h-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTailor(job.id ?? index);
                            }}
                            disabled={!resumeId}
                            title={!resumeId ? 'Upload a resume first' : 'Tailor resume for this job'}
                          >
                            <Sparkles size={13} />
                            Tailor Resume
                          </Button>
                          <Button
                            variant="outline"
                            className="text-xs h-9"
                            onClick={(e) => {
                              e.stopPropagation();
                              onATSViewJob?.(job);
                            }}
                            title="Analyze with ATS"
                          >
                            <ClipboardCheck size={13} />
                            <span className="hidden sm:inline">ATS Analysis</span>
                            <span className="sm:hidden">ATS</span>
                          </Button>
                          {job.url && (
                            <Button
                              variant="outline"
                              className="text-xs h-9 px-3"
                              onClick={(e) => { e.stopPropagation(); window.open(job.url, '_blank'); }}
                            >
                              <ExternalLink size={14} />
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* === PAGINATION === */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                className="h-9 px-3 text-xs"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {getPageRange().map((page, i) =>
                  typeof page === 'string' ? (
                    <span key={`dots-${i}`} className="px-1 text-xs text-gray-500">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={cn(
                        'w-8 h-9 rounded-lg text-xs font-medium transition-colors',
                        page === currentPage
                          ? 'bg-teal text-charcoal'
                          : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                      )}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                className="h-9 px-3 text-xs"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* === MOBILE FILTERS MODAL === */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileFilters(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 inset-x-0 max-h-[80vh] overflow-y-auto bg-surface-card rounded-t-2xl border-t border-surface-border"
            >
              <FilterSidebar
                filters={filters}
                onFilterChange={onFilterChange}
                onClose={() => setShowMobileFilters(false)}
                isMobile
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
