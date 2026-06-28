import { cn } from "@/lib/utils";
import { bentoGridClass } from "@/lib/design/tokens";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

/** Modular bento container — tiles are direct children with gridArea props */
export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div className={cn(bentoGridClass, className)} data-bento-grid>
      {children}
    </div>
  );
}
