import type { ReactNode } from "react";
import type React from "react";
import { cn } from "@/lib/utils";

const logoSrc = "/p1.jpg";

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <SidebarLogo className="w-8 lg:w-8" />
      <span className="font-brand text-[22px] font-bold leading-none tracking-tight text-foreground">
        meyveda
      </span>
    </span>
  );
}

export function FullLogo({ className }: { className?: string }) {
  return (
    <img
      src="/meyveda-logo.png"
      alt="Meyveda — reinvent you"
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}

export function SidebarLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative w-[44px] shrink-0 overflow-hidden lg:w-[130px]", className)}
      style={{ aspectRatio: "646 / 562" }}
    >
      <img
        src={logoSrc}
        alt="Meyveda — reinvent you"
        className="pointer-events-none absolute max-w-none select-none"
        style={{
          width: "212.38%",
          height: "139.50%",
          left: "-56.81%",
          top: "-12.81%",
        }}
      />
    </div>
  );
}

export function Avatar({
  initials,
  size = "md",
  tone = "brand",
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "soft";
}) {
  const s =
    size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold",
        s,
        tone === "brand"
          ? "bg-primary text-primary-foreground"
          : "bg-accent text-accent-foreground",
      )}
    >
      {initials}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "motif-corner mb-6 rounded-2xl border border-border bg-secondary px-5 py-6 shadow-soft sm:px-7 sm:py-7",
        className,
      )}
    >
      <div className="relative z-[1] flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-3 block h-1 w-8 rounded-full bg-primary" aria-hidden="true" />
          <h1 className="type-page">{title}</h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: "brand" | "sage" | "muted" | "danger" | "warning" | "info";
  children: ReactNode;
  className?: string;
}) {
  const t = {
    brand: "bg-accent text-accent-foreground border border-primary/20",
    sage: "bg-success-soft text-success border border-success/20",
    muted: "bg-surface text-muted-foreground border border-border",
    danger: "bg-danger-soft text-destructive border border-destructive/20",
    warning: "bg-warning-soft text-warning border border-warning/20",
    info: "bg-info-soft text-info border border-info/20",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        t,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
        {icon || <div className="h-8 w-8 rounded-full bg-primary/20" />}
      </div>
      <p className="type-section font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: { label: string; direction: "up" | "down" | "neutral" };
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card-surface card-hover relative cursor-pointer p-5 transition-all",
        onClick && "hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="font-brand mt-2 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {(subtitle || trend) && (
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                "font-semibold",
                trend.direction === "up"
                  ? "text-success"
                  : trend.direction === "down"
                    ? "text-destructive"
                    : "text-muted-foreground",
              )}
            >
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
