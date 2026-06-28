/** Layout and typography tokens aligned with shadcn/ui neutral theme */

export const tapScaleClass =
  "transition-transform duration-200 ease-out active:scale-[0.98]";

export const bentoGridClass =
  "grid grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-[minmax(140px,auto)]";

export const pageShellClass = "space-y-6";

export const pageHeaderClass = "space-y-1";

export const pageTitleClass = "text-2xl font-semibold tracking-tight text-foreground";

export const pageSubtitleClass = "text-sm text-muted-foreground";

export const sectionLabelClass =
  "text-xs font-medium uppercase tracking-wider text-muted-foreground";

/** @deprecated use sectionLabelClass */
export const wireSectionLabelClass = sectionLabelClass;

export const surfaceCardClass =
  "rounded-xl border border-border bg-card text-card-foreground shadow-sm";

export const surfacePanelClass = `${surfaceCardClass} p-5`;

export const wireStatClass = surfacePanelClass;

/** @deprecated use surfaceCardClass */
export const wirePanelClass = surfaceCardClass;

export const listRowClass =
  "flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3";

/** @deprecated use surfacePanelClass */
export const wireCardClass = surfacePanelClass;

/** @deprecated use surfaceCardClass */
export const glassCardClass = surfacePanelClass;

/** @deprecated use listRowClass */
export const wireListRowClass = listRowClass;

/** @deprecated use surfaceCardClass */
export const glassTileClass = surfaceCardClass;

/** @deprecated use surfacePanelClass */
export const fitnessMetricCardClass = surfacePanelClass;

/** @deprecated use surfacePanelClass */
export const fitnessPanelClass = surfacePanelClass;

export const appShellClass =
  "mx-auto flex min-h-screen max-w-lg flex-col bg-background";

/** @deprecated use appShellClass */
export const wireAppShellClass = appShellClass;
