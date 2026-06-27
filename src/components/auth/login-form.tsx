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
    <Card className="w-full max-w-md border-0 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          BnB<span className="text-emerald-600">+</span>
        </CardTitle>
        <CardDescription>
          Property management for Nairobi hosts. Sign in with a magic link.
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
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading ? "Sending link…" : "Send Magic Link"}
          </Button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-emerald-600">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
