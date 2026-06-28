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

interface LastSyncedProps {
  syncedAt: string | null | undefined;
  className?: string;
}

export function LastSynced({ syncedAt, className }: LastSyncedProps) {
  return (
    <p className={className ?? "text-xs text-muted-foreground"}>
      Last synced:{" "}
      <span className="font-medium text-foreground">{formatRelativeTime(syncedAt)}</span>
    </p>
  );
}
