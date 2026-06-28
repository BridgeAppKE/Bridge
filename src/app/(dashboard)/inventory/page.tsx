import { PageShell, GlassSection } from "@/components/layout/page-shell";
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
    <PageShell
      title="Inventory"
      subtitle="Automate consumable tracking per guest checkout"
    >
      <GlassSection>
        <InventoryRuleForm properties={properties} />
      </GlassSection>
      <GlassSection>
        <SimulateCheckout properties={properties} />
      </GlassSection>
      <GlassSection>
        <InventoryList rules={rules} />
      </GlassSection>
    </PageShell>
  );
}
