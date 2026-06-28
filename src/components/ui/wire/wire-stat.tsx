import { cn } from "@/lib/utils";
import { wireSectionLabelClass, wireStatClass } from "@/lib/design/tokens";

interface WireStatProps {
  label: string;
  value: string;
  hint?: string;
  trend?: React.ReactNode;
  className?: string;
}

export function WireStat({ label, value, hint, trend, className }: WireStatProps) {
  return (
    <div className={cn(wireStatClass, className)}>
      <p className={wireSectionLabelClass}>{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        {trend}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
