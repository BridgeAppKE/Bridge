"use client";

import { useUnitContext } from "@/components/layout/unit-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UnitSelector() {
  const { properties, selectedUnitId, setSelectedUnitId } = useUnitContext();

  if (properties.length === 0) return null;

  return (
    <Select
      value={selectedUnitId}
      onValueChange={(v) => v && setSelectedUnitId(v as "all" | string)}
    >
      <SelectTrigger className="h-8 w-[140px] truncate text-xs sm:w-[180px]" title={
        selectedUnitId === "all"
          ? "All Units"
          : properties.find((p) => p.id === selectedUnitId)?.name
      }>
        <SelectValue placeholder="All Units" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Units</SelectItem>
        {properties.map((p) => (
          <SelectItem key={p.id} value={p.id} title={p.name}>
            <span className="truncate">{p.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
