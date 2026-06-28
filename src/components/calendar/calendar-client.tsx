"use client";

import { useEffect, useMemo, useState } from "react";
import type { Property } from "@/lib/types/database";
import { useUnitContext } from "@/components/layout/unit-context";
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
  etimsOptIn?: boolean;
}

export function CalendarClient({
  units,
  bookings,
  siteOrigin,
  etimsOptIn = false,
}: CalendarClientProps) {
  const { isAllUnits, selectedProperty, selectedUnitId } = useUnitContext();
  const [syncTimes, setSyncTimes] = useState<Record<string, string | null>>(
    Object.fromEntries(units.map((u) => [u.id, u.last_synced_at]))
  );

  const selected = useMemo(() => {
    if (isAllUnits) return units[0] ?? null;
    return selectedProperty ?? units[0] ?? null;
  }, [isAllUnits, selectedProperty, units]);

  useEffect(() => {
    if (!isAllUnits && selectedUnitId !== "all") {
      // header selector drives calendar scope
    }
  }, [isAllUnits, selectedUnitId]);

  const scopedBookings = useMemo(() => {
    if (isAllUnits) return bookings;
    return bookings.filter((b) => b.property_id === selectedUnitId);
  }, [bookings, isAllUnits, selectedUnitId]);

  const unitBookings = useMemo(() => {
    if (isAllUnits) return [];
    return scopedBookings.filter((b) => b.property_id === selected?.id);
  }, [scopedBookings, isAllUnits, selected?.id]);

  const agendaGroups = useMemo(() => {
    if (!isAllUnits) return [];
    const byProperty = new Map<string, BookingRow[]>();
    for (const b of bookings) {
      const list = byProperty.get(b.property_id) ?? [];
      list.push(b);
      byProperty.set(b.property_id, list);
    }
    return units.map((u) => ({
      unit: u,
      bookings: byProperty.get(u.id) ?? [],
    }));
  }, [bookings, units, isAllUnits]);

  return (
    <PageShell
      title="Calendar"
      subtitle={
        isAllUnits
          ? "All units agenda — narrow header to manage one unit"
          : `Schedule for ${selected?.name ?? "unit"}`
      }
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
      ) : isAllUnits ? (
        <GlassSection>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            All units agenda
          </h2>
          <div className="space-y-4">
            {agendaGroups.map(({ unit, bookings: unitRows }) => (
              <div key={unit.id}>
                <p className="mb-2 text-sm font-semibold text-foreground">{unit.name}</p>
                {unitRows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No bookings</p>
                ) : (
                  <ul className="space-y-1.5">
                    {unitRows.map((b) => (
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
                        <Badge variant={b.is_manual_block ? "secondary" : "default"}>
                          {b.is_manual_block ? "Blocked" : "Booking"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </GlassSection>
      ) : (
        <>
          <GlassSection className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{selected?.name}</p>
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
                            propertyId={selected?.id}
                            etimsOptIn={etimsOptIn}
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
        </>
      )}
    </PageShell>
  );
}
