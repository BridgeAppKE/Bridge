"use client";

import { WireCard, type WireCardProps } from "@/components/ui/wire/wire-card";

export type GlassTileProps = WireCardProps;

/** Dashboard tile — wireframe module card */
export function GlassTile(props: GlassTileProps) {
  return <WireCard {...props} />;
}
