import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { wireListRowClass } from "@/lib/design/tokens";

interface WireListRowProps {
  children: React.ReactNode;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  className?: string;
  onClick?: () => void;
}

export function WireListRow({
  children,
  trailing,
  showChevron = false,
  className,
  onClick,
}: WireListRowProps) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        wireListRowClass,
        "w-full text-left",
        onClick && "tap-scale hover:bg-muted/50",
        className
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {trailing}
      {showChevron && (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </Comp>
  );
}
