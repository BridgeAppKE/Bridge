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

const STEPS: Record<(typeof PLATFORMS)[number], { title: string; body: string }[]> = {
  Airbnb: [
    { title: "Open Airbnb Calendar", body: "Hosting → Calendar → Availability settings → Export calendar." },
    { title: "Copy export link", body: "Link starts with https://ical.airbnb.com/..." },
    { title: "Paste below", body: "Connect to import bookings into EliteHost." },
  ],
  "Booking.com": [
    { title: "Open Booking.com Extranet", body: "Rates & Availability → Sync calendars." },
    { title: "Export calendar", body: "Copy the .ics export URL (may start with webcal://)." },
    { title: "Paste below", body: "Connect to import Booking.com reservations." },
  ],
  Other: [
    { title: "Find export URL", body: "From your channel manager or OTA calendar sync settings." },
    { title: "Paste .ics link", body: "Any HTTPS or webcal calendar feed URL." },
  ],
};

interface PlatformIcalSyncProps {
  propertyId: string;
  onConnected?: () => void;
  className?: string;
}

export function PlatformIcalSync({ propertyId, onConnected, className }: PlatformIcalSyncProps) {
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
            : `Calendar connected${result.imported != null ? ` · ${result.imported} events` : ""}.`
        );
        onConnected?.();
      }
    });
  }

  const waHelp = supportWhatsAppUrl(
    `Hi EliteHost — I need help finding my ${platform} iCal link.`
  );

  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Connect calendar</h2>
        <p className="text-sm text-muted-foreground">
          Import bookings from Airbnb, Booking.com, or another channel.
        </p>
      </div>

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

      <ol className="space-y-4">
        {STEPS[platform].map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </span>
            <div>
              <p className="font-medium text-foreground">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="space-y-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={
            platform === "Airbnb"
              ? `${AIRBNB_ICAL_PREFIX}v1/export/private/...`
              : "https://admin.booking.com/... or webcal://..."
          }
          className="font-mono text-sm"
          disabled={isPending}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-muted-foreground">{success}</p>}
        <Button type="button" onClick={handleConnect} disabled={isPending} className="w-full">
          {isPending ? "Connecting…" : "Connect calendar"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Receipt scanning is separate — use Unit → Capture to log spend from shopping trips.
      </p>

      <p className="text-center text-xs text-muted-foreground">
        Stuck?{" "}
        <a href={waHelp} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4">
          WhatsApp support
        </a>
      </p>
    </div>
  );
}
