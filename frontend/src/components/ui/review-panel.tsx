'use client';

import React from 'react';
import { Card, Button, Badge, cn } from '@/components/ui/base';
import { X, CheckCircle, AlertTriangle, FileText, Info, Download, Sparkles, Shield } from 'lucide-react';
import { ScoreChart } from './charts';

export const ReviewPanel = ({ pkg, onClose, onApprove }: { pkg: any; onClose: () => void; onApprove: (id: number) => void }) => {
  const [view, setView] = React.useState<'analysis' | 'resume'>('analysis');
  const ats = pkg.ats_report || {};

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-elevated border-surface-border">
        {/* Header */}
        <div className="p-6 border-b border-surface-border flex justify-between items-center bg-surface-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center">
              <FileText size={24} className="text-teal" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{pkg.job_title}</h2>
              <p className="text-sm text-gray-400">{pkg.job_company} • Application Review</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="p-4 bg-surface-card border-b border-surface-border flex gap-2">
          <Button
            variant={view === 'analysis' ? 'primary' : 'outline'}
            onClick={() => setView('analysis')}
            className="flex-1"
          >
            <Shield size={16} />
            Intelligence Analysis
          </Button>
          <Button
            variant={view === 'resume' ? 'primary' : 'outline'}
            onClick={() => setView('resume')}
            className="flex-1"
          >
            <FileText size={16} />
            Resume Preview
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-charcoal space-y-6">
          {view === 'analysis' ? (
            <>
              {/* Executive Summary & Scores */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 col-span-2 space-y-4 border-surface-border">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} /> Fit Score Explanation
                  </h3>
                  <p className="text-gray-300 leading-relaxed italic text-sm">
                    {ats.fit_score_explanation || "No explanation available."}
                  </p>
                  <div className="pt-4 border-t border-surface-border">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Recruiter Insights</h3>
                    <div className="bg-graphite rounded-lg p-4">
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {ats.recruiter_notes || "No recruiter notes generated."}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 flex flex-col items-center justify-center space-y-5 border-surface-border">
                  <ScoreChart score={ats.score || 0} label="Overall Match" color="#00d4aa" />
                  <div className="w-full space-y-3 pt-4 border-t border-surface-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Readability</span>
                      <span className="font-semibold text-white">{ats.readability_score || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Strength</span>
                      <span className="font-semibold text-white">{ats.resume_strength_score || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Parser Risk</span>
                      <Badge
                        variant={
                          ats.ats_parsing_risk_level === 'low' ? 'success' :
                          ats.ats_parsing_risk_level === 'medium' ? 'warning' : 'danger'
                        }
                        className="text-[10px] uppercase"
                      >
                        {ats.ats_parsing_risk_level || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Keyword Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5 border-surface-border">
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" /> Matched Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ats.present_keywords?.length > 0 ? ats.present_keywords.map((kw: string) => (
                      <Badge key={kw} variant="success" className="text-xs">{kw}</Badge>
                    )) : (
                      <p className="text-sm text-gray-500 italic">No keywords matched</p>
                    )}
                  </div>
                </Card>

                <Card className="p-5 border-surface-border">
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-400" /> Missing Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ats.missing_keywords?.length > 0 ? ats.missing_keywords.map((kw: string) => (
                      <Badge key={kw} variant="warning" className="text-xs">{kw}</Badge>
                    )) : (
                      <p className="text-sm text-gray-500 italic">All critical keywords present!</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Scams & Quality */}
              {ats.is_potential_scam && (
                <Card className="p-4 border-red-500/30 bg-red-500/5 flex gap-4 items-start">
                  <AlertTriangle size={24} className="text-red-400 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-300">Potential Scam Detected</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      This job listing has indicators of being fraudulent or a "ghost job". Proceed with caution.
                    </p>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-8 bg-graphite border-surface-border">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-surface-border">
                <FileText size={18} className="text-teal" />
                <h3 className="text-base font-semibold text-white">Tailored Resume</h3>
              </div>
              <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-300">
                {pkg.tailored_resume_text || (
                  <div className="text-center py-12 text-gray-500 italic">
                    Resume tailoring in progress...
                    <div className="mt-4 flex justify-center">
                      <span className="animate-pulse-soft text-teal">● Processing</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-surface-card border-t border-surface-border flex justify-between items-center">
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 text-xs" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/download/${pkg.id}/pdf`, '_blank')}>
              <Download size={16} /> PDF
            </Button>
            <Button variant="outline" className="gap-2 text-xs" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/download/${pkg.id}/docx`, '_blank')}>
              <Download size={16} /> DOCX
            </Button>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="gap-2" onClick={() => onApprove(pkg.id)}>
              <CheckCircle size={18} /> Approve & Mark Ready
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
