"use client";

import { useState, useTransition } from "react";
import {
  inviteToCircle,
  inviteToCircleByCode,
  lookupHostByCode,
} from "@/lib/actions/circles";
import { SectionHeader } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CircleGroup } from "@/lib/actions/circles";

interface InviteToCircleFormProps {
  circles?: CircleGroup[];
}

export function InviteToCircleForm({ circles = [] }: InviteToCircleFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const defaultCircleId = circles[0]?.id;

  function handleCodeLookup(code: string) {
    if (code.length < 4) {
      setPreview(null);
      return;
    }
    startTransition(async () => {
      const result = await lookupHostByCode(code);
      if ("error" in result && result.error) {
        setPreview(null);
        return;
      }
      if ("success" in result && result.success) {
        setPreview(
          `${result.displayName} · ${result.unitCount} unit${result.unitCount === 1 ? "" : "s"}`
        );
      }
    });
  }

  function handleCodeInvite(formData: FormData) {
    setMessage(null);
    setError(null);
    const code = (formData.get("host_code") as string)?.trim();
    const circleId = (formData.get("circle_id") as string) || defaultCircleId;

    startTransition(async () => {
      const result = await inviteToCircleByCode(code, circleId);
      if ("error" in result && result.error) setError(result.error);
      else if ("success" in result && result.success) {
        setMessage(result.message ?? "Invite sent!");
        setPreview(null);
      }
    });
  }

  function handleEmailSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await inviteToCircle(formData);
      if ("error" in result && result.error) setError(result.error);
      else if ("success" in result && result.success) {
        setMessage(result.message ?? "Invite sent!");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <SectionHeader
          title="Add Host by Code"
          description="Enter a host code (e.g. HOST-7941) to invite them to your Circle."
        />
        <form action={handleCodeInvite} className="flex flex-col gap-3">
          {circles.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="code-circle">Circle</Label>
              <select
                id="code-circle"
                name="circle_id"
                defaultValue={defaultCircleId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {circles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.member_count} members)
                  </option>
                ))}
              </select>
            </div>
          )}
          {circles.length === 1 && (
            <input type="hidden" name="circle_id" value={defaultCircleId} />
          )}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="host-code" className="sr-only">
                Host code
              </Label>
              <Input
                id="host-code"
                name="host_code"
                placeholder="HOST-7941"
                required
                disabled={isPending}
                onChange={(e) => handleCodeLookup(e.target.value)}
              />
              {preview && (
                <p className="text-xs text-muted-foreground">Found: {preview}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className=""
            >
              {isPending ? "Sending…" : "Send Invite"}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <SectionHeader
          title="Invite by Email"
          description="Add a trusted host by email. They must already have an EliteHost account."
        />
        <form action={handleEmailSubmit} className="flex flex-col gap-3 sm:flex-row">
          {circles.length > 1 && (
            <select
              name="circle_id"
              defaultValue={defaultCircleId}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-40"
            >
              {circles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {circles.length === 1 && (
            <input type="hidden" name="circle_id" value={defaultCircleId} />
          )}
          <div className="flex-1 space-y-2">
            <Label htmlFor="circle-email" className="sr-only">
              Email
            </Label>
            <Input
              id="circle-email"
              name="email"
              type="email"
              placeholder="peer@example.com"
              required
              disabled={isPending}
            />
          </div>
          <Button type="submit" variant="outline" disabled={isPending}>
            {isPending ? "Sending…" : "Email Invite"}
          </Button>
        </form>
      </div>

      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
