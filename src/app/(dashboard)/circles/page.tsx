import {
  getMyCircles,
  searchPeerAvailability,
  getCircleInviteUrl,
  getCircleInvitations,
} from "@/lib/actions/circles";
import { getHostProfile } from "@/lib/actions/onboarding";
import { getUserProperties } from "@/lib/actions/properties";
import { CirclesReferralClient } from "@/components/circles/circles-referral-client";

export default async function CirclesPage() {
  const [circles, profile, inviteUrl, invitations, units] = await Promise.all([
    getMyCircles(),
    getHostProfile(),
    getCircleInviteUrl(),
    getCircleInvitations(),
    getUserProperties(),
  ]);

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const checkIn = today.toISOString().slice(0, 10);
  const checkOut = nextWeek.toISOString().slice(0, 10);

  const initialResults = await searchPeerAvailability(checkIn, checkOut);

  return (
    <CirclesReferralClient
      initialResults={initialResults}
      circles={circles}
      hostShortCode={profile?.short_code ?? null}
      inviteUrl={inviteUrl}
      invitations={invitations}
      units={units}
    />
  );
}
