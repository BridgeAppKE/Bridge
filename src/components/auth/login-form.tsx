"use client";

import { useState } from "react";
import { signInWithMagicLink } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="glass-panel w-full max-w-md p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-wide text-foreground">
          Elite<span className="text-emerald-500 dark:text-emerald-400">Host</span>
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
            className="bg-glass border-glass-border"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-emerald-600 font-semibold tracking-wide hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
          disabled={loading}
        >
          {loading ? "Sending link…" : "Send Magic Link"}
        </Button>
      </form>
      {message && (
        <p className="mt-4 text-center text-sm text-emerald-600 dark:text-emerald-400">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
