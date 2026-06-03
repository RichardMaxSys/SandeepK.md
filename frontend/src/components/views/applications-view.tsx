'use client';

import React from 'react';
import { Card, Badge, cn } from '@/components/ui/base';
import { FileText, CheckCircle, Clock, XCircle, ArrowRight, Building } from 'lucide-react';
import { motion } from 'framer-motion';

interface PackageItem {
  id: number;
  job_title: string;
  job_company: string;
  status: string;
  created_at?: string;
  ats_report?: any;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  processing: {
    label: 'Processing',
    icon: <Clock size={16} />,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  ready: {
    label: 'Ready for Review',
    icon: <FileText size={16} />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  approved: {
    label: 'Approved',
    icon: <CheckCircle size={16} />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle size={16} />,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
};

const columns = [
  { key: 'processing', label: 'Processing', icon: <Clock size={16} /> },
  { key: 'ready', label: 'Review', icon: <FileText size={16} /> },
  { key: 'approved', label: 'Approved', icon: <CheckCircle size={16} /> },
  { key: 'rejected', label: 'Rejected', icon: <XCircle size={16} /> },
];

export function ApplicationsView({
  packages,
  onSelectPackage,
}: {
  packages: PackageItem[];
  onSelectPackage: (pkg: PackageItem) => void;
}) {
  const grouped = columns.reduce(
    (acc, col) => {
      acc[col.key] = packages.filter((p) => p.status === col.key);
      return acc;
    },
    {} as Record<string, PackageItem[]>
  );

  if (packages.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-lighter flex items-center justify-center">
          <FileText size={28} className="text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">No Applications Yet</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Tailor your resume for jobs to start tracking applications here.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Pipeline summary */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {columns.map((col) => (
          <div key={col.key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-card border border-surface-border">
            {col.icon}
            <span className="text-xs text-gray-400">{col.label}</span>
            <span className="text-sm font-semibold text-white">{grouped[col.key]?.length || 0}</span>
          </div>
        ))}
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.key}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={cn('text-sm font-semibold', statusConfig[col.key]?.color)}>{col.label}</span>
              <span className="text-xs text-gray-500">({grouped[col.key]?.length || 0})</span>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {grouped[col.key]?.map((pkg, i) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    hover
                    className="p-4 cursor-pointer"
                    onClick={() => onSelectPackage(pkg)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{pkg.job_title}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Building size={11} />
                          {pkg.job_company}
                        </div>
                      </div>
                    </div>

                    {pkg.ats_report?.score && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border">
                        <div className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded',
                          pkg.ats_report.score >= 80 ? 'text-teal bg-teal/10' :
                          pkg.ats_report.score >= 60 ? 'text-amber-400 bg-amber-500/10' :
                          'text-red-400 bg-red-500/10'
                        )}>
                          {pkg.ats_report.score}% ATS
                        </div>
                        {pkg.created_at && (
                          <span className="text-[10px] text-gray-500 ml-auto">
                            {new Date(pkg.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
