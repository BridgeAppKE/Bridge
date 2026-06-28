"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { getCircleVisibleUnits } from "@/lib/actions/sync";
import { syncUnitFromIcal } from "@/lib/sync/sync-service";
import { mockSyncUnit } from "@/lib/actions/sync";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CircleSyncButtonProps {
  className?: string;
  circleId?: string;
}

export function CircleSyncButton({ className, circleId }: CircleSyncButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleBatchSync() {
    setError(null);
    setProgress(null);

    startTransition(async () => {
      try {
        const units = await getCircleVisibleUnits(circleId);
        const syncable = units.filter((u) => u.ical_url);

        if (!syncable.length) {
          setError("No units with iCal URLs in your visible Circle.");
          return;
        }

        for (let i = 0; i < syncable.length; i++) {
          const unit = syncable[i];
          setProgress(`${i + 1}/${syncable.length}: ${unit.name}`);

          if (unit.ical_url) {
            const result = await syncUnitFromIcal(unit.id, unit.ical_url);
            if (result.error) {
              setError(`${unit.name}: ${result.error}`);
              return;
            }
          } else {
            await mockSyncUnit(unit.id);
          }
        }

        setProgress(`Synced ${syncable.length} unit(s)`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Batch sync failed");
      }
    });
  }

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleBatchSync}
        disabled={isPending}
        className="tap-scale gap-2"
      >
        <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
        {isPending ? "Syncing Circle…" : "Sync Circle"}
      </Button>
      {progress && <p className="text-xs text-muted-foreground">{progress}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
