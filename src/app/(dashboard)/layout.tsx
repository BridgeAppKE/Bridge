import { redirect } from "next/navigation";
import { DevAuthBanner } from "@/components/layout/dev-auth-banner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageMotion } from "@/components/layout/page-motion";
import { Toaster } from "@/components/ui/sonner";
import { signOut } from "@/lib/actions/auth";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { isOnboardingComplete } from "@/lib/actions/onboarding";
import { getUserProperties } from "@/lib/actions/properties";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const onboardingDone = await isOnboardingComplete();
  if (!onboardingDone) {
    redirect("/onboarding");
  }

  const properties = await getUserProperties();

  return (
    <>
      <DashboardShell
        properties={properties}
        showSignOut={!isAuthBypassEnabled()}
        signOutAction={signOut}
        devBanner={<DevAuthBanner />}
      >
        <PageMotion>{children}</PageMotion>
      </DashboardShell>
      <Toaster richColors position="top-center" />
    </>
  );
}
