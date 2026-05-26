"use client";

import {
  UserPlus,
  UserCircle,
  Mail,
  Phone,
  RefreshCw,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Avatar, Badge, Button } from "../ui";
import { getDedicatedPoc, isPocAssigned } from "../../lib/pocUtils";

function StatusBadge({ assigned }) {
  return (
    <Badge
      className={
        assigned
          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
          : "bg-amber-50 text-amber-800 border-amber-200"
      }
    >
      {assigned ? "Active POC" : "Yet to Assign"}
    </Badge>
  );
}

export default function DedicatedPocCard({
  account,
  isAdmin = false,
  onAssign,
  onChange,
  onRemove,
  assigning = false,
}) {
  const assigned = isPocAssigned(account);
  const poc = getDedicatedPoc(account);

  return (
    <div className="rounded-2xl border border-white/30 bg-gradient-to-br from-white/70 to-white/40 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Dedicated POC</h3>
        <StatusBadge assigned={assigned} />
      </div>

      {!assigned ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 p-5 transition hover:border-orange-200 hover:bg-orange-50/30">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-200/80 text-gray-500">
              <UserCircle className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium text-gray-800">
              No dedicated POC assigned to this client yet.
            </p>
            <p className="mt-1 max-w-xs text-xs text-gray-500">
              Assign a point of contact so this client sees personalized support in their portal.
            </p>
            {isAdmin ? (
              <Button
                className="mt-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md"
                onClick={onAssign}
                disabled={assigning}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Assign POC
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar
              src={poc?.avatarUrl}
              alt={poc?.fullName}
              fallback={poc?.fullName?.charAt(0) || "?"}
              size="xl"
              className="!w-14 !h-14 !text-base"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-semibold text-gray-900">{poc?.fullName}</h4>
              <p className="text-sm text-gray-600">{poc?.designation}</p>
              <p className="text-sm text-gray-500">{poc?.department || poc?.teamName}</p>
              <div className="mt-3 space-y-1.5">
                {poc?.email ? (
                  <a
                    href={`mailto:${poc.email}`}
                    className="flex items-center gap-2 text-sm text-gray-700 transition hover:text-orange-600"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="truncate">{poc.email}</span>
                  </a>
                ) : null}
                {poc?.phone ? (
                  <a
                    href={`tel:${poc.phone}`}
                    className="flex items-center gap-2 text-sm text-gray-700 transition hover:text-orange-600"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                    <span>{poc.phone}</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {account?.pocAssignedAt ? (
            <p className="text-xs text-gray-500">
              Assigned{" "}
              {new Date(account.pocAssignedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          ) : null}

          {isAdmin ? (
            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <Button variant="outline" size="sm" onClick={onChange} disabled={assigning}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Change POC
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 border-red-200"
                onClick={onRemove}
                disabled={assigning}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remove
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/settings/users", "_blank")}
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View Profile
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
