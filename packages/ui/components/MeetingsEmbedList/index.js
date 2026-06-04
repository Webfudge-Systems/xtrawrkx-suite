'use client';

/**
 * MeetingsEmbedList — compact, reusable meetings list for entity detail pages.
 *
 * Used by both PM (project / task detail) and CRM (deal / account / contact detail).
 *
 * Props:
 *   fetchFn       – () => Promise<{ data: Meeting[] }>
 *   scheduleHref  – string  href for the "Add meeting" CTA
 *   emptyTitle    – string  (optional) override for the empty-state heading
 *   entityLabel   – string  (optional) e.g. "deal", "account" — used in empty-state copy
 *   meetingBasePath – string  (optional) base path for meeting detail links (default "/meetings")
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  Plus,
  Video,
  MapPin,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '../Badge';
import { Button } from '../Button';

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

const STATUS_VARIANTS = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'default',
  no_show: 'warning',
};

const TYPE_LABELS = {
  discovery: 'Discovery',
  demo: 'Demo',
  follow_up: 'Follow-up',
  check_in: 'Check-in',
  review: 'Review',
  internal: 'Internal',
  other: 'Other',
};

const TYPE_COLORS = {
  discovery: 'bg-violet-100 text-violet-700',
  demo: 'bg-blue-100 text-blue-700',
  follow_up: 'bg-amber-100 text-amber-700',
  check_in: 'bg-teal-100 text-teal-700',
  review: 'bg-indigo-100 text-indigo-700',
  internal: 'bg-gray-100 text-gray-600',
  other: 'bg-orange-100 text-orange-700',
};

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    meridiem: 'short',
  });
}

function computeDuration(start, end) {
  if (!start || !end) return null;
  const mins = Math.round((new Date(end) - new Date(start)) / 60000);
  if (mins <= 0) return null;
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function isPast(iso) {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

export function MeetingsEmbedList({
  fetchFn,
  scheduleHref,
  emptyTitle = 'No meetings yet',
  entityLabel = 'this record',
  meetingBasePath = '/meetings',
}) {
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!fetchFn) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      const raw = res?.data;
      setMeetings(Array.isArray(raw) ? raw : []);
    } catch (e) {
      setError('Failed to load meetings.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4"
          >
            <div className="h-9 w-9 rounded-lg bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-48 rounded bg-gray-100" />
              <div className="h-3 w-32 rounded bg-gray-100" />
            </div>
            <div className="h-6 w-20 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
        <p className="flex-1 text-sm text-red-700">{error}</p>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:underline"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
          <CalendarDays className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{emptyTitle}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            Schedule a meeting for {entityLabel} to see it here.
          </p>
        </div>
        {scheduleHref && (
          <Button
            type="button"
            size="sm"
            onClick={() => router.push(scheduleHref)}
            className="gap-1.5 border-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:opacity-95"
          >
            <Plus className="h-3.5 w-3.5" />
            Add meeting
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-[1.25rem] text-sm text-gray-600">
          Showing{' '}
          <span className="font-semibold tabular-nums text-gray-900">{meetings.length}</span>{' '}
          {meetings.length === 1 ? 'meeting' : 'meetings'}
        </p>
        {scheduleHref && (
          <Button
            type="button"
            size="sm"
            onClick={() => router.push(scheduleHref)}
            className="w-full gap-1.5 border-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md hover:opacity-95 sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            Add meeting
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {meetings.map((m) => {
          const rowId = m.id ?? m.documentId;
          const past = isPast(m.startTime) && m.status === 'scheduled';
          const duration = computeDuration(m.startTime, m.endTime);
          const typeLabel = TYPE_LABELS[m.meetingType] || m.meetingType || 'Other';
          const typeCls = TYPE_COLORS[m.meetingType] || TYPE_COLORS.other;

          return (
            <div
              key={rowId}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`${meetingBasePath}/${rowId}`);
                }
              }}
              className="group flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm ring-1 ring-gray-100/80 transition-all hover:border-orange-200 hover:shadow-md hover:ring-orange-100"
              onClick={() => router.push(`${meetingBasePath}/${rowId}`)}
            >
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-b from-orange-50 to-orange-100/90 text-center ring-1 ring-orange-200/60">
                <span className="text-[10px] font-bold uppercase leading-none text-orange-600">
                  {m.startTime
                    ? new Date(m.startTime).toLocaleDateString('en-US', { month: 'short' })
                    : '—'}
                </span>
                <span className="text-lg font-extrabold leading-tight text-orange-800">
                  {m.startTime ? new Date(m.startTime).getDate() : '—'}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span className="min-w-0 truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-orange-600">
                    {m.title || 'Untitled'}
                  </span>
                  {past && (
                    <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200/80">
                      Overdue
                    </span>
                  )}
                  <Badge
                    variant={STATUS_VARIANTS[m.status] || 'default'}
                    className="shrink-0 text-[10px] font-bold"
                  >
                    {STATUS_LABELS[m.status] || m.status}
                  </Badge>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeCls}`}
                  >
                    {typeLabel}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span>
                      {formatTime(m.startTime)}
                      {m.endTime ? ` – ${formatTime(m.endTime)}` : ''}
                      {duration && <span className="text-gray-400"> · {duration}</span>}
                    </span>
                  </span>
                  {m.isVirtual ? (
                    <span className="flex items-center gap-1 text-sky-600">
                      <Video className="h-3.5 w-3.5 shrink-0" /> Virtual
                    </span>
                  ) : m.location ? (
                    <span className="flex max-w-[200px] items-center gap-1 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="truncate">{m.location}</span>
                    </span>
                  ) : null}
                </div>
              </div>

              <ChevronRight
                className="h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-orange-500"
                aria-hidden
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MeetingsEmbedList;
