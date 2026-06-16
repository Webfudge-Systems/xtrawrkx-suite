"use client";

import { cn } from "@/lib/utils";

/**
 * Standard page shell — matches CRM/PM (`space-y-6 p-4 md:p-6` on white).
 */
export function PortalPageShell({ children, className }) {
  return (
    <div className={cn("min-h-full space-y-4 bg-white p-4 md:space-y-6 md:p-6", className)}>
      {children}
    </div>
  );
}
