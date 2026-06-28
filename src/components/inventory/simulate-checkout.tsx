"use client";

import { useState, useTransition } from "react";
import { simulateCheckout } from "@/lib/actions/inventory";
import type { Property } from "@/lib/types/database";
import { SectionHeader, listRowClass } from "@/components/layout/page-shell";
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

interface SimulateCheckoutProps {
  properties: Property[];
}

export function SimulateCheckout({ properties }: SimulateCheckoutProps) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [result, setResult] = useState<{
    guestCount: number;
    updates: { item: string; deducted: number; newStock: number; low: boolean }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!properties.length) return null;

  function handleSubmit(formData: FormData) {
    formData.set("property_id", propertyId);
    setError(null);
    setResult(null);
    startTransition(async () => {
      const response = await simulateCheckout(formData);
      if (response.error) {
        setError(response.error);
      } else if (response.success && response.updates) {
        setResult({
          guestCount: response.guestCount!,
          updates: response.updates,
        });
      }
    });
  }

  return (
    <div>
      <SectionHeader
        title="Simulate Checkout"
        description="Mock a guest checkout to deduct inventory based on your rules."
      />
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select value={propertyId} onValueChange={(v) => v && setPropertyId(v)}>
            <SelectTrigger className="w-full">
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
          <Label htmlFor="guest_count">Number of guests</Label>
          <Input
            id="guest_count"
            name="guest_count"
            type="number"
            min="1"
            defaultValue="2"
            required
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          disabled={isPending}
          className="w-full border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
        >
          {isPending ? "Processing…" : "Simulate Checkout"}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {result && (
        <div className={listRowClass + " mt-4 space-y-2"}>
          <p className="text-sm font-medium text-foreground">
            Deducted for {result.guestCount} guest(s):
          </p>
          <ul className="space-y-1 text-sm">
            {result.updates.map((u) => (
              <li key={u.item} className="flex justify-between">
                <span>{u.item}</span>
                <span className="tabular-nums text-muted-foreground">
                  −{u.deducted.toFixed(1)} → {u.newStock.toFixed(1)}
                  {u.low && " ⚠️"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
