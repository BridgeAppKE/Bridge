import { isAuthBypassEnabled } from "@/lib/auth/bypass";

export function isDevSeedEnabled(): boolean {
  return (
    isAuthBypassEnabled() &&
    process.env.DEV_SEED_ENABLED === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

export function isDevSimulateEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return (
      isAuthBypassEnabled() &&
      process.env.DEV_SEED_ENABLED === "true"
    );
  }
  return isDevSeedEnabled();
}
