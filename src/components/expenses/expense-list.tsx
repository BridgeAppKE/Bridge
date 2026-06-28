import { Badge } from "@/components/ui/badge";
import { SectionHeader, listRowClass } from "@/components/layout/page-shell";
import { cn } from "@/lib/utils";

type ExpenseWithProperty = {
  id: string;
  amount_kes: number;
  category: string;
  date: string;
  receipt_url: string | null;
  properties: { name: string } | null;
};

interface ExpenseListProps {
  expenses: ExpenseWithProperty[];
}

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  if (!expenses.length) {
    return (
      <SectionHeader
        title="Recent Expenses"
        description="No expenses recorded yet."
      />
    );
  }

  return (
    <div>
      <SectionHeader
        title="Recent Expenses"
        description="Latest unit costs"
      />
      <div className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className={cn(listRowClass, "flex items-center justify-between")}
          >
            <div>
              <p className="font-medium text-foreground">{expense.category}</p>
              <p className="text-xs text-muted-foreground">
                {expense.properties?.name} ·{" "}
                {new Date(expense.date).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums text-foreground">
                {formatKes(expense.amount_kes)}
              </p>
              {expense.receipt_url && (
                <Badge variant="outline" className="mt-1 text-xs">
                  Receipt
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
