import {
  getExpenses,
  getExpenseCategories,
} from "@/lib/actions/expenses";
import {
  ensureDefaultProperty,
  getUserProperties,
} from "@/lib/actions/properties";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseList } from "@/components/expenses/expense-list";

export default async function ExpensesPage() {
  await ensureDefaultProperty();
  const [properties, expenses, categories] = await Promise.all([
    getUserProperties(),
    getExpenses(),
    getExpenseCategories(),
  ]);

  const total = expenses.reduce((sum, e) => sum + e.amount_kes, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <p className="text-sm text-muted-foreground">
          Track property costs in Kenyan Shillings
        </p>
      </div>

      <ExpenseForm properties={properties} categories={categories} />
      <ExpenseList expenses={expenses} />

      {expenses.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Total recorded:{" "}
          {new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            maximumFractionDigits: 0,
          }).format(total)}
        </p>
      )}
    </div>
  );
}
