"use client";

import { useState, useTransition } from "react";
import { inviteToCircle } from "@/lib/actions/circles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function InviteToCircleForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await inviteToCircle(formData);
      if (result.error) setError(result.error);
      else if (result.success) setMessage(result.message ?? "Invite sent!");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Invite to Circle</CardTitle>
        <CardDescription>
          Add a trusted host by email. They must already have a BnB+ account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
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
            />
          </div>
          <Button type="submit" disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
            {isPending ? "Sending…" : "Send Invite"}
          </Button>
        </form>
        {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
