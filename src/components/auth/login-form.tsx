"use client";

import { useState } from "react";
import { signInWithMagicLink } from "@/lib/actions/auth";
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
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">EliteHost</CardTitle>
        <CardDescription>
          Sign in with a magic link to manage your units.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          <p className="mt-4 text-center text-sm text-muted-foreground">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
