"use client";

import { useMemo, useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import {
  bulkCreateInventoryItems,
  updateInventoryQuantity,
} from "@/lib/actions/inventory-v2";
import type { InventoryWithProperty } from "@/lib/actions/inventory-v2";
import { AIRBNB_CHECKLIST_ITEMS } from "@/lib/inventory/checklist-presets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InventoryChecklistProps {
  propertyId: string;
  existingItems: InventoryWithProperty[];
}

export function InventoryChecklist({
  propertyId,
  existingItems,
}: InventoryChecklistProps) {
  const existingNames = useMemo(
    () => new Set(existingItems.map((i) => i.name.toLowerCase())),
    [existingItems]
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const missingPresets = AIRBNB_CHECKLIST_ITEMS.filter(
    (item) => !existingNames.has(item.name.toLowerCase())
  );

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function handleBulkAdd() {
    startTransition(async () => {
      const result = await bulkCreateInventoryItems(propertyId, Array.from(selected));
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Added ${result.count} items`);
        setSelected(new Set());
      }
    });
  }

  function adjustQty(itemId: string, delta: number) {
    startTransition(async () => {
      await updateInventoryQuantity(itemId, delta);
    });
  }

  return (
    <div className="space-y-6">
      {missingPresets.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium">Airbnb checklist — select what you track</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {missingPresets.map((item) => {
              const checked = selected.has(item.name);
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => toggle(item.name)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                    checked
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-muted-foreground"
                  )}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
          {selected.size > 0 && (
            <Button
              type="button"
              className="mt-3"
              onClick={handleBulkAdd}
              disabled={isPending}
            >
              Add {selected.size} item{selected.size === 1 ? "" : "s"}
            </Button>
          )}
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-medium">Current stock</p>
        {existingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No items yet. Select from the checklist above.
          </p>
        ) : (
          <ul className="space-y-2">
            {existingItems.map((item) => {
              const low = item.quantity <= item.alert_threshold;
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className={cn("text-xs", low ? "text-amber-600" : "text-muted-foreground")}>
                      {low ? "Low stock · " : ""}
                      threshold {item.alert_threshold}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => adjustQty(item.id, -1)}
                      disabled={isPending}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => adjustQty(item.id, 1)}
                      disabled={isPending}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
