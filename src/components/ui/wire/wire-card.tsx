"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { tapScaleClass, wirePanelClass } from "@/lib/design/tokens";

export interface WireCardProps extends HTMLMotionProps<"div"> {
  gridArea?: string;
  hoverScale?: boolean;
  padding?: "none" | "sm" | "md";
  children: React.ReactNode;
}

const paddingClass = {
  none: "",
  sm: "p-3",
  md: "p-4 md:p-5",
};

export function WireCard({
  gridArea,
  hoverScale = false,
  padding = "md",
  className,
  children,
  ...props
}: WireCardProps) {
  return (
    <motion.div
      whileHover={hoverScale ? { scale: 1.01 } : undefined}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        wirePanelClass,
        tapScaleClass,
        "flex flex-col overflow-hidden",
        paddingClass[padding],
        gridArea,
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
