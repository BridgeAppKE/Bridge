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

export type RevenuePoint = { label: string; value: number };

type Period = "month" | "quarter" | "year";

interface FinancialTileProps {
  netRevenue: number;
  quarterRevenue: number;
  yearRevenue: number;
  trend: RevenuePoint[];
  changePercent: number;
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
}: FinancialTileProps) {
  const [period, setPeriod] = useState<Period>("month");

  const displayRevenue = useMemo(() => {
    if (period === "quarter") return quarterRevenue;
    if (period === "year") return yearRevenue;
    return netRevenue;
  }, [period, netRevenue, quarterRevenue, yearRevenue]);

  const periodLabel =
    period === "month" ? "This month" : period === "quarter" ? "This quarter" : "This year";

  return (
    <GlassTile gridArea="md:col-span-2 md:row-span-1" className="min-h-[160px]" hoverScale={false}>
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <WireSectionHeader
              eyebrow="Revenue"
              title={formatKes(displayRevenue)}
              description={periodLabel}
              className="mb-0"
            />
          </div>
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
        </div>

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
            onClick={() =>
              exportRowsToExcel(trend, "Revenue", "elitehost-revenue.xlsx")
            }
          >
            <Download className="h-3 w-3" />
            Excel
          </Button>
        </div>
      </div>
    </GlassTile>
  );
}
