import { getExpenses } from "@/lib/actions/expenses";
import { getInventoryRules } from "@/lib/actions/inventory";
import {
  ensureDefaultProperty,
  getUserProperties,
} from "@/lib/actions/properties";
import { getCurrentUser } from "@/lib/actions/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, Receipt, Users } from "lucide-react";

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function HomePage() {
  await ensureDefaultProperty();

  const user = await getCurrentUser();
  const [properties, expenses, inventoryRules] = await Promise.all([
    getUserProperties(),
    getExpenses(),
    getInventoryRules(),
  ]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount_kes, 0);
  const lowStockItems = inventoryRules.filter(
    (r) => r.current_stock <= r.alert_threshold
  );

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "Host";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Karibu, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of your Nairobi rentals
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Properties</CardDescription>
            <CardTitle className="text-3xl">{properties.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expenses (total)</CardDescription>
            <CardTitle className="text-xl">{formatKes(totalExpenses)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-emerald-600" />
            Inventory Alerts
          </CardTitle>
          <CardDescription>Items at or below threshold</CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">All stock levels OK</p>
          ) : (
            <ul className="space-y-2">
              {lowStockItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{item.item_name}</span>
                  <Badge variant="destructive">{item.current_stock} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-emerald-600" />
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No expenses yet — tap Expenses to add one.
            </p>
          ) : (
            <ul className="space-y-2">
              {expenses.slice(0, 3).map((expense) => (
                <li
                  key={expense.id}
                  className="flex justify-between text-sm"
                >
                  <span>{expense.category}</span>
                  <span className="font-medium tabular-nums">
                    {formatKes(expense.amount_kes)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-100 bg-emerald-50/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-emerald-600" />
            Circles
          </CardTitle>
          <CardDescription>
            Connect with trusted hosts to share availability across Nairobi.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
