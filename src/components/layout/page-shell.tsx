import { cn } from "@/lib/utils";
import {
  pageHeaderClass,
  pageShellClass,
  pageSubtitleClass,
  pageTitleClass,
  sectionLabelClass,
  surfacePanelClass,
  listRowClass,
} from "@/lib/design/tokens";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
          <p className={sectionLabelClass}>EliteHost</p>
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
  title,
  description,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  if (title) {
    return (
      <Card className={className}>
        <CardHeader className="border-b">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    );
  }

  return <section className={cn(surfacePanelClass, className)}>{children}</section>;
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
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export { listRowClass };
