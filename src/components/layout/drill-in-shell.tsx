"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { pageShellClass, pageTitleClass, pageSubtitleClass, sectionLabelClass } from "@/lib/design/tokens";

interface DrillInShellProps {
  propertyId: string;
  propertyName: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function DrillInShell({
  propertyId,
  propertyName,
  title,
  subtitle,
  children,
  className,
}: DrillInShellProps) {
  return (
    <div className={cn(pageShellClass, className)}>
      <Link
        href={`/unit/${propertyId}`}
        className="tap-scale mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {propertyName}
      </Link>
      <header className="mb-6 space-y-1">
        <p className={sectionLabelClass}>Unit</p>
        <h1 className={pageTitleClass}>{title}</h1>
        {subtitle && <p className={pageSubtitleClass}>{subtitle}</p>}
      </header>
      {children}
    </div>
  );
}
