"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Property } from "@/lib/types/database";

const STORAGE_KEY = "elitehost:selectedUnitId";

export type UnitSelection = "all" | string;

type UnitContextValue = {
  properties: Property[];
  selectedUnitId: UnitSelection;
  setSelectedUnitId: (id: UnitSelection) => void;
  selectedProperty: Property | null;
  isAllUnits: boolean;
};

const UnitContext = createContext<UnitContextValue | null>(null);

export function UnitContextProvider({
  properties,
  children,
}: {
  properties: Property[];
  children: React.ReactNode;
}) {
  const [selectedUnitId, setSelectedUnitIdState] = useState<UnitSelection>("all");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "all" || stored === null) {
      setSelectedUnitIdState("all");
    } else if (properties.some((p) => p.id === stored)) {
      setSelectedUnitIdState(stored);
    }
    setHydrated(true);
  }, [properties]);

  const setSelectedUnitId = useCallback((id: UnitSelection) => {
    setSelectedUnitIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const selectedProperty = useMemo(() => {
    if (selectedUnitId === "all") return null;
    return properties.find((p) => p.id === selectedUnitId) ?? null;
  }, [properties, selectedUnitId]);

  const value = useMemo(
    () => ({
      properties,
      selectedUnitId: hydrated ? selectedUnitId : "all",
      setSelectedUnitId,
      selectedProperty: hydrated ? selectedProperty : null,
      isAllUnits: !hydrated || selectedUnitId === "all",
    }),
    [properties, selectedUnitId, setSelectedUnitId, selectedProperty, hydrated]
  );

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnitContext() {
  const ctx = useContext(UnitContext);
  if (!ctx) {
    throw new Error("useUnitContext must be used within UnitContextProvider");
  }
  return ctx;
}
