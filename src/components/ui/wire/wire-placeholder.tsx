import { cn } from "@/lib/utils";

interface WirePlaceholderProps {
  aspectRatio?: string;
  className?: string;
  label?: string;
}

/** Wireframe Kit media block placeholder */
export function WirePlaceholder({
  aspectRatio = "aspect-video",
  className,
  label,
}: WirePlaceholderProps) {
  return (
    <div
      className={cn(
        "wire-placeholder relative flex items-center justify-center overflow-hidden",
        aspectRatio,
        className
      )}
    >
      {label && (
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
}

interface WireTextLinesProps {
  lines?: number;
  className?: string;
}

export function WireTextLines({ lines = 3, className }: WireTextLinesProps) {
  const widths = ["w-full", "w-5/6", "w-4/6", "w-3/4"];
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn("wire-placeholder-text h-2", widths[i % widths.length])}
        />
      ))}
    </div>
  );
}
