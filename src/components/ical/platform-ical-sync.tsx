"use client";

import { useState, useTransition } from "react";
import { connectIcalFeedAndSync } from "@/lib/actions/ical-feeds";
import {
  validateIcalUrl,
  supportWhatsAppUrl,
  AIRBNB_ICAL_PREFIX,
} from "@/lib/ical/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PLATFORMS = ["Airbnb", "Booking.com", "Other"] as const;

interface PlatformIcalSyncProps {
  propertyId: string;
  onConnected?: () => void;
  className?: string;
  compact?: boolean;
}

export function PlatformIcalSync({
  propertyId,
  onConnected,
  className,
  compact = false,
}: PlatformIcalSyncProps) {
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("Airbnb");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConnect() {
    const validationError = validateIcalUrl(url, platform);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await connectIcalFeedAndSync(propertyId, platform, url);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("success" in result && result.success) {
        setSuccess(
          result.syncWarning
            ? `Connected. ${result.syncWarning}`
            : `Connected${result.imported != null ? ` · ${result.imported} events` : ""}.`
        );
        onConnected?.();
      }
    });
  }

  const waHelp = supportWhatsAppUrl(
    `Hi EliteHost — I need help finding my ${platform} iCal link.`
  );

  return (
    <div className={cn("space-y-4", className)}>
      {!compact && (
        <p className="text-sm text-muted-foreground">
          Import bookings from Airbnb, Booking.com, or another channel.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant={platform === p ? "default" : "outline"}
            onClick={() => setPlatform(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={
            platform === "Airbnb"
              ? `${AIRBNB_ICAL_PREFIX}v1/export/private/...`
              : "Paste .ics export URL…"
          }
          className="font-mono text-sm"
          disabled={isPending}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-muted-foreground">{success}</p>}
        <Button type="button" onClick={handleConnect} disabled={isPending} className="w-full">
          {isPending ? "Connecting…" : "Connect"}
        </Button>
      </div>

      {!compact && (
        <p className="text-center text-xs text-muted-foreground">
          <a href={waHelp} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
            Need help finding the link?
          </a>
        </p>
      )}
    </div>
  );
}
