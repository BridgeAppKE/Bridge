import { cn } from "@/lib/utils";
import { wireSectionLabelClass } from "@/lib/design/tokens";

interface WireSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function WireSectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: WireSectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div className="space-y-0.5">
        {eyebrow && <p className={wireSectionLabelClass}>{eyebrow}</p>}
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
