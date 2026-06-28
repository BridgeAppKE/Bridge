"use client";

import { useMemo, useState, useTransition } from "react";
import { CircleSyncButton } from "@/components/sync/circle-sync-button";
import { SectionHeader, listRowClass } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ManageCircleSheet } from "@/components/circles/manage-circle-sheet";
import type { PeerAvailabilityRow } from "@/lib/actions/circles";
import type { CircleGroup } from "@/lib/actions/circles";
import { todayIsoDate } from "@/lib/inventory/consumption";
import { pageShellClass, pageTitleClass, pageSubtitleClass, sectionLabelClass } from "@/lib/design/tokens";

interface CirclesReferralClientProps {
  initialResults: PeerAvailabilityRow[];
  circles: CircleGroup[];
  hostShortCode: string | null;
  inviteUrl: string | null;
}

export function CirclesReferralClient({
  initialResults,
  circles,
  hostShortCode,
  inviteUrl,
}: CirclesReferralClientProps) {
  const today = todayIsoDate();
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [bedrooms, setBedrooms] = useState<number | "any">("any");
  const [results, setResults] = useState(initialResults);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return results.filter((row) => {
      if (bedrooms === "any") return true;
      if (bedrooms === 3) return (row.bedrooms ?? 1) >= 3;
      return (row.bedrooms ?? 1) === bedrooms;
    });
  }, [results, bedrooms]);

  function handleSearch() {
    if (!checkIn || !checkOut) return;
    startTransition(async () => {
      const { searchPeerAvailability } = await import("@/lib/actions/circles");
      const rows = await searchPeerAvailability(checkIn, checkOut);
      setResults(rows);
    });
  }

  function copyReferralNote(row: PeerAvailabilityRow) {
    const note = `Hi! I have a client looking for ${checkIn} to ${checkOut}. Your unit "${row.property_name}" (${row.bedrooms} bed, KES ${row.base_rate_kes.toLocaleString()}/night) looks available. Can we refer them? — EliteHost Circle`;
    navigator.clipboard.writeText(note);
  }

  function whatsAppHost(row: PeerAvailabilityRow) {
    const text = encodeURIComponent(
      `Hi ${row.host_name}! Client needs ${checkIn}–${checkOut}. Is ${row.property_name} (KES ${row.base_rate_kes.toLocaleString()}/night) still free?`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  return (
    <div className={pageShellClass}>
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className={sectionLabelClass}>Network</p>
          <h1 className={pageTitleClass}>Circles</h1>
          <p className={pageSubtitleClass}>
            Find peer availability when your units are full
          </p>
        </div>
        <ManageCircleSheet circles={circles} hostShortCode={hostShortCode} inviteUrl={inviteUrl} />
      </header>

      <div className="space-y-4 rounded-xl border border-border p-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="check-in">From</Label>
            <Input
              id="check-in"
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="check-out">To</Label>
            <Input
              id="check-out"
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={handleSearch} disabled={isPending || !checkIn || !checkOut}>
            {isPending ? "Searching…" : "Search"}
          </Button>
          <CircleSyncButton />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["any", 1, 2, 3] as const).map((b) => (
            <Button
              key={String(b)}
              type="button"
              size="sm"
              variant={bedrooms === b ? "default" : "outline"}
              onClick={() => setBedrooms(b)}
            >
              {b === "any" ? "Any beds" : b === 3 ? "3+ beds" : `${b} bed`}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader
          title="Available peers"
          description={
            checkIn && checkOut
              ? `${filtered.length} unit${filtered.length === 1 ? "" : "s"} free for selected dates`
              : "Pick dates to search your Circle network"
          }
        />
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No matching units. Try syncing calendars or widening the bedroom filter.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((row) => (
              <div key={row.property_id} className={listRowClass}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{row.property_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.is_own
                        ? "Your unit"
                        : `${row.host_name} · KES ${row.base_rate_kes.toLocaleString()}/night${row.location ? ` · ${row.location}` : ""}`}
                    </p>
                  </div>
                  <Badge variant={row.is_own ? "outline" : "secondary"}>
                    {row.bedrooms ?? 1} bed{(row.bedrooms ?? 1) === 1 ? "" : "s"}
                  </Badge>
                </div>
                {!row.is_own && (
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => whatsAppHost(row)}>
                      WhatsApp host
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => copyReferralNote(row)}>
                      Copy referral note
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
