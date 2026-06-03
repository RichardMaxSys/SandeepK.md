import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' }
>(({ className, variant = 'primary', ...props }, ref) => {
  const variants = {
    primary:
      'bg-teal text-charcoal font-semibold hover:bg-teal-400 shadow-soft hover:shadow-glow',
    secondary:
      'bg-surface-lighter text-gray-200 hover:bg-surface-hover border border-surface-border',
    outline:
      'border border-surface-border bg-transparent text-gray-300 hover:bg-surface-hover hover:text-gray-100',
    ghost:
      'bg-transparent text-gray-400 hover:bg-surface-hover hover:text-gray-200',
    danger:
      'bg-red-600 text-white hover:bg-red-700 shadow-soft',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export const Card = ({ children, className, hover }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <div
    className={cn(
      'rounded-xl border border-surface-border bg-surface-card shadow-soft',
      hover && 'hover:border-teal/20 hover:shadow-card transition-all duration-300',
      className
    )}
  >
    {children}
  </div>
);

export const Badge = ({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'teal';
  className?: string;
}) => {
  const variants = {
    default: 'bg-surface-lighter text-gray-300 border-surface-border',
    success: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50',
    warning: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
    danger: 'bg-red-900/40 text-red-300 border-red-800/50',
    info: 'bg-blue-900/40 text-blue-300 border-blue-800/50',
    teal: 'bg-teal/10 text-teal border-teal/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }
>(({ className, icon, ...props }, ref) => {
  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-lg border border-surface-border bg-graphite px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500',
          'focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none',
          'transition-all duration-200',
          icon && 'pl-10',
          className
        )}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';

export const KpiCard = ({
  title,
  value,
  icon,
  trend,
  color = 'teal',
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color?: 'teal' | 'blue' | 'amber' | 'emerald';
}) => {
  const colors = {
    teal: 'bg-teal/10 text-teal',
    blue: 'bg-blue-500/10 text-blue-400',
    amber: 'bg-amber-500/10 text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              <span className={cn('text-xs font-medium', trend.positive ? 'text-emerald-400' : 'text-red-400')}>
                {trend.positive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-gray-500">vs last week</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', colors[color])}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
