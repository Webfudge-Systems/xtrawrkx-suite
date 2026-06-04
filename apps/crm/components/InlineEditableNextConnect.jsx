'use client';

import { useState, useRef, useEffect } from 'react';
import {
  toDateInputValue,
  getNextConnectFlagVariant,
  getNextConnectFlagLabel,
} from '@webfudge/ui';
import { Calendar, CalendarCheck, CalendarPlus } from 'lucide-react';

const detailBadgeShell =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest shadow-md ring-2';

const detailBadgeStyles = {
  today: {
    wrap: 'border border-amber-300/90 bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100/90 text-amber-950 ring-amber-200/70',
    iconClass: 'text-amber-600',
    Icon: Calendar,
    title: 'Connect today',
  },
  future: {
    wrap: 'border border-emerald-300/90 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100/90 text-emerald-950 ring-emerald-200/70',
    iconClass: 'text-emerald-600',
    Icon: CalendarCheck,
    titlePrefix: 'Next connect',
  },
  overdue: {
    wrap: 'border border-orange-300/90 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100/90 text-orange-900 ring-orange-200/70',
    iconClass: 'text-orange-600',
    Icon: Calendar,
    titlePrefix: 'Overdue — was',
  },
};

function DetailNextConnectBadge({ date, className = '' }) {
  const variant = getNextConnectFlagVariant(date);
  if (!variant) return null;
  const label = getNextConnectFlagLabel(date);
  const config = detailBadgeStyles[variant];
  const Icon = config.Icon;
  const title =
    variant === 'today'
      ? config.title
      : variant === 'future'
        ? `${config.titlePrefix} ${label}`
        : `${config.titlePrefix} ${label}`;

  return (
    <span
      className={`${detailBadgeShell} ${config.wrap} ${className}`}
      title={title}
    >
      <Icon className={`h-5 w-5 shrink-0 ${config.iconClass}`} strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  );
}

/**
 * Click-to-edit next connect date (lead company detail — company info header).
 */
export function InlineEditableNextConnect({
  date,
  canEdit = true,
  saving = false,
  onSave,
  className = '',
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker();
      } catch {
        /* unsupported */
      }
    }
  }, [editing]);

  const commit = async (raw) => {
    setEditing(false);
    const next = raw?.trim() || null;
    const current = toDateInputValue(date) || null;
    if (next === current) return;
    await onSave(next);
  };

  const startEdit = () => {
    if (!canEdit || saving) return;
    setEditing(true);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="date"
        defaultValue={toDateInputValue(date)}
        disabled={saving}
        className={`${detailBadgeShell} border border-orange-300/90 bg-white text-gray-900 ring-orange-200/70 focus:border-orange-500 focus:outline-none focus:ring-orange-400 disabled:opacity-50 ${className}`}
        aria-label="Next connect date"
        onChange={(e) => void commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setEditing(false);
        }}
        onBlur={() => setEditing(false)}
      />
    );
  }

  if (!date) {
    if (!canEdit) return null;
    return (
      <button
        type="button"
        onClick={startEdit}
        disabled={saving}
        className={`${detailBadgeShell} border border-dashed border-gray-300 bg-gray-50 text-gray-600 ring-gray-200/70 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800 disabled:opacity-50 ${className}`}
        title="Set next connect date"
      >
        <CalendarPlus className="h-5 w-5 shrink-0 text-gray-500" strokeWidth={2.25} aria-hidden />
        Set date
      </button>
    );
  }

  if (!canEdit) {
    return <DetailNextConnectBadge date={date} className={className} />;
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      disabled={saving}
      className={`rounded-xl transition hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 disabled:opacity-50 ${className}`}
      title="Click to change next connect date"
      aria-label="Edit next connect date"
    >
      <DetailNextConnectBadge date={date} />
    </button>
  );
}
