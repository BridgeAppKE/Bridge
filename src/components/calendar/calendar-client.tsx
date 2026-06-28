"use client";

import { useState } from "react";
import type { Property } from "@/lib/types/database";
import { PageShell, GlassSection } from "@/components/layout/page-shell";
import { SyncButton } from "@/components/sync/sync-button";
import { LastSynced } from "@/components/sync/last-synced";
import { CircleSyncButton } from "@/components/sync/circle-sync-button";
import { AddUnitDialog } from "@/components/units/add-unit-dialog";
import { BlockDatesDialog } from "@/components/units/block-dates-dialog";
import { GenerateInvoiceButton } from "@/components/bookings/generate-invoice-button";
import { FinalizeBookingButton } from "@/components/bookings/finalize-booking-button";
import { AirbnbIcalSyncSequence } from "@/components/ical/airbnb-ical-sync-sequence";
import { IcalExportPanel } from "@/components/ical/ical-export-panel";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BookingRow = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  is_manual_block: boolean;
  guest_count: number | null;
  properties: { name: string; owner_id: string } | null;
};

interface CalendarClientProps {
  units: Property[];
  bookings: BookingRow[];
  siteOrigin: string;
}

export function CalendarClient({ units, bookings, siteOrigin }: CalendarClientProps) {
  const [selectedId, setSelectedId] = useState(units[0]?.id ?? "");
  const [syncTimes, setSyncTimes] = useState<Record<string, string | null>>(
    Object.fromEntries(units.map((u) => [u.id, u.last_synced_at]))
  );

  const selected = units.find((u) => u.id === selectedId) ?? units[0];
  const unitBookings = bookings.filter((b) => b.property_id === selected?.id);

  return (
    <PageShell
      title="Calendar"
      subtitle="Sync iCal feeds and manage availability across your Circle"
      actions={
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          <AddUnitDialog />
          <CircleSyncButton />
        </div>
      }
    >
      {units.length === 0 ? (
        <GlassSection>
          <p className="text-sm text-muted-foreground">
            No units yet. Add your first unit to start syncing calendars.
          </p>
        </GlassSection>
      ) : (
        <>
          <GlassSection className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <LabelUnitSelect
                  units={units}
                  selectedId={selected?.id ?? ""}
                  onChange={setSelectedId}
                />
                <LastSynced syncedAt={syncTimes[selected?.id ?? ""]} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selected && (
                  <>
                    <SyncButton
                      propertyId={selected.id}
                      icalUrl={selected.ical_url}
                      onSynced={(at) =>
                        setSyncTimes((prev) => ({ ...prev, [selected.id]: at }))
                      }
                    />
                    <BlockDatesDialog
                      propertyId={selected.id}
                      propertyName={selected.name}
                    />
                  </>
                )}
              </div>
            </div>
            {!selected?.ical_url && (
              <p className="text-xs text-muted-foreground">
                Connect Airbnb below to import bookings automatically.
              </p>
            )}
          </GlassSection>

          {selected && (
            <>
              <GlassSection>
                <AirbnbIcalSyncSequence
                  propertyId={selected.id}
                  showSkip={false}
                  onConnected={() => window.location.reload()}
                />
              </GlassSection>
              {(selected as Property & { ical_export_token?: string }).ical_export_token && (
                <GlassSection>
                  <IcalExportPanel
                    property={selected}
                    exportUrl={`${siteOrigin}/api/units/${(selected as Property & { ical_export_token?: string }).ical_export_token}/ical`}
                  />
                </GlassSection>
              )}
            </>
          )}

          <GlassSection>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Bookings & Blocks
            </h2>
            {unitBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings or blocks for this unit.</p>
            ) : (
              <ul className="space-y-2">
                {unitBookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  >
                    <span>
                      {new Date(b.start_date).toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      –{" "}
                      {new Date(b.end_date).toLocaleDateString("en-KE", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      {!b.is_manual_block && (
                        <>
                          <FinalizeBookingButton
                            bookingId={b.id}
                            guestCount={b.guest_count ?? 2}
                          />
                          <GenerateInvoiceButton
                          bookingId={b.id}
                          unitName={selected?.name ?? "Unit"}
                          guestCount={b.guest_count ?? 2}
                          startDate={b.start_date}
                          endDate={b.end_date}
                        />
                        </>
                      )}
                      <Badge variant={b.is_manual_block ? "secondary" : "default"}>
                        {b.is_manual_block ? "Blocked" : "Booking"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </GlassSection>

          <GlassSection>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Circle Availability
            </h2>
            <ul className="space-y-2">
              {bookings.slice(0, 8).map((b) => (
                <li
                  key={`all-${b.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <span className="text-foreground">{b.properties?.name ?? "Unit"}</span>
                  <span className="text-muted-foreground">
                    {b.start_date} → {b.end_date}
                  </span>
                </li>
              ))}
              {bookings.length === 0 && (
                <p className="text-sm text-muted-foreground">No visible bookings in your Circle.</p>
              )}
            </ul>
          </GlassSection>
        </>
      )}
    </PageShell>
  );
}

function LabelUnitSelect({
  units,
  selectedId,
  onChange,
}: {
  units: Property[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  return (
    <Select value={selectedId} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className="w-full max-w-xs">
        <SelectValue placeholder="Select unit" />
      </SelectTrigger>
      <SelectContent>
        {units.map((u) => (
          <SelectItem key={u.id} value={u.id}>
            {u.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
