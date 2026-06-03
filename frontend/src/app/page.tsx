'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { searchJobs, uploadResume, generatePackage, getPackages, triggerDryRun, approvePackage, type JobSearchFilters } from '@/lib/api';
import { Sidebar, MobileBottomNav, type ViewType } from '@/components/ui/sidebar';
import { Topbar } from '@/components/ui/topbar';
import { DashboardView } from '@/components/views/dashboard-view';
import { JobsView } from '@/components/views/jobs-view';
import { ResumeView } from '@/components/views/resume-view';
import { ATSView } from '@/components/views/ats-view';
import { ApplicationsView } from '@/components/views/applications-view';
import { SettingsView } from '@/components/views/settings-view';
import { ReviewPanel } from '@/components/ui/review-panel';

const viewTitles: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  jobs: 'Job Search',
  resume: 'Resume Builder',
  ats: 'ATS Analysis',
  applications: 'Application Tracker',
  settings: 'Settings',
};

const DEFAULT_FILTERS: JobSearchFilters = {
  location: 'Canada',
  job_type: '',
  salary_min: undefined,
  salary_max: undefined,
  max_days_old: undefined,
  sort_by: 'relevance',
  page: 1,
  results_per_page: 20,
};

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<JobSearchFilters>(DEFAULT_FILTERS);
  const [jobs, setJobs] = useState<any[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [selectedJobForATS, setSelectedJobForATS] = useState<any | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const data = await getPackages();
      setPackages(data);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    }
  };

  const executeSearch = useCallback(async (q: string, f: JobSearchFilters, append: boolean = false) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const result = await searchJobs(q, f);
      const newResults = result.results || [];
      if (append) {
        setJobs(prev => [...prev, ...newResults]);
      } else {
        setJobs(newResults);
      }
      setTotalJobs(result.total || 0);
      setTotalPages(result.total_pages || 1);
      setCurrentPage(result.page || 1);
      setActiveView('jobs');
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    const f = { ...filters, page: 1 };
    setFilters(f);
    executeSearch(searchQuery, f);
  }, [searchQuery, filters, executeSearch]);

  const handleFilterChange = useCallback((newFilters: JobSearchFilters) => {
    const merged = { ...filters, ...newFilters, page: 1 };
    setFilters(merged);
    executeSearch(searchQuery, merged);
  }, [filters, searchQuery, executeSearch]);

  const handlePageChange = useCallback((page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    setCurrentPage(page);
    executeSearch(searchQuery, newFilters);
  }, [filters, searchQuery, executeSearch]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await uploadResume(file);
      setResumeId(res.id);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTailor = async (jobId: number) => {
    if (!resumeId) return;
    try {
      await generatePackage(jobId, resumeId);
      fetchPackages();
      setActiveView('applications');
    } catch (err) {
      console.error('Tailoring failed:', err);
    }
  };

  const handleATSViewJob = useCallback((job: any) => {
    setSelectedJobForATS(job);
    setActiveView('ats');
  }, []);

  const handleApprove = async (packageId: number) => {
    try {
      await approvePackage(packageId);
      setSelectedPackage(null);
      fetchPackages();
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleSelectPackage = useCallback((pkg: any) => {
    setSelectedPackage(pkg);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'jobs':
        return (
          <JobsView
            jobs={jobs}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            onTailor={handleTailor}
            onATSViewJob={handleATSViewJob}
            resumeId={resumeId}
            filters={filters}
            onFilterChange={handleFilterChange}
            totalJobs={totalJobs}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        );
      case 'resume':
        return (
          <ResumeView
            resumeId={resumeId}
            loading={loading}
            onUpload={handleUpload}
          />
        );
      case 'ats':
        return <ATSView selectedPackage={selectedPackage} selectedJob={selectedJobForATS} resumeId={resumeId} jobs={jobs} />;
      case 'applications':
        return (
          <ApplicationsView
            packages={packages}
            onSelectPackage={handleSelectPackage}
          />
        );
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-charcoal">
      {/* Sidebar — fixed on mobile, static on desktop */}
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          title={viewTitles[activeView]}
          onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 lg:px-6 py-6 pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav activeView={activeView} onViewChange={setActiveView} />

      {/* Review panel modal overlay */}
      {selectedPackage && (
        <ReviewPanel
          pkg={selectedPackage}
          onClose={() => setSelectedPackage(null)}
          onApprove={handleApprove}
        />
      )}
    </div>
  );
}
