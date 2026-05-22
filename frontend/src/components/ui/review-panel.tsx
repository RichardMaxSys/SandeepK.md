'use client';

import React from 'react';
import { Card, Button } from '@/components/ui/base';
import { X, CheckCircle, AlertTriangle, FileText, Info } from 'lucide-react';
import { ScoreChart } from './charts';

export const ReviewPanel = ({ pkg, onClose, onApprove }: { pkg: any; onClose: () => void; onApprove: (id: number) => void }) => {
  const [view, setView] = React.useState<'analysis' | 'resume'>('analysis');
  const ats = pkg.ats_report || {};

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{pkg.job_title}</h2>
            <p className="text-gray-500 font-medium">{pkg.job_company} • Application Review</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="p-4 bg-white border-b border-gray-100 flex gap-4">
          <Button
            variant={view === 'analysis' ? 'primary' : 'outline'}
            onClick={() => setView('analysis')}
            className="flex-1"
          >
            Intelligence Analysis
          </Button>
          <Button
            variant={view === 'resume' ? 'primary' : 'outline'}
            onClick={() => setView('resume')}
            className="flex-1"
          >
            Resume Preview
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 space-y-8">
          {view === 'analysis' ? (
          <>
          {/* Executive Summary & Scores */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="p-6 col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Info size={16} /> Fit Score Explanation
              </h3>
              <p className="text-gray-700 leading-relaxed italic">
                {ats.fit_score_explanation || "No explanation available."}
              </p>
              <div className="pt-4 border-t border-gray-50">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Recruiter Insights</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {ats.recruiter_notes || "No recruiter notes generated."}
                </p>
              </div>
            </Card>

            <Card className="p-6 flex flex-col items-center justify-center space-y-6">
              <ScoreChart score={ats.score || 0} label="Overall Match" />
              <div className="w-full space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Readability</span>
                   <span className="font-bold">{ats.readability_score}%</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Strength</span>
                   <span className="font-bold">{ats.resume_strength_score}%</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Parser Risk</span>
                   <span className={cn(
                     "font-bold uppercase text-xs px-2 py-0.5 rounded",
                     ats.ats_parsing_risk_level === 'low' ? 'bg-green-100 text-green-700' :
                     ats.ats_parsing_risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                   )}>
                     {ats.ats_parsing_risk_level || 'Unknown'}
                   </span>
                 </div>
              </div>
            </Card>
          </div>

          {/* Keyword Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" /> Matched Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {ats.present_keywords?.map((kw: string) => (
                  <span key={kw} className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-green-100">
                    {kw}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" /> Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {ats.missing_keywords?.map((kw: string) => (
                  <span key={kw} className="bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-red-100">
                    {kw}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Scams & Quality */}
          {ats.is_potential_scam && (
            <Card className="p-4 border-red-200 bg-red-50 flex gap-4 items-center text-red-700">
              <AlertTriangle size={24} />
              <div>
                <h4 className="font-bold">Potential Scam Detected</h4>
                <p className="text-sm">This job listing has indicators of being fraudulent or a "ghost job". Proceed with caution.</p>
              </div>
            </Card>
          )}
          </>
          ) : (
            <Card className="p-12 bg-white shadow-inner font-mono text-sm leading-relaxed whitespace-pre-wrap">
              {pkg.tailored_resume_text || "Resume tailoring in progress..."}
            </Card>
          )}
        </div>

        <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center">
          <div className="flex gap-4">
            <Button variant="outline" className="gap-2">
              <FileText size={18} /> Preview Tailored Resume
            </Button>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={() => onApprove(pkg.id)}>
              <CheckCircle size={18} /> Approve & Mark Ready
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
