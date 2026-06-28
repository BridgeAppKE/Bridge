import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getHostProfile } from "@/lib/actions/onboarding";
import { getUserProperties } from "@/lib/actions/properties";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user && !isAuthBypassEnabled()) {
    redirect("/login");
  }

  const profile = await getHostProfile();
  if (profile?.onboarding_completed) {
    redirect("/home");
  }

  const properties = await getUserProperties();
  const hostName =
    profile?.legal_name ??
    profile?.full_name ??
    user?.user_metadata?.full_name?.split(" ")[0] ??
    "Host";

  return (
    <main className="min-h-screen bg-background">
      <OnboardingWizard
        shortCode={profile?.short_code ?? null}
        hostName={hostName}
        initialPropertyId={properties[0]?.id ?? null}
      />
    </main>
  );
}
