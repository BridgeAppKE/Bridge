"use client";

import { BadgeCheck } from "lucide-react";
import { GlassTile } from "@/components/ui/glass-tile";
import { WirePlaceholder, WireSectionHeader } from "@/components/ui/wire";

export type CleanerJob = {
  id: string;
  propertyName: string;
  completedAt: string;
  verified: boolean;
  thumbnailUrl?: string;
};

interface CleanerActivityTileProps {
  job: CleanerJob | null;
}

export function CleanerActivityTile({ job }: CleanerActivityTileProps) {
  return (
    <GlassTile gridArea="md:col-span-1 md:row-span-2" className="min-h-[280px]">
      <WireSectionHeader eyebrow="Operations" title="Cleaner Activity" />

      {!job ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <WirePlaceholder aspectRatio="aspect-square" className="h-16 w-16" label="—" />
          <p className="text-sm text-muted-foreground">No completed jobs yet.</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div className="relative overflow-hidden rounded-lg border border-border">
            {job.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={job.thumbnailUrl}
                alt={`${job.propertyName} turnover`}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <WirePlaceholder aspectRatio="aspect-[4/3]" label="Photo" />
            )}
            {job.verified && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-sm">
                <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                Verified
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{job.propertyName}</p>
            <p className="text-xs text-muted-foreground">{job.completedAt}</p>
          </div>
        </div>
      )}
    </GlassTile>
  );
}
