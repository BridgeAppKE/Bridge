"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { TrendingUp, Download } from "lucide-react";
import { GlassTile } from "@/components/ui/glass-tile";
import { WireSectionHeader } from "@/components/ui/wire";
import { cn } from "@/lib/utils";
import { exportRowsToExcel } from "@/lib/export/to-excel";
import { Button } from "@/components/ui/button";
import { sectionLabelClass } from "@/lib/design/tokens";

export type RevenuePoint = { label: string; value: number };
export type BookingExportRow = {
  Date: string;
  "Guest Name": string;
  Unit: string;
  Nights: number;
  Amount: number;
  "Payment Method": string;
};

type Period = "month" | "quarter" | "year";

interface FinancialTileProps {
  netRevenue: number;
  quarterRevenue: number;
  yearRevenue: number;
  trend: RevenuePoint[];
  changePercent: number;
  compact?: boolean;
  exportRowsByPeriod?: Record<Period, BookingExportRow[]>;
}

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FinancialTile({
  netRevenue,
  quarterRevenue,
  yearRevenue,
  trend,
  changePercent,
  compact = false,
  exportRowsByPeriod,
}: FinancialTileProps) {
  const [period, setPeriod] = useState<Period>("month");

  const displayRevenue = useMemo(() => {
    if (period === "quarter") return quarterRevenue;
    if (period === "year") return yearRevenue;
    return netRevenue;
  }, [period, netRevenue, quarterRevenue, yearRevenue]);

  const periodLabel =
    period === "month" ? "This month" : period === "quarter" ? "This quarter" : "This year";

  const inner = (
    <div className={cn("flex h-full flex-col justify-between", compact && "p-5")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {compact ? (
            <>
              <p className={sectionLabelClass}>Revenue</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {formatKes(displayRevenue)}
              </p>
              <p className="text-xs text-muted-foreground">{periodLabel}</p>
            </>
          ) : (
            <WireSectionHeader
              eyebrow="Revenue"
              title={formatKes(displayRevenue)}
              description={periodLabel}
              className="mb-0"
            />
          )}
        </div>
        {!compact && (
          <div className="flex flex-col items-end gap-2">
            <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
              {(["month", "quarter", "year"] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-medium capitalize transition-colors",
                    period === p
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-medium text-foreground">
              <TrendingUp className="h-3 w-3" />
              {changePercent >= 0 ? "+" : ""}
              {changePercent}%
            </div>
          </div>
        )}
      </div>

      {compact ? (
        changePercent !== 0 && (
          <p
            className={cn(
              "text-xs font-medium",
              changePercent >= 0 ? "text-foreground" : "text-destructive"
            )}
          >
            {changePercent >= 0 ? "↑" : "↓"} {Math.abs(changePercent).toFixed(0)}% vs prior
          </p>
        )
      ) : (
        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="h-16 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <Tooltip
                  formatter={(value) =>
                    [formatKes(Number(value ?? 0)), "Revenue"]
                  }
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-[10px]"
            onClick={() => {
              const now = new Date();
              const monthName = now.toLocaleDateString("en-KE", { month: "long" });
              const bookingRows = exportRowsByPeriod?.[period];
              if (bookingRows) {
                exportRowsToExcel(
                  bookingRows,
                  "Revenue",
                  `EliteHost_Revenue_${monthName}_${now.getFullYear()}.xlsx`
                );
              } else {
                exportRowsToExcel(
                  trend,
                  "Revenue",
                  `EliteHost_Revenue_${monthName}_${now.getFullYear()}.xlsx`
                );
              }
            }}
          >
            <Download className="h-3 w-3" />
            Excel
          </Button>
        </div>
      )}
    </div>
  );

  if (compact) {
    return inner;
  }

  return (
    <GlassTile gridArea="md:col-span-2 md:row-span-1" className="min-h-[160px]">
      {inner}
    </GlassTile>
  );
}
