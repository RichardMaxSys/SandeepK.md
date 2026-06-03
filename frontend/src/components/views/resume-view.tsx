'use client';

import React from 'react';
import { Card, Button, Badge, cn } from '@/components/ui/base';
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

export function ResumeView({
  resumeId,
  loading,
  onUpload,
}: {
  resumeId: number | null;
  loading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const atsScore = 76;
  const presentKeywords = ['Python', 'TypeScript', 'React', 'AWS', 'Docker', 'PostgreSQL', 'REST APIs'];
  const missingKeywords = ['Kubernetes', 'CI/CD', 'Terraform', 'GraphQL', 'Microservices'];
  const improvementTips = [
    'Add quantifiable impact metrics (e.g., "Improved performance by 40%")',
    'Include specific CI/CD tools and experience',
    'Add cloud architecture experience with AWS/GCP',
  ];
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6 pb-8">
      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card
          className={cn(
            'p-10 text-center border-2 border-dashed transition-all duration-300',
            resumeId ? 'border-teal/30 bg-teal/5' : 'border-surface-border hover:border-teal/30 hover:bg-surface-lighter/50'
          )}
        >
          {loading ? (
            <div className="py-4">
              <Loader2 size={32} className="animate-spin mx-auto mb-4 text-teal" />
              <p className="text-sm text-gray-400">Parsing your resume...</p>
            </div>
          ) : resumeId ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal/10 flex items-center justify-center">
                <CheckCircle size={32} className="text-teal" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Resume Uploaded</h3>
              <p className="text-sm text-gray-400 mb-4">Your resume has been parsed and analyzed.</p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} />
                Update Resume
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-lighter flex items-center justify-center">
                <Upload size={28} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Upload Your Resume</h3>
              <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                Upload your master resume in PDF or TXT format. Our AI will parse it and analyze ATS readiness.
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} />
                Choose File
              </Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onUpload}
            accept=".txt,.pdf"
          />
        </Card>
      </motion.div>

      {/* Analysis Grid */}
      {resumeId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* ATS Score Ring */}
          <Card className="p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">ATS Readiness Score</h3>
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="43" fill="none" stroke="#2a3558" strokeWidth="6" />
                <circle
                  cx="50" cy="50" r="43"
                  fill="none"
                  stroke="#00d4aa"
                  strokeWidth="6"
                  strokeDasharray={`${(atsScore / 100) * 270} 270`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{atsScore}%</span>
                <span className="text-xs text-gray-500 mt-1">Score</span>
              </div>
            </div>
            <div className="w-full space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Formatting</span>
                <span className="font-semibold text-white">88%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden">
                <div className="h-full bg-teal rounded-full" style={{ width: '88%' }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Keywords</span>
                <span className="font-semibold text-white">62%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '62%' }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Impact</span>
                <span className="font-semibold text-white">75%</span>
              </div>
              <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
          </Card>

          {/* Keyword Analysis */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Keyword Analysis</h3>

            <div className="space-y-6">
              {/* Present Keywords */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={16} className="text-emerald-400" />
                  <h4 className="text-sm font-medium text-gray-300">Present Keywords ({presentKeywords.length})</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {presentKeywords.map((kw) => (
                    <Badge key={kw} variant="success">{kw}</Badge>
                  ))}
                </div>
              </div>

              {/* Missing Keywords */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <h4 className="text-sm font-medium text-gray-300">Missing Keywords ({missingKeywords.length})</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {missingKeywords.map((kw) => (
                    <Badge key={kw} variant="warning">{kw}</Badge>
                  ))}
                </div>
              </div>

              {/* Improvement Tips */}
              <div className="pt-4 border-t border-surface-border">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <ArrowUp size={16} className="text-teal" />
                  Improvement Tips
                </h4>
                <ul className="space-y-2">
                  {improvementTips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-400">
                      <span className="text-teal mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
