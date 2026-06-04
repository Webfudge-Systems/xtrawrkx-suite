"use client";

import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { supportConfig } from "@/config/supportConfig";

function ContactLink({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-2.5 py-2 transition-colors hover:border-xtrawrkx-200 hover:bg-xtrawrkx-50/50"
    >
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white border border-gray-100 text-gray-500">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 truncate text-[11px] font-medium text-gray-700">
        {label}
      </span>
    </a>
  );
}

export default function SupportAssistanceCard({ collapsed = false }) {
  const { title, description, email } = supportConfig;

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-1">
        <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-amber-800 ring-1 ring-amber-100">
          Pending
        </span>
        <a
          href={`mailto:${email}`}
          className="text-gray-500 hover:text-xtrawrkx-600"
          title={email}
        >
          <Mail className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </p>
        <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-100">
          POC pending
        </span>
      </div>

      {description ? (
        <p className="mb-3 text-[11px] leading-snug text-gray-600">
          {description}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <ContactLink href={`mailto:${email}`} icon={Mail} label={email} />
      </div>

      <span
        className={cn(
          "mt-3 flex w-full items-center justify-center rounded-lg border border-dashed border-gray-200",
          "bg-gray-50 px-2 py-1.5 text-[10px] font-medium text-gray-500"
        )}
      >
        Yet to assign
      </span>
    </div>
  );
}
