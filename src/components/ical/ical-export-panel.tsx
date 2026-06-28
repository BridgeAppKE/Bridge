"use client";

import type { Property } from "@/lib/types/database";

interface IcalExportPanelProps {
  property: Property;
  exportUrl: string;
}

export function IcalExportPanel({ exportUrl }: IcalExportPanelProps) {
  async function copyUrl() {
    await navigator.clipboard.writeText(exportUrl);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Paste into Airbnb → Calendar → Import. Updates on Airbnb&apos;s next fetch (1–3 hrs).
      </p>
      <div className="rounded-lg border border-border bg-background/50 p-2 font-mono text-xs break-all">
        {exportUrl}
      </div>
      <button
        type="button"
        onClick={copyUrl}
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Copy link
      </button>
    </div>
  );
}
