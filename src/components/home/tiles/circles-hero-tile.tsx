"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Radio, Users } from "lucide-react";
import { GlassTile } from "@/components/ui/glass-tile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BroadcastInquiryDialog } from "@/components/home/broadcast-inquiry-dialog";
import { cn } from "@/lib/utils";

export type CircleMemberDisplay = {
  id: string;
  name: string;
  status: string;
  unitsAvailable: number;
};

interface CirclesHeroTileProps {
  members: CircleMemberDisplay[];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CirclesHeroTile({ members }: CirclesHeroTileProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const activeMembers = members.slice(0, 3);

  return (
    <>
      <GlassTile
        gridArea="md:col-span-2 md:row-span-2"
        className="relative min-h-[280px] justify-between bg-emerald-950/10 dark:bg-emerald-900/50"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-emerald-950/20 dark:to-emerald-950/40 pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-widest">
              Circles Network
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-wide text-foreground">
            Network Status
          </h2>
          <p className="text-sm text-muted-foreground">
            {members.length
              ? `${members.length} trusted peer${members.length === 1 ? "" : "s"} connected`
              : "Invite hosts to unlock referrals"}
          </p>
        </div>

        <div className="relative z-10 mt-4 space-y-3">
          {activeMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active Circle members yet.
            </p>
          ) : (
            activeMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/40 px-3 py-2 dark:border-white/5 dark:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-9 w-9 border border-emerald-400/30">
                      <AvatarFallback className="bg-emerald-800/80 text-xs text-emerald-50">
                        {initials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <motion.span
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400"
                      animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.status}</p>
                  </div>
                </div>
                <span className="text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-300">
                  {member.unitsAvailable} unit{member.unitsAvailable === 1 ? "" : "s"}
                </span>
              </div>
            ))
          )}
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => setDialogOpen(true)}
          className={cn(
            "relative z-10 mt-4 flex w-full items-center justify-center gap-2 rounded-2xl",
            "bg-emerald-400 px-4 py-3 text-sm font-semibold tracking-wide text-emerald-950",
            "shadow-[0_0_24px_rgba(52,211,153,0.35)] transition-shadow duration-300",
            "hover:shadow-[0_0_32px_rgba(52,211,153,0.5)]"
          )}
        >
          <Radio className="h-4 w-4" />
          Broadcast Inquiry
        </motion.button>
      </GlassTile>

      <BroadcastInquiryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
