interface ATSBadgeProps {
  rating: 'High' | 'Medium' | 'Low'
  className?: string
}

const config: Record<
  'High' | 'Medium' | 'Low',
  { label: string; classes: string }
> = {
  High: {
    label: '✓ ATS Safe',
    classes: 'bg-green-100 text-green-700 border border-green-200',
  },
  Medium: {
    label: '⚠ ATS Medium',
    classes: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  },
  Low: {
    label: '✗ ATS Risk',
    classes: 'bg-red-100 text-red-700 border border-red-200',
  },
}

export default function ATSBadge({ rating, className = '' }: ATSBadgeProps) {
  const { label, classes } = config[rating]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${classes} ${className}`}
    >
      {label}
    </span>
  )
}
