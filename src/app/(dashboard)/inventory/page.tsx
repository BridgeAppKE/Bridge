import { PageShell, GlassSection } from "@/components/layout/page-shell";
import { getInventoryItems } from "@/lib/actions/inventory-v2";
import {
  ensureDefaultProperty,
  getUserProperties,
} from "@/lib/actions/properties";
import { InventoryTabs } from "@/components/inventory/inventory-tabs";
import { SimulateCheckout } from "@/components/inventory/simulate-checkout";

export default async function InventoryPage() {
  await ensureDefaultProperty();
  const [properties, items] = await Promise.all([
    getUserProperties(),
    getInventoryItems(),
  ]);

  return (
    <PageShell
      title="Inventory"
      subtitle="Perishable, usable, and non-perishable stock by unit"
    >
      <GlassSection>
        <InventoryTabs properties={properties} items={items} />
      </GlassSection>
      <GlassSection>
        <SimulateCheckout properties={properties} />
      </GlassSection>
    </PageShell>
  );
}
