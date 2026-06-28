"use client";

import { useState, useTransition } from "react";
import { createInventoryRule } from "@/lib/actions/inventory";
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

interface InventoryRuleFormProps {
  properties: Property[];
}

export function InventoryRuleForm({ properties }: InventoryRuleFormProps) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!properties.length) {
    return (
      <SectionHeader
        title="Add Inventory Rule"
        description="Create a unit first to track consumables."
      />
    );
  }

  function handleSubmit(formData: FormData) {
    formData.set("property_id", propertyId);
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createInventoryRule(formData);
      if (result.error) setError(result.error);
      else setSuccess(true);
    });
  }

  return (
    <div>
      <SectionHeader
        title="Add Inventory Rule"
        description="Define usage per guest (e.g. 1.5 bars of soap per stay)."
      />
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select value={propertyId} onValueChange={(v) => v && setPropertyId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select unit" />
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
          <Label htmlFor="item_name">Item name</Label>
          <Input id="item_name" name="item_name" placeholder="Soap" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="usage_per_guest">Usage / guest</Label>
            <Input
              id="usage_per_guest"
              name="usage_per_guest"
              type="number"
              step="0.1"
              min="0"
              placeholder="1.5"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="current_stock">Current stock</Label>
            <Input
              id="current_stock"
              name="current_stock"
              type="number"
              step="0.1"
              min="0"
              placeholder="20"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="alert_threshold">Alert threshold</Label>
          <Input
            id="alert_threshold"
            name="alert_threshold"
            type="number"
            step="0.1"
            min="0"
            placeholder="5"
          />
        </div>
        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Saving…" : "Add Rule"}
        </Button>
      </form>
      {success && (
        <p className="mt-3 text-sm text-muted-foreground">Rule added successfully.</p>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
