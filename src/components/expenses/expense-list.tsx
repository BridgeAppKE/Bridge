import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Expenses</CardTitle>
          <CardDescription>No expenses recorded yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Expenses</CardTitle>
        <CardDescription>Latest property costs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <p className="font-medium">{expense.category}</p>
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
              <p className="font-semibold tabular-nums">
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
      </CardContent>
    </Card>
  );
}
