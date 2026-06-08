interface TierBadgeProps {
  tier: 'Free' | 'Pro'
  className?: string
}

export default function TierBadge({ tier, className = '' }: TierBadgeProps) {
  if (tier === 'Free') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-500 bg-white ${className}`}
      >
        Free
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-600 text-white ${className}`}
    >
      <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden="true">
        <rect x="1" y="5" width="8" height="7" rx="1" fill="currentColor" />
        <path
          d="M3 5V3.5a2 2 0 0 1 4 0V5"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
      Pro
    </span>
  )
}
