import { getCurrentUser } from "@/lib/actions/auth";
import {
  getAvailabilityList,
  getCircleMembers,
} from "@/lib/actions/circles";
import { InviteToCircleForm } from "@/components/circles/invite-form";
import { CircleMembers } from "@/components/circles/circle-members";
import { AvailabilityList } from "@/components/circles/availability-list";
import { PageShell, GlassSection } from "@/components/layout/page-shell";

export default async function CirclesPage() {
  const user = await getCurrentUser();
  const [members, availability] = await Promise.all([
    getCircleMembers(),
    getAvailabilityList(),
  ]);

  return (
    <PageShell
      title="Circles"
      subtitle="Your trusted host network in Kenya"
    >
      <GlassSection>
        <InviteToCircleForm />
      </GlassSection>
      <GlassSection>
        <CircleMembers members={members} currentUserId={user?.id ?? ""} />
      </GlassSection>
      <GlassSection>
        <AvailabilityList properties={availability} />
      </GlassSection>
    </PageShell>
  );
}
