"use client";

import Link from "next/link";
import {
  Camera,
  ChevronRight,
  ClipboardList,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { PanelTile } from "@/components/ui/glass-tile";
import { EditUnitDialog } from "@/components/units/rename-property-dialog";
import { pageShellClass, pageTitleClass, sectionLabelClass } from "@/lib/design/tokens";
import { cn } from "@/lib/utils";

interface UnitBentoHubProps {
  propertyId: string;
  propertyName: string;
  baseRateKes: number;
  unitCount: number;
  lowStockCount: number;
  spendMtd: number;
  pendingTasks: number;
  etimsOptIn: boolean;
}

function BentoLink({
  href,
  icon: Icon,
  title,
  subtitle,
  highlight,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  highlight?: boolean;
}) {
  return (
    <Link href={href} className="tap-scale block">
      <PanelTile
        className={cn(
          "flex items-center justify-between gap-3 p-4",
          highlight && "border-primary/30 bg-primary/5"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </PanelTile>
    </Link>
  );
}

export function UnitBentoHub({
  propertyId,
  propertyName,
  baseRateKes,
  unitCount,
  lowStockCount,
  spendMtd,
  pendingTasks,
  etimsOptIn,
}: UnitBentoHubProps) {
  const base = `/unit/${propertyId}`;

  return (
    <div className={pageShellClass}>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className={sectionLabelClass}>Unit hub</p>
          <div className="flex items-center gap-1">
            <h1 className={cn(pageTitleClass, "truncate")} title={propertyName}>
              {propertyName}
            </h1>
            <EditUnitDialog
              propertyId={propertyId}
              currentName={propertyName}
              currentBaseRateKes={baseRateKes}
            />
          </div>
        </div>
      </header>

      {unitCount >= 2 && (
        <Link href="/unit/capture" className="tap-scale mb-3 block">
          <PanelTile className="flex items-center justify-between gap-3 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Bulk shop</p>
                <p className="text-xs text-muted-foreground">Split one receipt across units</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </PanelTile>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href={`${base}/stock`} className="tap-scale block">
          <PanelTile className="flex min-h-[120px] flex-col justify-between p-4">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Stock
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {lowStockCount > 0 ? `${lowStockCount} alerts` : "All good"}
              </p>
            </div>
          </PanelTile>
        </Link>
        <Link href={`${base}/spend`} className="tap-scale block">
          <PanelTile className="flex min-h-[120px] flex-col justify-between p-4">
            <Receipt className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Spend MTD
              </p>
              <p className="text-lg font-semibold tabular-nums">
                KES {spendMtd.toLocaleString()}
              </p>
            </div>
          </PanelTile>
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        <BentoLink
          href={`${base}/capture`}
          icon={Camera}
          title="Capture receipt"
          subtitle="Camera-first · OCR when available"
          highlight
        />
        <BentoLink
          href={`${base}/operations`}
          icon={ClipboardList}
          title="Operations"
          subtitle={
            pendingTasks > 0
              ? `${pendingTasks} task${pendingTasks === 1 ? "" : "s"} pending`
              : "No pending tasks"
          }
        />
        <BentoLink
          href={`${base}/compliance`}
          icon={ShieldCheck}
          title="Compliance"
          subtitle={etimsOptIn ? "eTIMS enabled" : "eTIMS off · private invoices"}
        />
      </div>
    </div>
  );
}
