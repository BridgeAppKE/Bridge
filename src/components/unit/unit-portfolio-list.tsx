"use client";

import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import type { UnitCardSummary } from "@/lib/actions/units";
import { PanelTile } from "@/components/ui/glass-tile";
import { EditUnitDialog } from "@/components/units/rename-property-dialog";
import { pageShellClass, pageTitleClass, pageSubtitleClass, sectionLabelClass } from "@/lib/design/tokens";
import { AddUnitDialog } from "@/components/units/add-unit-dialog";

interface UnitPortfolioListProps {
  units: UnitCardSummary[];
}

export function UnitPortfolioList({ units }: UnitPortfolioListProps) {
  return (
    <div className={pageShellClass}>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className={sectionLabelClass}>Operations</p>
          <h1 className={pageTitleClass}>Your Units</h1>
          <p className={pageSubtitleClass}>Tap a unit to manage stock, spend, and compliance</p>
        </div>
        <AddUnitDialog />
      </header>

      {units.length === 0 ? (
        <PanelTile>
          <p className="text-sm text-muted-foreground">
            No units yet. Add your first property to get started.
          </p>
        </PanelTile>
      ) : (
        <div className="space-y-3">
          {units.map((unit) => (
            <PanelTile key={unit.id} className="flex items-center justify-between gap-3 p-4">
              <Link href={`/unit/${unit.id}`} className="tap-scale flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground" title={unit.name}>
                    {unit.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {unit.lowStockCount > 0
                      ? `${unit.lowStockCount} low stock`
                      : "Stock OK"}
                    {" · "}
                    KES {unit.spendMtd.toLocaleString()} spent this month
                  </p>
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <EditUnitDialog
                  propertyId={unit.id}
                  currentName={unit.name}
                  currentBaseRateKes={unit.baseRateKes}
                  trigger="text"
                />
                <Link href={`/unit/${unit.id}`} className="p-1 text-muted-foreground">
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
            </PanelTile>
          ))}
        </div>
      )}
    </div>
  );
}
