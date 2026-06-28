"use client";

import { exportRowsToExcel } from "@/lib/export/to-excel";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type ExpenseRow = {
  amount_kes: number;
  category: string;
  date: string;
  properties: { name: string } | null;
};

export function ExportExpensesButton({ expenses }: { expenses: ExpenseRow[] }) {
  if (!expenses.length) return null;

  function handleExport() {
    exportRowsToExcel(
      expenses.map((e) => ({
        Unit: e.properties?.name ?? "",
        Category: e.category,
        Date: e.date,
        AmountKES: e.amount_kes,
      })),
      "Expenses",
      `elitehost-expenses-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="tap-scale gap-2"
    >
      <Download className="h-4 w-4" />
      Export Excel
    </Button>
  );
}
