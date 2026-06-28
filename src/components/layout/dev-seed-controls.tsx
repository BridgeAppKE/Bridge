"use client";

import { useState, useTransition } from "react";

export function DevSeedControls() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runSeed() {
    startTransition(async () => {
      setMessage(null);
      const res = await fetch("/api/dev/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setMessage(data.error ?? "Seed failed");
      else setMessage(`Demo loaded (${data.hostPropertyCount} units, ${data.peerCount} peers)`);
    });
  }

  function runWipe() {
    startTransition(async () => {
      setMessage(null);
      const res = await fetch("/api/dev/seed", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) setMessage(data.error ?? "Wipe failed");
      else setMessage(`Demo cleared (${data.removed ?? 0} rows)`);
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={runSeed}
        disabled={isPending}
        className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        Load demo data
      </button>
      <button
        type="button"
        onClick={runWipe}
        disabled={isPending}
        className="rounded-lg border border-amber-700/40 px-3 py-1 text-xs font-medium disabled:opacity-50"
      >
        Clear demo data
      </button>
      {message && <span className="w-full text-[11px] opacity-90">{message}</span>}
    </div>
  );
}
