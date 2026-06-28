import { cn } from "@/lib/utils";
import {
  pageHeaderClass,
  pageShellClass,
  pageSubtitleClass,
  pageTitleClass,
} from "@/lib/design/tokens";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageShell({
  title,
  subtitle,
  children,
  actions,
  className,
}: PageShellProps) {
  return (
    <div className={cn(pageShellClass, className)}>
      <header className={cn(pageHeaderClass, "flex items-start justify-between gap-4")}>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            EliteHost
          </p>
          <h1 className={pageTitleClass}>{title}</h1>
          {subtitle && <p className={pageSubtitleClass}>{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function GlassSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("glass-panel p-5 md:p-6", className)}>{children}</section>;
}

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 space-y-1">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export const listRowClass =
  "rounded-xl border border-border/60 bg-background/40 p-3";
