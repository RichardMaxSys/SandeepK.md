'use client';

import React from 'react';
import { cn } from './base';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  BarChart3,
  ClipboardCheck,
  Settings,
  ChevronLeft,
} from 'lucide-react';

export type ViewType = 'dashboard' | 'jobs' | 'resume' | 'ats' | 'applications' | 'settings';

const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'jobs', label: 'Jobs', icon: <Briefcase size={20} /> },
  { id: 'resume', label: 'Resume', icon: <FileText size={20} /> },
  { id: 'ats', label: 'ATS Analysis', icon: <BarChart3 size={20} /> },
  { id: 'applications', label: 'Applications', icon: <ClipboardCheck size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

export function Sidebar({
  activeView,
  onViewChange,
  collapsed,
  onToggle,
}: {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        'fixed lg:static inset-y-0 left-0 z-30 flex flex-col bg-charcoal border-r border-surface-border transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-60',
        'hidden lg:flex'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-surface-border px-4', collapsed && 'justify-center')}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center shrink-0">
            <Briefcase size={16} className="text-charcoal" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">CareerAI</h1>
              <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Intelligence</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              collapsed && 'justify-center px-2',
              activeView === item.id
                ? 'bg-teal/10 text-teal border border-teal/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-surface-hover'
            )}
            title={collapsed ? item.label : undefined}
          >
            <span className={cn('shrink-0', activeView === item.id ? 'text-teal' : 'text-gray-400')}>
              {item.icon}
            </span>
            {!collapsed && <span>{item.label}</span>}
            {activeView === item.id && !collapsed && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal" />
            )}
          </button>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="border-t border-surface-border p-3">
        <button
          onClick={onToggle}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-surface-hover transition-all',
            collapsed && 'justify-center'
          )}
        >
          <ChevronLeft size={18} className={cn('transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

export function MobileBottomNav({
  activeView,
  onViewChange,
}: {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}) {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-charcoal border-t border-surface-border flex items-center justify-around px-2 py-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          className={cn(
            'flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors',
            activeView === item.id
              ? 'text-teal'
              : 'text-gray-500 hover:text-gray-300'
          )}
        >
          {item.icon}
          <span className="truncate max-w-14">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
