import {
  getExpenses,
  getExpenseCategories,
} from "@/lib/actions/expenses-v2";
import {
  ensureDefaultProperty,
  getUserProperties,
} from "@/lib/actions/properties";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { ExpenseList } from "@/components/expenses/expense-list";
import { ExportExpensesButton } from "@/components/expenses/export-expenses-button";
import { PageShell, GlassSection } from "@/components/layout/page-shell";

export default async function ExpensesPage() {
  await ensureDefaultProperty();
  const [properties, expenses, categories] = await Promise.all([
    getUserProperties(),
    getExpenses(),
    getExpenseCategories(),
  ]);

  const total = expenses.reduce((sum, e) => sum + e.amount_kes, 0);

  return (
    <PageShell
      title="Expenses"
      subtitle="Track unit costs in Kenyan Shillings"
      actions={<ExportExpensesButton expenses={expenses} />}
    >
      <ExpenseForm properties={properties} categories={categories} />
      <GlassSection>
        <ExpenseList expenses={expenses} />
      </GlassSection>
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
    </PageShell>
  );
}
