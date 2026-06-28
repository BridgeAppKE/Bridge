"use client";

import { useState, useTransition } from "react";
import {
  updateHostProfile,
  createUnitOnboarding,
  lookupHostByCode,
  inviteHostByCode,
  completeOnboarding,
} from "@/lib/actions/onboarding";
import { deferIcalSetup } from "@/lib/actions/ical-feeds";
import { AirbnbIcalSyncSequence } from "@/components/ical/airbnb-ical-sync-sequence";
import { circleInviteWhatsAppUrl } from "@/lib/ical/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { wirePanelClass } from "@/lib/design/tokens";

type Props = {
  shortCode: string | null;
  hostName: string;
  initialPropertyId: string | null;
};

export function OnboardingWizard({ shortCode, hostName, initialPropertyId }: Props) {
  const [step, setStep] = useState(1);
  const [propertyId, setPropertyId] = useState(initialPropertyId);
  const [error, setError] = useState<string | null>(null);
  const [invitePreview, setInvitePreview] = useState<{
    name: string;
    units: number;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const code = shortCode ?? "HOST-????";
  const waShare = circleInviteWhatsAppUrl(code, hostName);

  function next() {
    setError(null);
    setStep((s) => s + 1);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <header className="space-y-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          EliteHost Setup · Step {step} of 5
        </p>
        <h1 className="text-2xl font-semibold text-foreground">Welcome, {hostName}</h1>
      </header>

      <div className={`${wirePanelClass} p-5`}>
        {step === 1 && (
          <form
            className="space-y-4"
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                const result = await updateHostProfile(fd);
                if ("error" in result && result.error) setError(result.error);
                else next();
              });
            }}
          >
            <h2 className="text-lg font-semibold">Host profile</h2>
            <div className="space-y-2">
              <Label htmlFor="legal_name">Legal / business name</Label>
              <Input id="legal_name" name="legal_name" required placeholder="Mvuli Stays Ltd" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input id="phone" name="phone" type="tel" required placeholder="+254 7XX XXX XXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kra_pin">KRA PIN (optional)</Label>
              <Input id="kra_pin" name="kra_pin" placeholder="A000000000X" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isPending} className="w-full">
              Continue
            </Button>
          </form>
        )}

        {step === 2 && (
          <form
            className="space-y-4"
            action={(fd) => {
              setError(null);
              startTransition(async () => {
                const result = await createUnitOnboarding(fd);
                if ("error" in result && result.error) setError(result.error);
                else if ("propertyId" in result) {
                  setPropertyId(result.propertyId ?? null);
                  next();
                }
              });
            }}
          >
            <h2 className="text-lg font-semibold">Your first unit</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Unit name</Label>
              <Input id="name" name="name" required placeholder="Mvuli Suite 4B" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Building / location</Label>
              <Input id="location" name="location" required placeholder="Denis Garden, Kilimani" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_rate_kes">Base nightly rate (KES)</Label>
              <Input id="base_rate_kes" name="base_rate_kes" type="number" min="1" required placeholder="8500" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isPending} className="w-full">
              Continue
            </Button>
          </form>
        )}

        {step === 3 && propertyId && (
          <AirbnbIcalSyncSequence
            propertyId={propertyId}
            showSkip
            onSkip={() => {
              startTransition(async () => {
                await deferIcalSetup();
                next();
              });
            }}
            onConnected={next}
          />
        )}

        {step === 3 && !propertyId && (
          <p className="text-sm text-destructive">Create a unit first.</p>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Circle</h2>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <p className="text-xs text-muted-foreground">Your invite code</p>
              <p className="text-2xl font-bold tracking-widest text-foreground">{code}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite_code">Were you invited by another host?</Label>
              <div className="flex gap-2">
                <Input
                  id="invite_code"
                  placeholder="HOST-7941"
                  onChange={(e) => {
                    setInvitePreview(null);
                    setMessage(null);
                    const val = e.target.value;
                    if (val.length >= 8) {
                      startTransition(async () => {
                        const r = await lookupHostByCode(val);
                        if ("success" in r && r.success) {
                          setInvitePreview({
                            name: r.displayName!,
                            units: r.unitCount ?? 0,
                          });
                        }
                      });
                    }
                  }}
                />
                <Button
                  type="button"
                  disabled={isPending || !invitePreview}
                  onClick={() => {
                    const input = document.getElementById("invite_code") as HTMLInputElement;
                    startTransition(async () => {
                      const r = await inviteHostByCode(input.value);
                      if ("error" in r && r.error) setError(r.error);
                      else if ("message" in r) {
                        setMessage(r.message ?? "Invite sent!");
                        setError(null);
                      }
                    });
                  }}
                >
                  Send Invite
                </Button>
              </div>
              {invitePreview && (
                <p className="text-sm text-muted-foreground">
                  {invitePreview.name} · {invitePreview.units} unit(s)
                </p>
              )}
            </div>
            <a
              href={waShare}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Share my invite code on WhatsApp
            </a>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="button" className="w-full" onClick={next}>
              Continue
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={next}>
              I&apos;ll add hosts later
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">You&apos;re all set</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Expense tracking:</strong> Log costs and
                attach receipts to maximize tax-deductible claims.
              </p>
              <p>
                <strong className="text-foreground">Compliance:</strong> eTIMS matching is
                opt-in only — your data stays private until you enable it.
              </p>
              <p>
                <strong className="text-foreground">Calendar sync:</strong> Airbnb imports can
                take a moment on mobile; export to Airbnb polls every 1–3 hours.
              </p>
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  const r = await completeOnboarding();
                  if ("error" in r && r.error) setError(r.error);
                  else window.location.href = "/home";
                });
              }}
            >
              Go to dashboard
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
