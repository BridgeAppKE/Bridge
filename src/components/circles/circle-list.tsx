"use client";

import { useState, useTransition } from "react";
import { createCircle } from "@/lib/actions/circles";
import type { CircleGroup } from "@/lib/actions/circles";
import { SectionHeader } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleSyncButton } from "@/components/sync/circle-sync-button";
import { cn } from "@/lib/utils";

interface CircleListProps {
  circles: CircleGroup[];
  selectedId?: string;
}

export function CircleList({ circles, selectedId }: CircleListProps) {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState(selectedId ?? circles[0]?.id);

  function handleCreate() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createCircle(name);
      if ("success" in result && result.success) {
        setName("");
        if (result.circleId) setActiveId(result.circleId);
      }
    });
  }

  return (
    <div>
      <SectionHeader
        title="Your Circles"
        description="Each circle is isolated — peers in one circle cannot see another."
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="New circle name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
        />
        <Button type="button" onClick={handleCreate} disabled={isPending || !name.trim()}>
          Create Circle
        </Button>
      </div>
      <div className="space-y-2">
        {circles.map((circle) => (
          <div
            key={circle.id}
            className={cn(
              "flex items-center justify-between rounded-xl border border-border px-4 py-3",
              activeId === circle.id && "border-primary/30 bg-muted/50"
            )}
          >
            <button
              type="button"
              className="text-left"
              onClick={() => setActiveId(circle.id)}
            >
              <p className="font-medium text-foreground">{circle.name}</p>
              <p className="text-xs text-muted-foreground">
                {circle.member_count} member{circle.member_count === 1 ? "" : "s"}
              </p>
            </button>
            {activeId === circle.id && (
              <CircleSyncButton circleId={circle.id} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
