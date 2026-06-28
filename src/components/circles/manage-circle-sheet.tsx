"use client";

import { useState, useTransition } from "react";
import { Users } from "lucide-react";
import { inviteToCircleByCode } from "@/lib/actions/circles";
import type { CircleGroup } from "@/lib/actions/circles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface ManageCircleSheetProps {
  circles: CircleGroup[];
  hostShortCode: string | null;
  inviteUrl: string | null;
}

export function ManageCircleSheet({
  circles,
  hostShortCode,
  inviteUrl,
}: ManageCircleSheetProps) {
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleInvite() {
    if (!code.trim()) return;
    startTransition(async () => {
      const result = await inviteToCircleByCode(code.trim(), circles[0]?.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.message ?? "Invite sent");
        setCode("");
      }
    });
  }

  function copyInviteLink() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied");
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <Users className="h-4 w-4" />
            Manage
          </Button>
        }
      />
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto px-0 pb-8">
        <div className="mx-auto w-full max-w-lg px-6">
          <SheetHeader className="text-left">
            <SheetTitle>Manage network</SheetTitle>
            <SheetDescription>
              Invite hosts by code or share your join link
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {hostShortCode && (
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">Your host code</p>
                <p className="font-mono text-lg font-semibold">{hostShortCode}</p>
              </div>
            )}
            {inviteUrl && (
              <div className="space-y-2">
                <Label>Share invite link</Label>
                <Input readOnly value={inviteUrl} className="text-xs" />
                <Button type="button" variant="secondary" className="w-full" onClick={copyInviteLink}>
                  Copy link
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="peer-code">Add host by code</Label>
              <Input
                id="peer-code"
                placeholder="ABC4829"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <Button type="button" className="w-full" onClick={handleInvite} disabled={isPending}>
                Send invite
              </Button>
            </div>
            {circles.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Your circles</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {circles.map((c) => (
                    <li key={c.id}>
                      {c.name} · {c.member_count} member{c.member_count === 1 ? "" : "s"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
