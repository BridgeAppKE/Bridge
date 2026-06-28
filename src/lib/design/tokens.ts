/** Shared design tokens — Wireframe Kit 2.0 structured layout + EliteHost brand */

/** Primary surface module (card / panel) */
export const wirePanelClass =
  "rounded-xl border border-border bg-card text-card-foreground shadow-sm";

/** Legacy alias — tiles and sections use wire panels */
export const glassTileClass = wirePanelClass;

export const tapScaleClass =
  "transition-transform duration-200 ease-out active:scale-[0.98]";

export const bentoGridClass =
  "grid grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-[minmax(140px,auto)]";

export const pageShellClass = "space-y-5";

export const pageHeaderClass = "space-y-1";

export const pageTitleClass = "text-2xl font-semibold text-foreground";

export const pageSubtitleClass = "text-sm text-muted-foreground";

export const wireCardClass = `${wirePanelClass} p-4 md:p-5`;

export const glassCardClass = wireCardClass;

export const wireListRowClass =
  "flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3";

export const wireStatClass =
  "rounded-xl border border-border bg-card p-4";

export const wireSectionLabelClass =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export const wireAppShellClass = "mx-auto flex min-h-screen max-w-lg flex-col bg-muted/40";
