'use client'

import { useState } from 'react'
import Link from 'next/link'
import * as React from 'react'
import { motion } from 'motion/react'
import { Sparkles, Search, Bell, Wand2, type LucideIcon } from 'lucide-react'
import { Badge, Button, cn } from '@/components/ui/base'
import { UserMenu } from '@/components/auth/user-menu'

/* -------------------------------------------------------------------------- */
/*  Public landing nav (default export)                                        */
/* -------------------------------------------------------------------------- */

export default function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo area */}
        <Link href="/" className="flex items-center gap-2 group">
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="4" width="14" height="15" rx="2" stroke="#0D9488" strokeWidth="1.5" />
            <path d="M8 13V7M8 7L5.5 9.5M8 7L10.5 9.5" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="4" y="1" width="8" height="3" rx="1" fill="#0D9488" />
          </svg>
          <div className="leading-tight">
            <span className="text-base font-bold text-gray-900 leading-tight block">
              ResumeElevate
            </span>
            <span className="text-[10px] text-gray-400 leading-tight hidden sm:block">
              Elevate Every Application
            </span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/templates" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            Templates
          </Link>
          <Link href="/ats-check" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            ATS Check
          </Link>
          <Link href="/tailor" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            Tailor
          </Link>
          <Link href="/docs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
            Docs
          </Link>
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2">
            Log in
          </Link>
          <Link
            href="/templates"
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Build my resume free →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M5 5l10 10M15 5L5 15" />
            ) : (
              <path d="M3 5h14M3 10h14M3 15h14" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg p-4 z-20 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link href="/templates" onClick={() => setMobileOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-50">
              Templates
            </Link>
            <Link href="/ats-check" onClick={() => setMobileOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-50">
              ATS Check
            </Link>
            <Link href="/tailor" onClick={() => setMobileOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-50">
              Tailor
            </Link>
            <Link href="/docs" onClick={() => setMobileOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-50">
              Docs
            </Link>
          </nav>
          <div className="border-t border-gray-100 mt-3 pt-3 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-lg border border-gray-200 text-center">
              Log in
            </Link>
            <Link href="/templates" onClick={() => setMobileOpen(false)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg text-center">
              Build my resume free →
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/*  App-internal TabKey, TABS, old TopNav, TabContextBar                       */
/*  (used by app/(app)/app/page.tsx)                                           */
/* -------------------------------------------------------------------------- */

export type TabKey = 'builder' | 'check' | 'tailor'

export interface TabDef {
  key: TabKey
  label: string
  shortLabel?: string
  description: string
  icon: LucideIcon
}

export const TABS: TabDef[] = [
  {
    key: 'builder',
    label: 'Builder',
    shortLabel: 'Build',
    description: 'Pick a template, edit your resume, export PDF / DOCX.',
    icon: Sparkles,
  },
  {
    key: 'check',
    label: 'ATS Check',
    shortLabel: 'Check',
    description: 'Upload your resume and see exactly how an ATS reads it.',
    icon: Search,
  },
  {
    key: 'tailor',
    label: 'Tailor to Job',
    shortLabel: 'Tailor',
    description: 'Paste a job description. Get a match score, AI rewrite, and cover letter.',
    icon: Wand2,
  },
]

export interface TopNavProps {
  active: TabKey
  onChange: (key: TabKey) => void
  onOpenAuth?: () => void
}

export const AppTopNav: React.FC<TopNavProps> = ({ active, onChange, onOpenAuth }) => {

  return (
    <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-xl border-b border-line">
      {/* Row 1: brand + actions */}
      <div className="h-16 px-6 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent-400 to-sky-500 flex items-center justify-center shadow-glow-accent group-hover:opacity-90 transition-opacity">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink tracking-tight">ResumeElevate</p>
              <p className="text-2xs text-ink-subtle uppercase tracking-wider">Elevate Every Application</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <UserMenu onOpenAuth={() => onOpenAuth?.()} />
        </div>
      </div>

      {/* Row 2: tab nav */}
      <div className="px-6 flex items-center gap-1 border-t border-line">
        {TABS.map((t) => {
          const isActive = t.key === active
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={cn(
                'relative flex items-center gap-2 px-4 h-12 text-sm font-medium transition-colors cursor-pointer active:scale-[0.97]',
                isActive ? 'text-ink' : 'text-ink-muted hover:text-ink active:text-ink',
              )}
            >
              <Icon size={15} className={cn(isActive ? 'text-accent-300' : 'text-ink-subtle')} />
              {t.label}
              {isActive && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute -bottom-px left-2 right-2 h-0.5 bg-accent-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </header>
  )
}

export const TabContextBar: React.FC<{
  active: TabKey
  className?: string
  right?: React.ReactNode
}> = ({ active, className, right }) => {
  const t = TABS.find((x) => x.key === active) ?? TABS[0]
  return (
    <div className={cn(
      'flex flex-col md:flex-row md:items-end md:justify-between gap-3',
      className,
    )}>
      <div>
        <p className="text-2xs font-medium uppercase tracking-wider text-accent-300">
          {t.shortLabel ?? t.label}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{t.label}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.description}</p>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  )
}

export { Badge }
