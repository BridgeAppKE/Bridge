"use client";

import { useState, useTransition } from "react";
import { createInventoryItem, updateUsableStatus } from "@/lib/actions/inventory-v2";
import type { InventoryWithProperty } from "@/lib/actions/inventory-v2";
import type { Property } from "@/lib/types/database";
import { SectionHeader } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "perishable", label: "Perishable" },
  { id: "usable", label: "Usable assets" },
  { id: "non_perishable", label: "Non-perishable" },
] as const;

interface InventoryTabsProps {
  properties: Property[];
  items: InventoryWithProperty[];
}

export function InventoryTabs({ properties, items }: InventoryTabsProps) {
  const [tab, setTab] = useState<(typeof CATEGORIES)[number]["id"]>("perishable");
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  const filtered = items.filter((i) => i.category === tab);

  function handleCreate(formData: FormData) {
    formData.set("property_id", propertyId);
    formData.set("category", tab);
    startTransition(async () => {
      await createInventoryItem(formData);
    });
  }

  function toggleUsableStatus(itemId: string, status: "available" | "laundry" | "damaged") {
    startTransition(async () => {
      await updateUsableStatus(itemId, status);
    });
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            type="button"
            size="sm"
            variant={tab === cat.id ? "default" : "outline"}
            onClick={() => setTab(cat.id)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      <SectionHeader
        title={`${CATEGORIES.find((c) => c.id === tab)?.label} inventory`}
        description="Track stock by category. Usable assets support laundry/damaged states."
      />

      {properties.length > 0 && (
        <form action={handleCreate} className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select value={propertyId} onValueChange={(v) => v && setPropertyId(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-name">Item</Label>
            <Input id="inv-name" name="name" placeholder="Towels, toothpaste…" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-qty">Quantity</Label>
            <Input id="inv-qty" name="quantity" type="number" min="0" step="1" defaultValue="10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-threshold">Alert threshold</Label>
            <Input id="inv-threshold" name="alert_threshold" type="number" min="0" defaultValue="2" />
          </div>
          <Button type="submit" disabled={isPending} className="sm:col-span-2">
            Add item
          </Button>
        </form>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items in this category yet.</p>
        ) : (
          filtered.map((item) => {
            const low = item.quantity <= item.alert_threshold;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                  low && "border-amber-500/40 bg-amber-500/5"
                )}
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.properties?.name} · {item.quantity} in stock
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {low && <Badge variant="secondary">Low stock</Badge>}
                  {tab === "usable" && (
                    <>
                      {(["available", "laundry", "damaged"] as const).map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={item.usable_status === s ? "default" : "outline"}
                          disabled={isPending}
                          onClick={() => toggleUsableStatus(item.id, s)}
                        >
                          {s}
                        </Button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
