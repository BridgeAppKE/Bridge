import {
  getAvailabilityList,
  getCircleInvitations,
  getMyCircles,
} from "@/lib/actions/circles";
import { InviteToCircleForm } from "@/components/circles/invite-form";
import { CircleMembers } from "@/components/circles/circle-members";
import { AvailabilityList } from "@/components/circles/availability-list";
import { CircleList } from "@/components/circles/circle-list";
import { PageShell, GlassSection } from "@/components/layout/page-shell";

export default async function CirclesPage() {
  const [circles, invitations, availability] = await Promise.all([
    getMyCircles(),
    getCircleInvitations(),
    getAvailabilityList(),
  ]);

  const members = invitations.filter(
    (i) => i.status === "accepted" || i.status === "pending"
  );

  return (
    <PageShell title="Circles" subtitle="Your trusted host network in Kenya">
      <GlassSection>
        <CircleList circles={circles} />
      </GlassSection>
      <GlassSection>
        <InviteToCircleForm circles={circles} />
      </GlassSection>
      <GlassSection>
        <CircleMembers members={members} />
      </GlassSection>
      <GlassSection>
        <AvailabilityList properties={availability} />
      </GlassSection>
    </PageShell>
  );
}
