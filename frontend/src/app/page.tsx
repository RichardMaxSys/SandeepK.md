'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, cn } from '@/components/ui/base';
import { Search, Upload, FileText, CheckCircle, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { searchJobs, uploadResume, generatePackage, getPackages, triggerDryRun } from '@/lib/api';
import { ScoreChart, KeywordChart } from '@/components/ui/charts';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('find');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<number | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const data = await getPackages();
    setPackages(data);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchJobs(searchQuery);
      setJobs(results);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const res = await uploadResume(file);
      setResumeId(res.id);
      alert('Resume uploaded and parsed!');
    } finally {
      setLoading(false);
    }
  };

  const handleTailor = async (jobId: number) => {
    if (!resumeId) {
      alert('Please upload a resume first.');
      return;
    }
    await generatePackage(jobId, resumeId);
    alert('Tailoring started in background!');
    fetchPackages();
  };

  const handleDryRun = async (jobId: number) => {
    await triggerDryRun(jobId);
    alert('Dry run automation started!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Application Assistant</h1>
            <p className="text-gray-500">Professional Dashboard for Personal Career Growth</p>
          </div>
          <label className="cursor-pointer">
            <div className="flex gap-2 items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium">
              <Upload size={18} />
              {resumeId ? 'Update Resume' : 'Upload Master Resume'}
            </div>
            <input type="file" className="hidden" onChange={handleUpload} accept=".txt" />
          </label>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-2">
            <NavItem
              icon={<Search size={20} />}
              label="Find Jobs"
              active={activeTab === 'find'}
              onClick={() => setActiveTab('find')}
            />
            <NavItem
              icon={<FileText size={20} />}
              label="My Packages"
              active={activeTab === 'packages'}
              onClick={() => setActiveTab('packages')}
            />
            <NavItem
              icon={<CheckCircle size={20} />}
              label="Applied"
              active={activeTab === 'applied'}
              onClick={() => setActiveTab('applied')}
            />
          </aside>

          <main className="lg:col-span-3">
            {activeTab === 'find' && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search for roles (e.g. Senior Python Developer)"
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : 'Search'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map((job) => (
                    <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            <p className="text-gray-500">{job.company}</p>
                          </div>
                          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                            {job.match_score}% Match
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1 text-xs" onClick={() => handleTailor(job.id)}>Tailor Resume</Button>
                          <Button variant="outline" className="text-xs" onClick={() => handleDryRun(job.id)}>Dry Run</Button>
                          <Button variant="outline" className="text-xs" onClick={() => window.open(job.url, '_blank')}>
                            <ExternalLink size={14} />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'packages' && (
              <div className="space-y-4">
                {packages.length === 0 ? (
                  <Card className="p-12 text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No application packages generated yet.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setActiveTab('find')}>
                      Find Jobs to Start
                    </Button>
                  </Card>
                ) : (
                  packages.map((pkg) => (
                    <Card key={pkg.id} className="p-8">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h3 className="font-bold text-2xl text-gray-900">Application Package #{pkg.id}</h3>
                          <p className="text-gray-500 font-medium mt-1">Status: <span className="text-blue-600 capitalize">{pkg.status}</span></p>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/download/${pkg.id}/pdf`, '_blank')}>Download PDF</Button>
                          <Button variant="outline" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/download/${pkg.id}/docx`, '_blank')}>Download DOCX</Button>
                        </div>
                      </div>

                      {pkg.ats_report && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-gray-50 rounded-2xl">
                          <ScoreChart score={pkg.ats_report.score || 0} label="ATS Score" />
                          <ScoreChart score={pkg.ats_report.resume_strength_score || 0} label="Resume Strength" />
                          <div className="flex flex-col justify-center">
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Keyword Analysis</h4>
                            <KeywordChart
                              present={pkg.ats_report.present_keywords?.length || 0}
                              missing={pkg.ats_report.missing_keywords?.length || 0}
                            />
                          </div>
                        </div>
                      )}

                      {pkg.ats_report?.missing_keywords?.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Missing Critical Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {pkg.ats_report.missing_keywords.map((kw: string) => (
                              <span key={kw} className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full border border-red-100">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
        active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
