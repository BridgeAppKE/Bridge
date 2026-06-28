"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { GlassTile } from "@/components/ui/glass-tile";
import { cn } from "@/lib/utils";
import { exportRowsToExcel } from "@/lib/export/to-excel";
import { Download } from "lucide-react";

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
    <GlassTile
      gridArea="md:col-span-2 md:row-span-1"
      className="min-h-[160px] bg-emerald-900/50 dark:bg-emerald-900/50"
      hoverScale={false}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Net Revenue
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-wide text-foreground">
              {formatKes(displayRevenue)}
            </p>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex rounded-full border border-glass-border bg-glass p-0.5">
              {(["month", "quarter", "year"] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize transition-colors",
                    period === p
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                      : "text-muted-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
              <TrendingUp className="h-3 w-3" />
              {changePercent >= 0 ? "+" : ""}
              {changePercent}%
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="h-16 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
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
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <button
            type="button"
            onClick={() =>
              exportRowsToExcel(trend, "Revenue", "elitehost-revenue.xlsx")
            }
            className="tap-scale flex items-center gap-1 rounded-full border border-glass-border bg-glass px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3 w-3" />
            Excel
          </button>
        </div>
      </div>
    </GlassTile>
  );
}
