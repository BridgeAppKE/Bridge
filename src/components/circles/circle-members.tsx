"use client";

import { useTransition } from "react";
import { acceptCircleInvite } from "@/lib/actions/circles";
import type { CircleMember } from "@/lib/types/database";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Circle</CardTitle>
          <CardDescription>
            No connections yet. Invite a fellow host to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Circle</CardTitle>
        <CardDescription>Trusted hosts in your network</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => {
          const isIncoming =
            member.trusted_peer_id === currentUserId &&
            member.status === "pending";

          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700">
                    {initials(member.peer.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
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
                    className="bg-emerald-600 hover:bg-emerald-700"
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
      </CardContent>
    </Card>
  );
}
