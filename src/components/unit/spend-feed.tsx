"use client";

import type { ExpenseWithProperty } from "@/lib/actions/expenses-v2";
import { listRowClass } from "@/components/layout/page-shell";

interface SpendFeedProps {
  expenses: ExpenseWithProperty[];
}

export function SpendFeed({ expenses }: SpendFeedProps) {
  if (!expenses.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No expenses yet. Capture a receipt to log spend.
      </p>
    );
  }

  return (
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
  );
}
