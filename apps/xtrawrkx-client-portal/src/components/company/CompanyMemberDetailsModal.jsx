"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Pencil,
  Unlock,
  Trash2,
  X,
} from "lucide-react";
import { Modal, Button, Card } from "@webfudge/ui";
import { getContactById } from "@/lib/api/companyMemberManagementService";

function statusBadge(status) {
  const key = String(status || "ACTIVE").toUpperCase();
  if (key === "ACTIVE") {
    return {
      label: "Active",
      className: "border-green-200 bg-green-100 text-green-700",
    };
  }
  if (key === "SUSPENDED") {
    return {
      label: "Suspended",
      className: "border-amber-200 bg-amber-100 text-amber-800",
    };
  }
  if (key === "INACTIVE") {
    return {
      label: "Inactive",
      className: "border-gray-200 bg-gray-100 text-gray-600",
    };
  }
  if (key === "INVITED") {
    return {
      label: "Invited",
      className: "border-yellow-200 bg-yellow-100 text-yellow-700",
    };
  }
  return {
    label: key,
    className: "border-yellow-200 bg-yellow-100 text-yellow-700",
  };
}

export default function CompanyMemberDetailsModal({
  isOpen,
  onClose,
  memberId,
  initialMember = null,
  onEdit,
  onSuspend,
  onDelete,
}) {
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState(initialMember);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setMember(initialMember);
  }, [initialMember]);

  useEffect(() => {
    if (!isOpen || !memberId) return;

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");
        const res = await getContactById(memberId);
        const data = res?.data || res?.member || res;
        if (cancelled) return;
        if (!data?.id) {
          setError("Member not found.");
          setMember(null);
          return;
        }
        setMember(data);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Failed to load member.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, memberId]);

  const status = useMemo(() => statusBadge(member?.status), [member?.status]);

  const fullName = useMemo(() => {
    if (!member) return "Member";
    const firstName = member.firstName || "";
    const lastName = member.lastName || "";
    return `${firstName} ${lastName}`.trim() || member.name || "Member";
  }, [member]);

  const isPrimary = Boolean(member?.isPrimaryContact);
  const statusKey = String(member?.status || "").toUpperCase();
  const isSuspended = statusKey === "SUSPENDED";
  const isInactive = statusKey === "INACTIVE";
  const shouldActivate = isSuspended || isInactive;

  const portalAccessLabel = member?.portalAccessLabel || member?.portalAccessLevel || "";
  const roleLabel = member?.roleLabel || member?.role || "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Company Member" size="lg" closeOnBackdrop={!loading}>
      {successMessage ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-gray-600">Loading member…</p>
      ) : !member ? (
        <Card variant="elevated" className="p-8 text-center">
          <p className="text-gray-600">Member not found.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold text-gray-900">{fullName}</h3>
                <p className="mt-1 text-sm text-gray-500">{member?.location || "Not specified"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="rounded-lg p-2 hover:bg-gray-100"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Access</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{portalAccessLabel}</p>
              <p className="mt-1 text-xs text-gray-500">Tier derived from assigned contact access</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Role</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{roleLabel}</p>
              <p className="mt-1 text-xs text-gray-500">Admin / Manager / Primary Contact mapping</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Email</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{member?.email || "No email"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Phone</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">{member?.phone || "No phone"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Created Date</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {member?.createdAt ? new Date(member.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Last Active</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {member?.lastActivity ? new Date(member.lastActivity).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="muted" onClick={onClose} disabled={loading}>
              Close
            </Button>
            <Button
              type="button"
              variant="muted"
              onClick={() => onEdit?.(member)}
              disabled={loading}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>

            <Button
              type="button"
              variant="primary"
              disabled={loading || isPrimary}
              onClick={async () => {
                const suspend = !shouldActivate;
                try {
                  await onSuspend?.(member, suspend);
                  setSuccessMessage(
                    suspend ? "Member suspended." : "Member activated."
                  );
                } catch (e) {
                  setError(e?.message || "Failed to update portal access");
                }
              }}
              className={isPrimary ? "opacity-60 cursor-not-allowed" : ""}
            >
              {shouldActivate ? (
                <Unlock className="mr-2 h-4 w-4" />
              ) : (
                <Lock className="mr-2 h-4 w-4" />
              )}
              {shouldActivate
                ? "Activate portal access"
                : "Suspend portal access"}
            </Button>

            {onDelete ? (
              <Button
                type="button"
                variant="muted"
                onClick={() => onDelete?.(member)}
                disabled={loading || isPrimary}
                className="!bg-red-600 !text-white hover:!bg-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </Modal>
  );
}

