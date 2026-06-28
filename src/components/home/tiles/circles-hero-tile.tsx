"use client";

import { useState } from "react";
import { Radio } from "lucide-react";
import { GlassTile } from "@/components/ui/glass-tile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BroadcastInquiryDialog } from "@/components/home/broadcast-inquiry-dialog";
import { WireListRow, WireSectionHeader } from "@/components/ui/wire";
import { Button } from "@/components/ui/button";

export type CircleMemberDisplay = {
  id: string;
  name: string;
  status: string;
  unitsAvailable: number;
};

interface CirclesHeroTileProps {
  members: CircleMemberDisplay[];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CirclesHeroTile({ members }: CirclesHeroTileProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const activeMembers = members.slice(0, 3);

  return (
    <>
      <GlassTile gridArea="md:col-span-2 md:row-span-2" className="min-h-[280px]">
        <WireSectionHeader
          eyebrow="Circles"
          title="Network Status"
          description={
            members.length
              ? `${members.length} trusted peer${members.length === 1 ? "" : "s"} connected`
              : "Invite hosts to unlock referrals"
          }
        />

        <div className="mt-2 flex-1 space-y-2">
          {activeMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active Circle members yet.
            </p>
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

        <Button
          type="button"
          className="mt-4 w-full gap-2"
          onClick={() => setDialogOpen(true)}
        >
          <Radio className="h-4 w-4" />
          Broadcast Inquiry
        </Button>
      </GlassTile>

      <BroadcastInquiryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
