"use client";

import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/pocUtils";

function ContactLink({ href, icon: Icon, label }) {
  if (!label) return null;

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

export default function DedicatedPocSidebarCard({ poc, collapsed = false }) {
  if (!poc) return null;

  const initials = getUserInitials(poc.fullName);
  const isActive = poc.isActive !== false;

  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center gap-1.5 py-1"
        title={poc.fullName}
      >
        {poc.avatarUrl ? (
          <img
            src={poc.avatarUrl}
            alt={poc.fullName}
            className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-gray-200"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-xtrawrkx-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white ring-offset-1 ring-offset-gray-100">
            {initials}
          </div>
        )}
        {isActive ? (
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            title="Active POC"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Your dedicated POC
        </p>
        {isActive ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
            Active
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-600">
            Away
          </span>
        )}
      </div>

      <div className="flex flex-col items-center text-center">
        {poc.avatarUrl ? (
          <img
            src={poc.avatarUrl}
            alt={poc.fullName}
            className="mb-3 h-14 w-14 rounded-full border-2 border-white object-cover shadow-md ring-2 ring-gray-100"
          />
        ) : (
          <div
            className={cn(
              "mb-3 flex h-14 w-14 items-center justify-center rounded-full",
              "bg-xtrawrkx-500 text-base font-bold text-white shadow-md",
              "ring-2 ring-white ring-offset-2 ring-offset-gray-50"
            )}
          >
            {initials}
          </div>
        )}

        <p className="text-sm font-semibold text-gray-900 leading-tight">
          {poc.fullName}
        </p>
        {poc.designation ? (
          <p className="mt-0.5 text-xs text-gray-600">{poc.designation}</p>
        ) : null}
        {(poc.teamName || poc.department) ? (
          <p className="mt-0.5 text-[11px] text-gray-500">
            {poc.teamName || poc.department}
          </p>
        ) : null}
      </div>

      {(poc.email || poc.phone) && (
        <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
          <ContactLink
            href={poc.email ? `mailto:${poc.email}` : undefined}
            icon={Mail}
            label={poc.email}
          />
          <ContactLink
            href={poc.phone ? `tel:${poc.phone}` : undefined}
            icon={Phone}
            label={poc.phone}
          />
        </div>
      )}
    </div>
  );
}
