"use client";

import { useTransition } from "react";
import {
  acceptCircleInvite,
  respondToCircleInvite,
  type CircleInvitationRow,
} from "@/lib/actions/circles";
import { SectionHeader, listRowClass } from "@/components/layout/page-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CircleMembersProps {
  members: CircleInvitationRow[];
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CircleMembers({ members }: CircleMembersProps) {
  const [isPending, startTransition] = useTransition();

  if (!members.length) {
    return (
      <SectionHeader
        title="Your Circle"
        description="No connections yet. Invite a fellow host to get started."
      />
    );
  }

  return (
    <div>
      <SectionHeader
        title="Your Circle"
        description="Trusted hosts in your network — each circle is private"
      />
      <div className="space-y-3">
        {members.map((member) => {
          const isIncoming =
            member.direction === "incoming" && member.status === "pending";

          return (
            <div
              key={member.id}
              className={cn(listRowClass, "flex items-center justify-between")}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-muted text-xs">
                    {initials(member.peer.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {member.peer.full_name ?? "Unknown Host"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.circle_name} ·{" "}
                    {member.direction === "outgoing" ? "Invited by you" : "Invited you"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={member.status === "accepted" ? "default" : "secondary"}
                >
                  {member.status}
                </Badge>
                {isIncoming && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await respondToCircleInvite(member.id, "rejected");
                        })
                      }
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await acceptCircleInvite(member.id);
                        })
                      }
                    >
                      Accept
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
