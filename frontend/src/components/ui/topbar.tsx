'use client';

import React from 'react';
import { cn } from './base';
import { Search, Bell, Menu } from 'lucide-react';

export function Topbar({
  title,
  onMenuToggle,
}: {
  title: string;
  onMenuToggle: () => void;
}) {
  return (
    <header className="flex items-center justify-between h-16 px-4 lg:px-6 bg-charcoal/95 backdrop-blur-sm border-b border-surface-border shrink-0">
      {/* Left: Menu button + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-gray-400 hover:text-gray-200 hover:bg-surface-hover rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>

      {/* Right: Search + Notifications + Avatar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search jobs..."
            className="w-56 lg:w-72 pl-9 pr-4 py-2 text-sm rounded-lg border border-surface-border bg-graphite text-gray-200 placeholder:text-gray-500 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none transition-all"
          />
        </div>

        {/* Notification bell */}
        <button className="relative p-2 text-gray-400 hover:text-gray-200 hover:bg-surface-hover rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal rounded-full" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-3 pl-3 border-l border-surface-border">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-teal-600 flex items-center justify-center text-xs font-bold text-charcoal">
            SK
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-200 leading-tight">Sandeep K.</p>
            <p className="text-xs text-gray-500">Job Seeker</p>
          </div>
        </div>
      </div>
    </header>
  );
}
