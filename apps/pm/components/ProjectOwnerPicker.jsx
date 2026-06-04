'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Avatar, Button, Modal } from '@webfudge/ui';
import { ownerDisplayFromUser } from '@webfudge/ui';
import { Search, UserCog } from 'lucide-react';
import { clsx } from 'clsx';

function memberHaystack(u) {
  return [u.name, u.email, u.firstName, u.lastName, u.username]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function matchesQuery(u, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return memberHaystack(u).includes(q);
}

/**
 * Change project owner (project manager) — centered modal with search.
 */
export default function ProjectOwnerPicker({
  users = [],
  ownerId = null,
  onChange,
  disabled = false,
  saving = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedId = ownerId != null && String(ownerId).trim() !== '' ? Number(ownerId) : null;

  const filteredUsers = useMemo(
    () => users.filter((u) => matchesQuery(u, query)),
    [users, query]
  );

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const pick = (id) => {
    onChange?.(id != null && id !== '' ? Number(id) : null);
    setOpen(false);
  };

  const modal =
    typeof document !== 'undefined' && open
      ? createPortal(
          <Modal
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Change project owner"
            size="lg"
            contentClassName="space-y-4 !pt-4"
          >
            <p className="text-sm text-gray-600">
              Choose who manages this project. Only one owner at a time.
            </p>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="block w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoComplete="off"
              />
            </div>
            <div className="grid max-h-[min(26rem,55vh)] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              <button
                type="button"
                onClick={() => pick(null)}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition',
                  selectedId == null
                    ? 'border-orange-300 bg-orange-50/80 ring-1 ring-orange-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                  —
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">Unassigned</p>
                  <p className="text-xs text-gray-500">No project owner</p>
                </div>
              </button>
              {filteredUsers.length === 0 && users.length > 0 ? (
                <p className="col-span-full py-4 text-center text-sm text-gray-500 sm:col-span-2">
                  No members match your search.
                </p>
              ) : null}
              {users.length === 0 ? (
                <p className="col-span-full py-4 text-center text-sm text-gray-500 sm:col-span-2">
                  No organization members available.
                </p>
              ) : null}
              {filteredUsers.map((u) => {
                const derived = ownerDisplayFromUser(u);
                const secondary = u.email && u.email !== derived.label ? u.email : null;
                const selected = Number(u.id) === selectedId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => pick(u.id)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition',
                      selected
                        ? 'border-orange-300 bg-orange-50/80 ring-1 ring-orange-200'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <Avatar
                      src={u.avatar || undefined}
                      alt={derived.label}
                      fallback={derived.avatarFallback}
                      size="md"
                      className="shrink-0 bg-gray-600 text-white"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{derived.label}</p>
                      {secondary ? <p className="truncate text-xs text-gray-500">{secondary}</p> : null}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end border-t border-gray-200 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </Modal>,
          document.body
        )
      : null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={disabled || saving}
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap sm:w-auto"
      >
        <UserCog className="h-4 w-4 shrink-0 text-gray-600" strokeWidth={1.75} aria-hidden />
        {saving ? 'Saving…' : 'Change owner'}
      </Button>
      {modal}
    </>
  );
}
