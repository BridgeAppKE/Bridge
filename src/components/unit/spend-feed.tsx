"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ExpenseWithProperty } from "@/lib/actions/expenses-v2";
import { listRowClass } from "@/components/layout/page-shell";

interface SpendFeedProps {
  expenses: ExpenseWithProperty[];
}

export function SpendFeed({ expenses }: SpendFeedProps) {
  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => new Date(e.date) >= monthStart),
    [expenses, monthStart]
  );

  const monthlyTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount_kes), 0);

  const categoryData = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const e of monthExpenses) {
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount_kes));
    }
    return Array.from(byCategory.entries()).map(([category, amount]) => ({ category, amount }));
  }, [monthExpenses]);

  if (!expenses.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No expenses yet. Capture a receipt to log spend.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          This month
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          KES {monthlyTotal.toLocaleString()}
        </p>
        {categoryData.length > 0 && (
          <div className="mt-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} />
                <YAxis hide />
                <Tooltip formatter={(value) => [`KES ${Number(value).toLocaleString()}`, "Spend"]} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <ul className="space-y-2">
      {expenses.map((expense) => (
        <li key={expense.id} className={listRowClass}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">{expense.category}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(expense.date).toLocaleDateString("en-KE", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {(expense as ExpenseWithProperty).vendor_name
                  ? ` · ${(expense as ExpenseWithProperty).vendor_name}`
                  : ""}
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums">
              KES {Number(expense.amount_kes).toLocaleString()}
            </p>
          </div>
        </li>
      ))}
      </ul>
    </div>
  );
}
