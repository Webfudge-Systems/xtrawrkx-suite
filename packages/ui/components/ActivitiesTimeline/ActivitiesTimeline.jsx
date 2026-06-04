'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { Activity, ExternalLink } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import { LoadingSpinner } from '../../feedback';

function formatWhen(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function actorLabel(actor) {
  if (!actor || typeof actor !== 'object') return null;
  const u = actor.username?.trim();
  const e = actor.email?.trim();
  if (u && u.length) return u;
  if (e && e.length) return e;
  return actor.id != null ? `User ${actor.id}` : null;
}

/** Badge styles aligned with CRM reference: CREATE green, COMMENT blue, UPDATE neutral/sky, DELETE red */
function actionStyles(action) {
  const a = (action || 'update').toString().toLowerCase();
  if (a === 'create') return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80';
  if (a === 'delete') return 'bg-red-50 text-red-800 ring-red-200/80';
  if (a === 'comment') return 'bg-blue-50 text-blue-800 ring-blue-200/80';
  return 'bg-slate-100 text-slate-800 ring-slate-200/90';
}

/** Normalize Strapi meta (object or occasional JSON string). */
function parseMeta(meta) {
  if (meta == null) return null;
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta);
    } catch {
      return null;
    }
  }
  return typeof meta === 'object' ? meta : null;
}

function actionLabel(action) {
  const a = (action || 'update').toString().toLowerCase();
  return a.toUpperCase();
}

/**
 * Vertical CRM-style activity timeline (orange spine + typed badges + optional field diff blocks).
 *
 * @param {{
 *   items: object[],
 *   loading?: boolean,
 *   error?: string | null,
 *   className?: string,
 *   entityHrefForRow?: (row: object) => string | null,
 *   onItemClick?: (row: object) => void,
 *   selectedItemId?: string | number | null,
 * }} props
 */
export function ActivitiesTimeline({
  items,
  loading,
  error,
  className = '',
  entityHrefForRow,
  onItemClick,
  selectedItemId = null,
}) {
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-14 ${className}`.trim()}>
        <LoadingSpinner size="lg" message="Loading activities…" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-xl border border-red-200 bg-red-50/80 px-4 py-4 text-sm text-red-800 ${className}`.trim()}
        role="alert"
      >
        {error}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No activities yet"
        description="Edits and other changes to this record will show up here."
      />
    );
  }

  return (
    <ul className={`relative pl-2 ${className}`.trim()} aria-label="Activity timeline">
      <div
        className="absolute left-[15px] top-2 bottom-2 w-px bg-orange-400"
        aria-hidden
      />
      {items.map((row, i) => {
        const who = actorLabel(row.actor);
        const when = formatWhen(row.createdAt);
        const summary = row.summary || 'Activity';
        const act = (row.action || 'update').toString();
        const meta = parseMeta(row.meta);
        const changes = Array.isArray(meta?.changes) ? meta.changes : [];
        const isSelected =
          selectedItemId != null && row.id != null && String(row.id) === String(selectedItemId);
        const entryBody = (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${actionStyles(act)}`}
              >
                {actionLabel(act)}
              </span>
              {when ? (
                <span className="text-xs font-medium text-gray-400 tabular-nums">{when}</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug text-gray-900">{summary}</p>
            {typeof entityHrefForRow === 'function'
              ? (() => {
                  const href = entityHrefForRow(row);
                  if (!href) return null;
                  return (
                    <p className="mt-1.5">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open record
                        <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                      </Link>
                    </p>
                  );
                })()
              : null}
            {changes.length > 0 ? (
              <ul
                className="mt-3 space-y-2.5 rounded-xl border border-gray-100 bg-gray-50/95 px-3 py-3 ring-1 ring-gray-100/80"
                aria-label="Field changes"
              >
                {changes.map((c) => (
                  <li key={c.key} className="text-xs">
                    <div className="font-medium text-gray-500">{c.label}</div>
                    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="max-w-full break-words rounded-lg bg-white px-2 py-1 text-gray-600 shadow-sm ring-1 ring-gray-200/70">
                        {c.before}
                      </span>
                      <span className="shrink-0 font-medium text-gray-400" aria-hidden>
                        →
                      </span>
                      <span className="max-w-full break-words rounded-lg bg-emerald-50 px-2 py-1 font-medium text-emerald-900 shadow-sm ring-1 ring-emerald-200/70">
                        {c.after}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            {who ? <p className="mt-2 text-xs text-gray-500">By {who}</p> : null}
          </>
        );
        return (
          <li key={row.id ?? `a-${i}`} className="relative flex gap-4 pb-8 last:pb-0">
            <div
              className="relative z-[1] mt-1.5 h-3 w-3 shrink-0 rounded-full bg-orange-500 shadow-sm ring-4 ring-white"
              aria-hidden
            />
            {typeof onItemClick === 'function' ? (
              <button
                type="button"
                className={clsx(
                  'min-w-0 flex-1 rounded-xl pt-0.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2',
                  'hover:bg-gray-50/95',
                  isSelected && 'bg-orange-50/90 ring-1 ring-orange-200/90'
                )}
                onClick={() => onItemClick(row)}
              >
                {entryBody}
              </button>
            ) : (
              <div
                className={clsx(
                  'min-w-0 flex-1 pt-0.5',
                  isSelected && 'rounded-xl bg-orange-50/90 ring-1 ring-orange-200/90'
                )}
              >
                {entryBody}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
