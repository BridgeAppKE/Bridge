"use client";

import { useState } from "react";
import { Radio } from "lucide-react";
import { GlassTile } from "@/components/ui/glass-tile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BroadcastInquiryDialog } from "@/components/home/broadcast-inquiry-dialog";
import { WireListRow, WireSectionHeader } from "@/components/ui/wire";
import { Button } from "@/components/ui/button";
import { circleInviteWhatsAppUrl } from "@/lib/ical/validators";

export type CircleMemberDisplay = {
  id: string;
  name: string;
  status: string;
  unitsAvailable: number;
};

interface CirclesHeroTileProps {
  members: CircleMemberDisplay[];
  compact?: boolean;
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

export function CirclesHeroTile({
  members,
  compact = false,
  shortCode,
}: CirclesHeroTileProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const activeMembers = members.slice(0, compact ? 1 : 3);
  const freeUnits = members.reduce((s, m) => s + m.unitsAvailable, 0);
  const waShare = shortCode
    ? circleInviteWhatsAppUrl(shortCode, "EliteHost Host")
    : null;

  const inner = (
    <>
      <WireSectionHeader
        eyebrow="Circles"
        title={compact ? `${freeUnits || 0} Units Free` : "Network Status"}
        titleClassName={compact ? "text-2xl font-semibold tracking-tight tabular-nums" : undefined}
        description={
          members.length
            ? `${members.length} peer${members.length === 1 ? "" : "s"} connected`
            : "Share your code to grow your Circle"
        }
        className="mb-0"
      />

      {!compact && (
        <div className="mt-2 flex-1 space-y-2">
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
      )}

      <Button
        type="button"
        size={compact ? "sm" : "default"}
        className={compact ? "mt-3 w-full gap-1 text-xs" : "mt-4 w-full gap-2"}
        onClick={() => setDialogOpen(true)}
      >
        <Radio className="h-3.5 w-3.5" />
        Broadcast
      </Button>

      <BroadcastInquiryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );

  if (compact) {
    return <div className="flex h-full flex-col justify-between">{inner}</div>;
  }

  return (
    <GlassTile gridArea="md:col-span-2 md:row-span-2" className="min-h-[280px]">
      {inner}
    </GlassTile>
  );
}
