"use client";

import { AlertTriangle } from "lucide-react";
import { GlassTile, PanelTile } from "@/components/ui/glass-tile";
import { WireSectionHeader } from "@/components/ui/wire";
import { cn } from "@/lib/utils";

export type InventoryAlert = {
  id: string;
  name: string;
  stockPercent: number;
  label: string;
};

interface InventoryAlertsTileProps {
  items: InventoryAlert[];
  fullWidth?: boolean;
}

export function InventoryAlertsTile({ items, fullWidth }: InventoryAlertsTileProps) {
  const content = (
    <>
      <WireSectionHeader eyebrow="Inventory" title="Replenishment Alerts" />
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">All stock levels healthy.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => {
            const critical = item.stockPercent < 20;
            return (
              <li key={item.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {item.name}
                  </span>
                  {critical && (
                    <span className="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="h-3 w-3" />
                      Low
                    </span>
                  )}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      critical ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${Math.min(item.stockPercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  if (fullWidth) {
    return <PanelTile>{content}</PanelTile>;
  }

  return (
    <GlassTile gridArea="md:col-span-1 md:row-span-2" className="min-h-[280px]">
      {content}
    </GlassTile>
  );
}
