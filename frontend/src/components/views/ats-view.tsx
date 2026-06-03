'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, Button, Badge, cn } from '@/components/ui/base';
import { analyzeATS, rewriteResume, downloadATSResume } from '@/lib/api';
import type { ATSAnalysisResult } from '@/lib/api';
import { ScoreChart } from '@/components/ui/charts';
import {
  FileText, Upload, Loader2, AlertTriangle, CheckCircle, XCircle,
  ArrowRight, Target, RefreshCw, Download, Copy, ClipboardCheck,
  Sparkles, FileDown, FileType,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Job {
  id?: number;
  title: string;
  company: string;
  description?: string;
  [key: string]: any;
}

interface ATSViewProps {
  selectedPackage?: any;
  selectedJob?: Job | null;
  resumeId?: number | null;
  jobs?: any[];
}

export function ATSView({ selectedPackage, selectedJob, resumeId, jobs }: ATSViewProps) {
  const [jobDescription, setJobDescription] = useState(
    selectedJob?.description || selectedPackage?.job_description || ''
  );
  const [resumeText, setResumeText] = useState(
    selectedPackage?.tailored_resume_text || ''
  );
  const [analysis, setAnalysis] = useState<ATSAnalysisResult | null>(null);
  const [rewrittenResume, setRewrittenResume] = useState('');
  const [rewriteDiff, setRewriteDiff] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableResume, setEditableResume] = useState('');
  const [activeTab, setActiveTab] = useState<'analysis' | 'rewrite'>('analysis');
  const [copySuccess, setCopySuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) return;
    setIsAnalyzing(true);
    setActiveTab('analysis');
    try {
      const result = await analyzeATS({
        job_description: jobDescription,
        resume_text: resumeText,
        resume_id: resumeId ?? undefined,
      });
      setAnalysis(result);
    } catch (err) {
      console.error('ATS analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRewrite = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) return;
    setIsRewriting(true);
    setActiveTab('rewrite');
    try {
      const result = await rewriteResume({
        job_description: jobDescription,
        resume_text: resumeText,
        resume_id: resumeId ?? undefined,
      });
      const newResume = result.rewritten_resume || '';
      setRewrittenResume(newResume);
      setEditableResume(newResume);
      setIsEditing(false);

      const oldLines = resumeText.split('\n').filter(l => l.trim()).length;
      const newLines = newResume.split('\n').filter(l => l.trim()).length;
      setRewriteDiff(`Optimized from ${oldLines} lines → ${newLines} lines. Keywords integrated, metrics added.`);
    } catch (err) {
      console.error('Resume rewrite failed:', err);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleDownload = (format: 'pdf' | 'docx') => {
    const text = editableResume || rewrittenResume || resumeText;
    if (!text.trim()) return;
    downloadATSResume(text, format);
  };

  const handleCopy = async () => {
    const text = editableResume || rewrittenResume || resumeText;
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.txt') || file.name.endsWith('.md'))) {
      const reader = new FileReader();
      reader.onload = (ev) => { setResumeText(ev.target?.result as string || ''); };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setResumeText(ev.target?.result as string || ''); };
    reader.readAsText(file);
  };

  const score = analysis?.score ?? 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center">
              <Target size={24} className="text-teal" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">ATS Compatibility Analysis</h3>
              <p className="text-sm text-gray-400">
                Side-by-side comparison of job description vs your resume
              </p>
              {selectedJob && (
                <p className="text-xs text-teal mt-1">
                  {selectedJob.title} at {selectedJob.company}
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Side-by-Side Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Job Description */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-gray-300">Job Description</h3>
          </div>
          <textarea
            className="w-full h-64 p-4 text-xs font-mono bg-graphite/50 border border-surface-border rounded-lg text-gray-300 placeholder:text-gray-600 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none resize-none transition-all"
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </Card>

        {/* Resume */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-teal" />
            <h3 className="text-sm font-semibold text-gray-300">Your Resume</h3>
          </div>
          {resumeText ? (
            <textarea
              className="w-full h-64 p-4 text-xs font-mono bg-graphite/50 border border-surface-border rounded-lg text-gray-300 placeholder:text-gray-600 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none resize-none transition-all"
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          ) : (
            <div
              className={cn(
                'w-full h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-all cursor-pointer',
                dragOver ? 'border-teal bg-teal/5' : 'border-surface-border bg-graphite/30 hover:border-gray-500'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} className="text-gray-500 mb-3" />
              <p className="text-sm text-gray-400 font-medium mb-1">Upload or drop your resume</p>
              <p className="text-xs text-gray-500">Supports .txt and .md files</p>
              <input ref={fileInputRef} type="file" accept=".txt,.md" className="hidden" onChange={handleFileSelect} />
            </div>
          )}
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-3"
      >
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !jobDescription.trim() || !resumeText.trim()}
          className="h-11 px-6"
        >
          {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <ClipboardCheck size={18} />}
          {isAnalyzing ? 'Analyzing...' : 'Analyze with ATS'}
        </Button>
        <Button
          variant="outline"
          onClick={handleRewrite}
          disabled={isRewriting || !jobDescription.trim() || !resumeText.trim()}
          className="h-11 px-6"
        >
          {isRewriting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {isRewriting ? 'Rewriting...' : 'Rewrite Resume'}
        </Button>
      </motion.div>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Tabs: Analysis / Rewrite */}
            <div className="flex border-b border-surface-border gap-0">
              <button
                onClick={() => setActiveTab('analysis')}
                className={cn(
                  'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'analysis' ? 'border-teal text-teal' : 'border-transparent text-gray-500 hover:text-gray-300'
                )}
              >
                <Target size={14} className="inline mr-1.5" />
                ATS Analysis
              </button>
              <button
                onClick={() => setActiveTab('rewrite')}
                className={cn(
                  'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'rewrite' ? 'border-teal text-teal' : 'border-transparent text-gray-500 hover:text-gray-300'
                )}
              >
                <Sparkles size={14} className="inline mr-1.5" />
                Rewritten Resume
              </button>
            </div>

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Score Dashboard */}
                <Card className="p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <ScoreChart score={score} label="Overall Match" color="#00d4aa" size="sm" />
                    <ScoreChart score={analysis.readability_score} label="Readability" color="#60a5fa" size="sm" />
                    <ScoreChart score={analysis.resume_strength_score} label="Resume Strength" color="#34d399" size="sm" />
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-sm text-gray-400 mb-1">Parsing Risk</p>
                      <Badge
                        variant={
                          analysis.ats_parsing_risk_level === 'low' ? 'success' :
                          analysis.ats_parsing_risk_level === 'medium' ? 'warning' : 'danger'
                        }
                        className="text-xs uppercase"
                      >
                        {analysis.ats_parsing_risk_level || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Keyword Match Matrix */}
                <Card className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-medium text-emerald-400 mb-3 flex items-center gap-1.5">
                        <CheckCircle size={12} />
                        Matched Keywords ({analysis.present_keywords?.length || 0})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.present_keywords?.length > 0 ? (
                          analysis.present_keywords.map((kw: string) => (
                            <Badge key={kw} variant="success" className="text-[10px]">{kw}</Badge>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic">No keywords matched</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-amber-400 mb-3 flex items-center gap-1.5">
                        <AlertTriangle size={12} />
                        Missing Keywords ({analysis.missing_keywords?.length || 0})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.missing_keywords?.length > 0 ? (
                          analysis.missing_keywords.map((kw: string) => (
                            <Badge key={kw} variant="warning" className="text-[10px]">{kw}</Badge>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic">All critical keywords present!</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {analysis.missing_skills && analysis.missing_skills.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-surface-border">
                      <h4 className="text-xs font-medium text-red-400 mb-3 flex items-center gap-1.5">
                        <XCircle size={12} />
                        Missing Skills
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.missing_skills.map((sk: string) => (
                          <Badge key={sk} variant="danger" className="text-[10px]">{sk}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Gap Analysis */}
                {analysis.missing_keywords?.length > 0 && (
                  <Card className="p-5">
                    <h4 className="text-xs font-medium text-gray-300 mb-3 flex items-center gap-1.5">
                      <ArrowRight size={12} />
                      Gap Analysis
                    </h4>
                    <div className="space-y-2">
                      {analysis.missing_keywords.slice(0, 5).map((kw: string, i: number) => (
                        <div key={i} className="flex gap-2 text-xs text-gray-400">
                          <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-red-300">{kw}</strong>
                            {kw === 'Kubernetes' ? ' — Container orchestration experience is highly valued.' :
                             kw === 'GraphQL' ? ' — Modern API layer, consider adding if experienced.' :
                             kw === 'CI/CD' ? ' — Continuous integration/delivery is a core requirement.' :
                             ' — Consider adding this keyword if you have relevant experience.'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Scam Warning */}
                {analysis.is_potential_scam && (
                  <Card className="p-4 border-red-500/30 bg-red-500/5">
                    <div className="flex gap-3 items-start">
                      <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-300 mb-1">Potential Scam / Ghost Job</h4>
                        <p className="text-xs text-gray-400">
                          This listing has indicators suggesting it may be fraudulent or not actively hiring. Proceed with caution.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Fit Score */}
                {analysis.fit_score_explanation && (
                  <Card className="p-5">
                    <h4 className="text-xs font-medium text-gray-300 mb-2">Fit Score Explanation</h4>
                    <p className="text-sm text-gray-400 italic leading-relaxed">&ldquo;{analysis.fit_score_explanation}&rdquo;</p>
                  </Card>
                )}

                {/* Improvement Suggestions */}
                {analysis.improvement_suggestions?.length > 0 && (
                  <Card className="p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Improvement Suggestions</h3>
                    <div className="space-y-3">
                      {analysis.improvement_suggestions.map((tip: string, i: number) => (
                        <div key={i} className="flex gap-3 text-sm text-gray-400">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal/10 text-teal text-xs font-bold shrink-0">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Recruiter Notes */}
                {analysis.recruiter_notes && (
                  <Card className="p-5">
                    <h4 className="text-xs font-medium text-gray-300 mb-2">Recruiter Feedback (Simulated)</h4>
                    <div className="bg-graphite/50 rounded-lg p-4 text-xs text-gray-400 italic leading-relaxed">
                      &ldquo;{analysis.recruiter_notes}&rdquo;
                    </div>
                  </Card>
                )}
              </motion.div>
            )}

            {/* Rewrite Tab */}
            {activeTab === 'rewrite' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Diff Summary */}
                {rewriteDiff && (
                  <Card className="p-4 border-teal/20 bg-teal/5">
                    <div className="flex items-center gap-2 text-sm text-teal">
                      <RefreshCw size={16} />
                      {rewriteDiff}
                    </div>
                  </Card>
                )}

                {/* Editable Rewritten Resume */}
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-teal" />
                      Rewritten Resume
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-lg border transition-all',
                          isEditing ? 'bg-teal/10 border-teal/30 text-teal' : 'border-surface-border text-gray-400 hover:text-white'
                        )}
                      >
                        {isEditing ? 'Preview' : 'Edit'}
                      </button>
                      <button
                        onClick={handleCopy}
                        className="text-xs px-3 py-1.5 rounded-lg border border-surface-border text-gray-400 hover:text-white transition-all flex items-center gap-1"
                      >
                        <Copy size={12} />
                        {copySuccess ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <textarea
                      className="w-full h-80 p-4 text-xs font-mono bg-graphite/50 border border-surface-border rounded-lg text-gray-300 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none resize-none transition-all"
                      value={editableResume}
                      onChange={(e) => setEditableResume(e.target.value)}
                    />
                  ) : (
                    <div className="bg-graphite/50 rounded-lg p-4 max-h-80 overflow-y-auto">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {editableResume || rewrittenResume || 'Click "Rewrite Resume" to generate an optimized version.'}
                      </pre>
                    </div>
                  )}
                </Card>

                {/* Download Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => handleDownload('pdf')}
                    className="h-10 px-5 text-sm"
                    disabled={!(editableResume || rewrittenResume || resumeText)}
                  >
                    <FileDown size={16} />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownload('docx')}
                    className="h-10 px-5 text-sm"
                    disabled={!(editableResume || rewrittenResume || resumeText)}
                  >
                    <FileType size={16} />
                    Download DOCX
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-10 px-5 text-sm"
                    disabled={!(editableResume || rewrittenResume || resumeText)}
                  >
                    <Copy size={16} />
                    {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial state — no analysis yet */}
      {!analysis && !isAnalyzing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <Card className="p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-lighter flex items-center justify-center">
              <Target size={28} className="text-gray-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-300 mb-2">
              {selectedJob ? 'Analyze This Job' : 'Ready to Analyze'}
            </h3>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              {selectedJob
                ? 'Paste your resume text in the right panel, then click "Analyze with ATS" to see how your resume scores against this job.'
                : 'Paste a job description on the left and your resume on the right, then click "Analyze with ATS" to get a detailed compatibility report.'}
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
