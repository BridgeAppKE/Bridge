"use client";

import { AlertTriangle } from "lucide-react";
import { GlassTile } from "@/components/ui/glass-tile";
import { cn } from "@/lib/utils";

export type InventoryAlert = {
  id: string;
  name: string;
  stockPercent: number;
  label: string;
};

interface InventoryAlertsTileProps {
  items: InventoryAlert[];
}

export function InventoryAlertsTile({ items }: InventoryAlertsTileProps) {
  return (
    <GlassTile
      gridArea="md:col-span-1 md:row-span-2"
      className="min-h-[280px] bg-emerald-900/50"
    >
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-200/80">
          Inventory
        </p>
        <h2 className="text-lg font-semibold tracking-wide text-emerald-50">
          Replenishment Alerts
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-emerald-200/70">All stock levels healthy.</p>
      ) : (
        <ul className="flex flex-1 flex-col gap-4">
          {items.map((item) => {
            const critical = item.stockPercent < 20;
            return (
              <li key={item.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-50">
                    {item.name}
                  </span>
                  {critical && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                      <AlertTriangle className="h-3 w-3" />
                      Low
                    </span>
                  )}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      critical ? "bg-amber-400" : "bg-emerald-400"
                    )}
                    style={{ width: `${Math.min(item.stockPercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-emerald-200/70">{item.label}</p>
              </li>
            );
          })}
        </ul>
      )}
    </GlassTile>
  );
}
