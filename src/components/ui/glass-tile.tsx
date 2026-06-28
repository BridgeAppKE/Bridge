import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { surfacePanelClass } from "@/lib/design/tokens";

export interface GlassTileProps extends React.ComponentProps<typeof Card> {
  gridArea?: string;
  children: React.ReactNode;
}

/** Dashboard tile — shadcn Card with consistent panel padding */
export function GlassTile({
  gridArea,
  className,
  children,
  ...props
}: GlassTileProps) {
  return (
    <Card className={cn(gridArea, className)} {...props}>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}

/** Flat panel wrapper for full-width dashboard rows (no nested card chrome) */
export function PanelTile({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(surfacePanelClass, className)}>{children}</div>;
}
