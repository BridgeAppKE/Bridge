import { getInventoryRules } from "@/lib/actions/inventory";
import {
  ensureDefaultProperty,
  getUserProperties,
} from "@/lib/actions/properties";
import { InventoryRuleForm } from "@/components/inventory/inventory-rule-form";
import { InventoryList } from "@/components/inventory/inventory-list";
import { SimulateCheckout } from "@/components/inventory/simulate-checkout";

export default async function InventoryPage() {
  await ensureDefaultProperty();
  const [properties, rules] = await Promise.all([
    getUserProperties(),
    getInventoryRules(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">
          Automate consumable tracking per guest checkout
        </p>
      </div>

      <InventoryRuleForm properties={properties} />
      <SimulateCheckout properties={properties} />
      <InventoryList rules={rules} />
    </div>
  );
}
