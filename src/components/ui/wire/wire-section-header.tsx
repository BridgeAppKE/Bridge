import { cn } from "@/lib/utils";
import { sectionLabelClass } from "@/lib/design/tokens";

interface WireSectionHeaderProps {
  eyebrow?: string;
  title: string;
  titleClassName?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function WireSectionHeader({
  eyebrow,
  title,
  titleClassName,
  description,
  action,
  className,
}: WireSectionHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div className="space-y-0.5">
        {eyebrow && <p className={sectionLabelClass}>{eyebrow}</p>}
        <h2
          className={cn(
            "text-base font-semibold text-foreground",
            titleClassName
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
