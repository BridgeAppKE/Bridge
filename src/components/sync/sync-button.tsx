"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { mockSyncUnit } from "@/lib/actions/sync";
import { syncUnitFromIcal } from "@/lib/sync/sync-service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SyncButtonProps {
  propertyId: string;
  icalUrl?: string | null;
  onSynced?: (syncedAt: string) => void;
  label?: string;
  className?: string;
  useIcal?: boolean;
}

export function SyncButton({
  propertyId,
  icalUrl,
  onSynced,
  label = "Sync",
  className,
  useIcal = true,
}: SyncButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      if (useIcal && icalUrl) {
        const result = await syncUnitFromIcal(propertyId, icalUrl);
        if (result.error) {
          setError(result.error);
        } else if (result.syncedAt) {
          onSynced?.(result.syncedAt);
        }
        return;
      }

      const result = await mockSyncUnit(propertyId);
      if (result.error) {
        setError(result.error);
      } else if (result.syncedAt) {
        onSynced?.(result.syncedAt);
      }
    });
  }

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <Button
        type="button"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "tap-scale gap-2 bg-emerald-600 font-semibold tracking-wide hover:bg-emerald-700",
          "dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
        )}
      >
        <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
        {isPending ? "Syncing…" : label}
      </Button>
      {error && <p className="max-w-[200px] text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
