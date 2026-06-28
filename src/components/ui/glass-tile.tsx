"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { glassTileClass, tapScaleClass } from "@/lib/design/tokens";

export interface GlassTileProps extends HTMLMotionProps<"div"> {
  /** Tailwind grid placement, e.g. "md:col-span-2 md:row-span-2" */
  gridArea?: string;
  hoverScale?: boolean;
  children: React.ReactNode;
}

export function GlassTile({
  gridArea,
  hoverScale = true,
  className,
  children,
  ...props
}: GlassTileProps) {
  return (
    <motion.div
      whileHover={hoverScale ? { scale: 1.02 } : undefined}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        glassTileClass,
        tapScaleClass,
        "flex flex-col overflow-hidden p-5",
        gridArea,
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
