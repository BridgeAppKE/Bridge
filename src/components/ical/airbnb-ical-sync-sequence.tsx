"use client";

import { useState, useTransition } from "react";
import { connectIcalFeedAndSync } from "@/lib/actions/ical-feeds";
import {
  validateAirbnbIcalUrl,
  supportWhatsAppUrl,
  AIRBNB_ICAL_PREFIX,
} from "@/lib/ical/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    title: "Go to your Airbnb Calendar",
    body: "Log into Airbnb, open Hosting Dashboard, select your listing, then Pricing and availability → Calendar sync.",
  },
  {
    title: "Export your Calendar",
    body: "Scroll to Calendar sync and click Export Calendar. Airbnb shows a long web link.",
  },
  {
    title: "Copy the Link",
    body: "Click Copy Link. It should start with https://ical.airbnb.com/v1/export/private/...",
  },
  {
    title: "Paste and Save",
    body: "Paste the link below and click Connect Calendar.",
  },
];

interface AirbnbIcalSyncSequenceProps {
  propertyId: string;
  onConnected?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  className?: string;
}

export function AirbnbIcalSyncSequence({
  propertyId,
  onConnected,
  onSkip,
  showSkip = true,
  className,
}: AirbnbIcalSyncSequenceProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConnect() {
    const validationError = validateAirbnbIcalUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await connectIcalFeedAndSync(propertyId, "Airbnb", url);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("success" in result && result.success) {
        setSuccess(
          result.syncWarning
            ? `Connected. Sync note: ${result.syncWarning}`
            : `Calendar connected${result.imported != null ? ` · ${result.imported} events imported` : ""}.`
        );
        onConnected?.();
      }
    });
  }

  const waHelp = supportWhatsAppUrl(
    "Hi EliteHost — I need help finding my Airbnb iCal link."
  );

  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">Airbnb iCal Sync Setup</h2>
        <p className="text-sm text-muted-foreground">
          Import bookings from Airbnb into EliteHost.
        </p>
      </div>

      <ol className="space-y-4">
        {STEPS.map((step, index) => (
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
          placeholder={`${AIRBNB_ICAL_PREFIX}v1/export/private/...`}
          className="font-mono text-sm"
          disabled={isPending}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <p className="text-sm text-muted-foreground">{success}</p>
        )}
        <Button
          type="button"
          onClick={handleConnect}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Connecting…" : "Connect Calendar"}
        </Button>
      </div>

      {showSkip && onSkip && (
        <Button type="button" variant="outline" className="w-full" onClick={onSkip}>
          Skip for now — add via desktop later
        </Button>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Stuck?{" "}
        <a
          href={waHelp}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline underline-offset-4"
        >
          Tap here to share a screenshot on WhatsApp
        </a>
      </p>
    </div>
  );
}
