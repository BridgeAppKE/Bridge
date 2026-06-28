import { cn } from "@/lib/utils";
import {
  pageHeaderClass,
  pageShellClass,
  pageSubtitleClass,
  pageTitleClass,
  wireCardClass,
  wireListRowClass,
  wireSectionLabelClass,
} from "@/lib/design/tokens";
import { WireSectionHeader } from "@/components/ui/wire";

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
          <p className={wireSectionLabelClass}>EliteHost</p>
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
  return <section className={cn(wireCardClass, className)}>{children}</section>;
}

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return <WireSectionHeader title={title} description={description} />;
}

export const listRowClass = wireListRowClass;
