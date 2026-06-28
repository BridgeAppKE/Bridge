import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { isDevSeedEnabled } from "@/lib/demo/env";
import { DevSeedControls } from "@/components/layout/dev-seed-controls";

export function DevAuthBanner() {
  if (!isAuthBypassEnabled()) {
    return null;
  }

  return (
    <div className="relative z-50 mx-4 mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-800 dark:text-amber-200">
      Dev mode: auth bypassed. Set{" "}
      <code className="rounded bg-black/10 px-1 dark:bg-white/10">BYPASS_AUTH=false</code>{" "}
      before launch.
      {isDevSeedEnabled() && <DevSeedControls />}
    </div>
  );
}
