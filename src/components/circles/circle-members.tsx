"use client";

import { useTransition } from "react";
import { acceptCircleInvite } from "@/lib/actions/circles";
import type { CircleMember } from "@/lib/types/database";
import { SectionHeader, listRowClass } from "@/components/layout/page-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CircleMembersProps {
  members: CircleMember[];
  currentUserId: string;
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

export function CircleMembers({ members, currentUserId }: CircleMembersProps) {
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
        description="Trusted hosts in your network"
      />
      <div className="space-y-3">
        {members.map((member) => {
          const isIncoming =
            member.trusted_peer_id === currentUserId &&
            member.status === "pending";

          return (
            <div
              key={member.id}
              className={cn(listRowClass, "flex items-center justify-between")}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                    {initials(member.peer.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {member.peer.full_name ?? "Unknown Host"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.host_id === currentUserId ? "Invited by you" : "Invited you"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={member.status === "accepted" ? "default" : "secondary"}
                  className={
                    member.status === "accepted"
                      ? "bg-emerald-600 hover:bg-emerald-600"
                      : ""
                  }
                >
                  {member.status}
                </Badge>
                {isIncoming && (
                  <Button
                    size="sm"
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950"
                    onClick={() =>
                      startTransition(async () => {
                        await acceptCircleInvite(member.id);
                      })
                    }
                  >
                    Accept
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
