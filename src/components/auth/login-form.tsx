"use client";

import { useState } from "react";
import { signInWithMagicLink } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WireCard } from "@/components/ui/wire";
import { wireSectionLabelClass } from "@/lib/design/tokens";

export function LoginForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setError(null);

    const result = await signInWithMagicLink(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.success) {
      setMessage(result.message ?? "Check your email!");
    }

    setLoading(false);
  }

  return (
    <WireCard className="w-full max-w-md">
      <div className="mb-6 text-center">
        <p className={wireSectionLabelClass}>Welcome</p>
        <h1 className="text-2xl font-semibold text-foreground">
          Elite<span className="text-primary">Host</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with a magic link to manage your units.
        </p>
      </div>
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="host@example.com"
            required
            autoComplete="email"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending link…" : "Send Magic Link"}
        </Button>
      </form>
      {message && (
        <p className="mt-4 text-center text-sm text-primary">{message}</p>
      )}
      {error && (
        <p className="mt-4 text-center text-sm text-destructive">{error}</p>
      )}
    </WireCard>
  );
}
