"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WireListRow, WireSectionHeader } from "@/components/ui/wire";
import { circleInviteWhatsAppUrl } from "@/lib/ical/validators";

export type CircleMemberDisplay = {
  id: string;
  name: string;
  status: string;
  unitsAvailable: number;
};

interface CirclesHeroTileProps {
  members: CircleMemberDisplay[];
  shortCode?: string | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CirclesHeroTile({ members, shortCode }: CirclesHeroTileProps) {
  const activeMembers = members.slice(0, 3);
  const freeUnits = members.reduce((s, m) => s + m.unitsAvailable, 0);
  const waShare = shortCode
    ? circleInviteWhatsAppUrl(shortCode, "EliteHost Host")
    : null;

  return (
    <div className="flex flex-col gap-4">
      <WireSectionHeader
        eyebrow="Circles"
        title={`${freeUnits || 0} peer units free`}
        description={
          members.length
            ? `${members.length} peer${members.length === 1 ? "" : "s"} in your network`
            : "Grow your network to handle overflow bookings"
        }
      />

      <div className="space-y-2">
        {activeMembers.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No active Circle members yet.</p>
            {waShare && (
              <a
                href={waShare}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-foreground underline underline-offset-4"
              >
                Share invite code on WhatsApp
              </a>
            )}
          </div>
        ) : (
          activeMembers.map((member) => (
            <WireListRow
              key={member.id}
              trailing={
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {member.unitsAvailable} unit{member.unitsAvailable === 1 ? "" : "s"}
                </span>
              }
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-muted text-xs">
                    {initials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.status}</p>
                </div>
              </div>
            </WireListRow>
          ))
        )}
      </div>

      <Link
        href="/circles"
        className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground"
      >
        <Users className="h-4 w-4" />
        Search peers
      </Link>
    </div>
  );
}
