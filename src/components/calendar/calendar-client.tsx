"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Property } from "@/lib/types/database";
import { useUnitContext } from "@/components/layout/unit-context";
import { PageShell, GlassSection } from "@/components/layout/page-shell";
import { SyncButton } from "@/components/sync/sync-button";
import { LastSynced } from "@/components/sync/last-synced";
import { BlockDatesDialog } from "@/components/units/block-dates-dialog";
import { GenerateInvoiceButton } from "@/components/bookings/generate-invoice-button";
import { FinalizeBookingButton } from "@/components/bookings/finalize-booking-button";
import { PlatformIcalSync } from "@/components/ical/platform-ical-sync";
import { IcalExportPanel } from "@/components/ical/ical-export-panel";
import { Badge } from "@/components/ui/badge";
import { ClearBlockButton } from "@/components/bookings/clear-block-button";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

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
  const router = useRouter();
  const { isAllUnits, selectedProperty } = useUnitContext();
  const [blockOpen, setBlockOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [syncTimes, setSyncTimes] = useState<Record<string, string | null>>(
    Object.fromEntries(units.map((u) => [u.id, u.last_synced_at]))
  );

  const selected = useMemo(() => {
    if (isAllUnits) return units[0] ?? null;
    return selectedProperty ?? units[0] ?? null;
  }, [isAllUnits, selectedProperty, units]);

  const unitBookings = useMemo(() => {
    if (isAllUnits) return [];
    return bookings.filter((b) => b.property_id === selected?.id);
  }, [bookings, isAllUnits, selected?.id]);

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
      subtitle="Bookings, blocks, and channel sync"
      actions={
        units.length > 0 ? (
          <BlockDatesDialog
            units={units}
            open={blockOpen}
            onOpenChange={setBlockOpen}
            showTrigger
            onBlocked={() => router.refresh()}
          />
        ) : undefined
      }
    >
      {units.length === 0 ? (
        <GlassSection>
          <p className="text-sm text-muted-foreground">
            No units yet. Add a unit from the Unit tab to get started.
          </p>
        </GlassSection>
      ) : isAllUnits ? (
        <GlassSection>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            All units
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
                        {b.is_manual_block && <ClearBlockButton bookingId={b.id} />}
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
          <GlassSection>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{selected?.name}</p>
                <LastSynced syncedAt={syncTimes[selected?.id ?? ""]} />
              </div>
              {selected && (
                <SyncButton
                  propertyId={selected.id}
                  icalUrl={selected.ical_url}
                  label="Import"
                  onSynced={(at) =>
                    setSyncTimes((prev) => ({ ...prev, [selected.id]: at }))
                  }
                />
              )}
            </div>

            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Bookings & blocks
            </h2>
            {unitBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
            ) : (
              <ul className="space-y-2">
                {unitBookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
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
                    <div className="flex flex-wrap items-center gap-2">
                      {b.is_manual_block ? (
                        <ClearBlockButton bookingId={b.id} />
                      ) : (
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

          {selected && (
            <>
              <GlassSection className="p-0">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex h-auto w-full items-center justify-between rounded-xl px-4 py-3 text-left"
                  onClick={() => setImportOpen((v) => !v)}
                >
                  <span className="text-sm font-medium">Import calendar (Airbnb / Booking.com)</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${importOpen ? "rotate-180" : ""}`}
                  />
                </Button>
                {importOpen && (
                  <div className="border-t border-border px-4 pb-4 pt-2">
                    <PlatformIcalSync
                      compact
                      propertyId={selected.id}
                      onConnected={() => router.refresh()}
                    />
                  </div>
                )}
              </GlassSection>

              {(selected as Property & { ical_export_token?: string }).ical_export_token && (
                <GlassSection className="p-0">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex h-auto w-full items-center justify-between rounded-xl px-4 py-3 text-left"
                    onClick={() => setExportOpen((v) => !v)}
                  >
                    <span className="text-sm font-medium">Export to Airbnb</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${exportOpen ? "rotate-180" : ""}`}
                    />
                  </Button>
                  {exportOpen && (
                    <div className="border-t border-border px-4 pb-4 pt-2">
                      <IcalExportPanel
                        property={selected}
                        exportUrl={`${siteOrigin}/api/units/${(selected as Property & { ical_export_token?: string }).ical_export_token}/ical`}
                      />
                    </div>
                  )}
                </GlassSection>
              )}
            </>
          )}
        </>
      )}
    </PageShell>
  );
}
