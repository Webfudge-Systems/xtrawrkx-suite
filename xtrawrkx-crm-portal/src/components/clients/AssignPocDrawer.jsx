"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Search, UserPlus, Check } from "lucide-react";
import { Avatar, Button } from "../ui";
import { filterEmployeesForPoc, normalizeUser } from "../../lib/pocUtils";

export default function AssignPocDrawer({
  open,
  onClose,
  companyName,
  users = [],
  loadingUsers = false,
  currentPocId = "",
  onAssign,
  assigning = false,
}) {
  const [query, setQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(currentPocId || "");

  useEffect(() => {
    if (open) {
      setSelectedUserId(currentPocId || "");
      setQuery("");
    }
  }, [open, currentPocId]);

  const filteredUsers = useMemo(
    () => filterEmployeesForPoc(users, query),
    [users, query]
  );

  if (!open) return null;

  const handleAssign = async () => {
    await onAssign?.(selectedUserId || null);
    setQuery("");
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
              Dedicated POC
            </p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">Assign POC</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select an internal team member for{" "}
              <span className="font-medium text-gray-800">{companyName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-100 px-6 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, role, department..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loadingUsers ? (
            <p className="px-2 py-8 text-center text-sm text-gray-500">Loading team members...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-gray-500">No team members match your search.</p>
          ) : (
            <ul className="space-y-2">
              {filteredUsers.map((user) => {
                const normalized = normalizeUser(user);
                const userId = String(user.id || user.documentId);
                const selected = selectedUserId === userId;

                return (
                  <li key={userId}>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(userId)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        selected
                          ? "border-orange-300 bg-orange-50/80 shadow-sm"
                          : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Avatar
                        src={normalized.avatarUrl}
                        alt={normalized.fullName}
                        fallback={normalized.fullName.charAt(0)}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">{normalized.fullName}</p>
                        <p className="truncate text-sm text-gray-600">{normalized.designation}</p>
                        <p className="truncate text-xs text-gray-500">
                          {normalized.department || "No department"} · {normalized.email}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          normalized.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {normalized.isActive ? "Available" : "Away"}
                      </span>
                      {selected ? (
                        <Check className="h-5 w-5 shrink-0 text-orange-600" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4">
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={assigning}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white"
              onClick={handleAssign}
              disabled={assigning || !selectedUserId}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {assigning ? "Assigning..." : "Assign POC"}
            </Button>
          </div>
          {currentPocId ? (
            <button
              type="button"
              className="mt-3 w-full text-center text-sm text-gray-500 transition hover:text-red-600"
              disabled={assigning}
              onClick={async () => {
                setSelectedUserId("");
                await onAssign?.(null);
              }}
            >
              Remove current assignment
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
