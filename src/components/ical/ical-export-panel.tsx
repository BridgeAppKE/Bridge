"use client";

import type { Property } from "@/lib/types/database";

interface IcalExportPanelProps {
  property: Property;
  exportUrl: string;
}

export function IcalExportPanel({ property, exportUrl }: IcalExportPanelProps) {
  async function copyUrl() {
    await navigator.clipboard.writeText(exportUrl);
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <h3 className="font-semibold text-foreground">Export to Airbnb (Import Calendar)</h3>
      <p className="text-sm text-muted-foreground">
        Paste this EliteHost link into Airbnb → Calendar sync → Import calendar. Blocks you set
        here appear on Airbnb after their next fetch.
      </p>
      <div className="rounded-lg border border-border bg-background/50 p-2 font-mono text-xs break-all">
        {exportUrl}
      </div>
      <button
        type="button"
        onClick={copyUrl}
        className="text-sm font-medium text-foreground underline underline-offset-4"
      >
        Copy link
      </button>
      <p className="text-xs text-amber-700 dark:text-amber-300">
        Airbnb checks this link every 1–3 hours. For urgent blocks, also close dates manually on
        Airbnb.
      </p>
      <p className="text-xs text-muted-foreground">Unit: {property.name}</p>
    </div>
  );
}
