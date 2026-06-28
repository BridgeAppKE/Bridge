"use client";

import { BadgeCheck, Sparkles } from "lucide-react";
import { GlassTile } from "@/components/ui/glass-tile";

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
    <GlassTile
      gridArea="md:col-span-1 md:row-span-2"
      className="min-h-[280px] bg-emerald-900/50"
    >
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-200/80">
          Operations
        </p>
        <h2 className="text-lg font-semibold tracking-wide text-emerald-50">
          Cleaner Activity
        </h2>
      </div>

      {!job ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Sparkles className="h-8 w-8 text-emerald-400/40" />
          <p className="text-sm text-emerald-200/70">No completed jobs yet.</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-emerald-800/40">
            {job.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={job.thumbnailUrl}
                alt={`${job.propertyName} turnover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-800/60 to-emerald-950/80">
                <Sparkles className="h-10 w-10 text-emerald-400/30" />
              </div>
            )}
            {job.verified && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-emerald-400/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-950">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-emerald-50">{job.propertyName}</p>
            <p className="text-xs text-emerald-200/70">{job.completedAt}</p>
          </div>
        </div>
      )}
    </GlassTile>
  );
}
