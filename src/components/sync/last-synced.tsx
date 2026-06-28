"use client";

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never synced";

  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

function isStale(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const diffMin = (Date.now() - new Date(iso).getTime()) / 60000;
  return diffMin > 40;
}

interface LastSyncedProps {
  syncedAt: string | null | undefined;
  className?: string;
}

export function LastSynced({ syncedAt, className }: LastSyncedProps) {
  const stale = isStale(syncedAt);
  return (
    <p className={className ?? "text-xs text-muted-foreground"}>
      Last synced:{" "}
      <span className="font-medium text-foreground">{formatRelativeTime(syncedAt)}</span>
      {stale && <span className="ml-1.5 font-medium text-amber-600">· Stale</span>}
    </p>
  );
}
