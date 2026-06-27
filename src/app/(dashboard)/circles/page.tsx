import { getCurrentUser } from "@/lib/actions/auth";
import {
  getAvailabilityList,
  getCircleMembers,
} from "@/lib/actions/circles";
import { InviteToCircleForm } from "@/components/circles/invite-form";
import { CircleMembers } from "@/components/circles/circle-members";
import { AvailabilityList } from "@/components/circles/availability-list";

export default async function CirclesPage() {
  const user = await getCurrentUser();
  const [members, availability] = await Promise.all([
    getCircleMembers(),
    getAvailabilityList(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Circles</h1>
        <p className="text-sm text-muted-foreground">
          Your trusted host network in Nairobi
        </p>
      </div>

      <InviteToCircleForm />
      <CircleMembers
        members={members}
        currentUserId={user?.id ?? ""}
      />
      <AvailabilityList properties={availability} />
    </div>
  );
}
