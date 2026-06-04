import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* -------------------------------------------------------------------------- */
/*                                  Button                                    */
/* -------------------------------------------------------------------------- */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger"
  | "success";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-500 text-white shadow-glow-accent hover:bg-accent-400 active:bg-accent-600",
  secondary:
    "bg-white/5 text-ink hover:bg-white/10 border border-line",
  ghost:
    "text-ink-muted hover:text-ink hover:bg-white/5",
  outline:
    "border border-line-strong text-ink hover:bg-white/5 hover:border-white/20",
  danger:
    "bg-danger text-white hover:bg-red-500",
  success:
    "bg-success text-white hover:bg-green-500",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-sm gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, children, disabled, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          "disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

/* -------------------------------------------------------------------------- */
/*                                   Card                                     */
/* -------------------------------------------------------------------------- */

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    interactive?: boolean;
    elevated?: boolean;
  }
>(({ className, interactive, elevated, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl bg-canvas-raised border border-line shadow-soft",
      elevated && "shadow-soft-lg",
      interactive &&
        "transition-all duration-200 hover:border-line-strong hover:bg-[#1a2238] hover:-translate-y-0.5 cursor-pointer",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("px-6 pt-6 pb-4 flex items-start justify-between gap-4", className)}
    {...props}
  />
);

export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn("text-base font-semibold text-ink tracking-tight", className)}
    {...props}
  />
);

export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-sm text-ink-muted", className)} {...props} />
);

export const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-6 pb-6", className)} {...props} />
);

/* -------------------------------------------------------------------------- */
/*                                  KpiCard                                   */
/* -------------------------------------------------------------------------- */

export interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; positive?: boolean };
  icon?: React.ReactNode;
  trend?: number[]; // small sparkline data
  accent?: "teal" | "blue" | "amber" | "rose" | "violet";
}

const accentMap: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  teal:   "from-accent-500/20 to-accent-500/0 text-accent-300",
  blue:   "from-sky-500/20 to-sky-500/0 text-sky-300",
  amber:  "from-amber-500/20 to-amber-500/0 text-amber-300",
  rose:   "from-rose-500/20 to-rose-500/0 text-rose-300",
  violet: "from-violet-500/20 to-violet-500/0 text-violet-300",
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  delta,
  icon,
  trend,
  accent = "teal",
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-canvas-raised border border-line p-5 shadow-soft">
      {/* Accent gradient corner */}
      <div
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full blur-2xl opacity-60 bg-gradient-to-br",
          accentMap[accent],
        )}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">
            {value}
          </p>
          {delta && (
            <p
              className={cn(
                "mt-1.5 text-xs font-medium inline-flex items-center gap-1",
                delta.positive ? "text-success" : "text-danger",
              )}
            >
              <span aria-hidden>{delta.positive ? "▲" : "▼"}</span>
              {delta.value}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br border border-line",
              accentMap[accent],
            )}
          >
            {icon}
          </div>
        )}
      </div>

      {trend && trend.length > 0 && (
        <div className="relative mt-4 h-10">
          <svg
            viewBox={`0 0 ${trend.length * 10} 40`}
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={cn("opacity-80", accentMap[accent].split(" ").pop())}
              points={trend
                .map((v, i) => {
                  const max = Math.max(...trend);
                  const min = Math.min(...trend);
                  const range = max - min || 1;
                  const y = 38 - ((v - min) / range) * 30;
                  return `${i * 10},${y}`;
                })
                .join(" ")}
            />
          </svg>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   Badge                                    */
/* -------------------------------------------------------------------------- */

export type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-white/5 text-ink-muted border border-line",
  accent:  "bg-accent-500/10 text-accent-300 border border-accent-500/20",
  success: "bg-success-soft text-success border border-success/20",
  warning: "bg-warning-soft text-warning border border-warning/20",
  danger:  "bg-danger-soft text-danger border border-danger/20",
  info:    "bg-info-soft text-info border border-info/20",
};

export const Badge: React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }
> = ({ className, tone = "neutral", ...props }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium",
      badgeTones[tone],
      className,
    )}
    {...props}
  />
);

/* -------------------------------------------------------------------------- */
/*                                  Avatar                                    */
/* -------------------------------------------------------------------------- */

export const Avatar: React.FC<{
  name?: string;
  size?: number;
  className?: string;
}> = ({ name = "U", size = 32, className }) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={cn(
        "rounded-full bg-gradient-to-br from-accent-500 to-sky-500 text-white font-semibold flex items-center justify-center shrink-0",
        className,
      )}
    >
      {initials}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  Spinner                                   */
/* -------------------------------------------------------------------------- */

export const Spinner: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className,
}) => (
  <span
    style={{ width: size, height: size }}
    className={cn(
      "inline-block rounded-full border-2 border-current border-t-transparent animate-spin",
      className,
    )}
  />
);
