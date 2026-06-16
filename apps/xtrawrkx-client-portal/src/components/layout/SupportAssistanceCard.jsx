"use client";

import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { supportConfig } from "@/config/supportConfig";
import { getUserInitials } from "@/lib/pocUtils";

function ContactLink({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-2.5 py-2 transition-colors hover:border-orange-200 hover:bg-gradient-to-r hover:from-orange-50/60 hover:to-white/60"
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

export default function SupportAssistanceCard({ collapsed = false, poc = null }) {
  const { title, description, email } = supportConfig;
  const hasPoc = Boolean(poc);
  const isActive = poc?.isActive !== false;

  const pocEmail = poc?.email || email;
  const pocPhone = poc?.phone || "";

  if (collapsed) {
    if (!hasPoc) {
      return (
        <div className="flex flex-col items-center gap-1.5 py-1">
          <span className="rounded-full bg-gradient-to-br from-orange-100 to-amber-50 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-orange-900 ring-1 ring-orange-100">
            Pending
          </span>
          <a
            href={`mailto:${email}`}
            className="text-gray-500 hover:text-orange-600"
            title={email}
          >
            <Mail className="h-4 w-4" />
          </a>
        </div>
      );
    }

    const initials = getUserInitials(poc?.fullName);

    return (
      <div
        className="flex flex-col items-center gap-1.5 py-1"
        title={poc?.fullName}
      >
        {poc?.avatarUrl ? (
          <img
            src={poc.avatarUrl}
            alt={poc.fullName}
            className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-gray-200"
          />
        ) : (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              "bg-gradient-to-br from-orange-400 to-orange-600 text-[10px] font-bold text-white shadow-md",
              "ring-2 ring-white ring-offset-1 ring-offset-gray-100"
            )}
          >
            {initials}
          </div>
        )}
        {isActive ? (
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
            title="Active POC"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50/60 via-white to-white/70 shadow-sm px-3 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            {title}
          </p>

          {!hasPoc ? (
            <span className="shrink-0 rounded-full bg-gradient-to-br from-orange-100 to-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-orange-900 ring-1 ring-orange-100">
              POC pending
            </span>
          ) : (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1",
                isActive
                  ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white ring-orange-100"
                  : "bg-gray-100 text-gray-600 ring-gray-200"
              )}
            >
              {isActive ? "Active POC" : "POC (away)"}
            </span>
          )}
        </div>

        {!hasPoc ? (
          description ? (
            <p className="mb-3 text-[11px] leading-snug text-gray-600">
              {description}
            </p>
          ) : null
        ) : (
          <div className="mb-3 text-left">
            <p className="text-[11px] leading-snug text-gray-600">
              {poc?.designation || "Point of Contact"} •{" "}
              {poc?.teamName || "Customer Success"}
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <ContactLink href={`mailto:${pocEmail}`} icon={Mail} label={pocEmail} />
          {hasPoc && pocPhone ? (
            <ContactLink
              href={`tel:${pocPhone}`}
              icon={Phone}
              label={pocPhone}
            />
          ) : null}
        </div>

        {!hasPoc ? (
          <span
            className={cn(
              "mt-3 flex w-full items-center justify-center rounded-lg border border-dashed",
              "border-orange-200 bg-orange-50 px-2 py-1.5 text-[10px] font-medium text-orange-800"
            )}
          >
            Yet to assign
          </span>
        ) : (
          <span
            className={cn(
              "mt-3 flex w-full items-center justify-center rounded-lg border px-2 py-1.5 text-[10px] font-medium",
              "bg-gradient-to-br from-orange-50 to-orange-100 text-orange-900 border-orange-200/70"
            )}
          >
            POC assigned
          </span>
        )}
      </div>
    </div>
  );
}
