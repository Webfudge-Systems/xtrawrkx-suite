'use client';

import { Badge, getNextConnectFlagLabel, getNextConnectFlagVariant } from '@webfudge/ui';
import { Calendar, MessageSquarePlus } from 'lucide-react';
import { clsx } from 'clsx';

const nextConnectBadgeVariant = {
  today: 'warning',
  future: 'success',
  overdue: 'orange',
};

export function LeadNextConnectCell({
  company,
  reasonCount = 0,
  onOpenPopover,
  canEdit = true,
  active = false,
}) {
  const date = company?.nextConnectDate;
  const flagVariant = getNextConnectFlagVariant(date);
  const label = flagVariant ? getNextConnectFlagLabel(date) : null;
  const hasReasons = Number(reasonCount) > 0;

  const openNextConnectPopover = (event, focus) => {
    event.stopPropagation();
    const r = event.currentTarget.getBoundingClientRect();
    onOpenPopover?.(company.id, {
      mode: 'nextConnect',
      top: r.bottom + 8,
      left: r.left,
      triggerEl: event.currentTarget,
      focus,
    });
  };

  if (!canEdit && !date && !hasReasons) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <div className="group flex min-w-[100px] items-center gap-1" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={(event) => openNextConnectPopover(event, 'date')}
        disabled={!canEdit && !hasReasons}
        className={clsx(
          'group/nc inline-flex max-w-full items-center gap-1 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60',
          canEdit && 'cursor-pointer hover:opacity-90',
          active && 'ring-2 ring-orange-300 ring-offset-1',
          !canEdit && !hasReasons && 'cursor-default opacity-70'
        )}
        title={
          canEdit
            ? 'Edit next connect date and add a reason'
            : hasReasons
              ? 'View next connect reasons'
              : 'Next connect date'
        }
        aria-label={
          canEdit
            ? `Next connect${label ? `: ${label}` : ''}. Click to edit date.`
            : `Next connect${label ? `: ${label}` : ''}`
        }
      >
        {flagVariant ? (
          <Badge
            variant={nextConnectBadgeVariant[flagVariant]}
            className="whitespace-nowrap font-semibold uppercase pointer-events-none"
          >
            {label}
          </Badge>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 group-hover/nc:border-orange-300 group-hover/nc:bg-orange-50 group-hover/nc:text-orange-700">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Set date
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={(event) => openNextConnectPopover(event, 'comment')}
        className={clsx(
          'relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition',
          hasReasons
            ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
            : 'border-transparent text-gray-400 hover:border-gray-300 hover:bg-white hover:text-gray-600',
          active && 'border-gray-300 bg-white text-gray-700',
          hasReasons ? '' : 'opacity-0 group-hover:opacity-100'
        )}
        aria-label={`Next connect reasons for ${company?.companyName || 'lead'}${hasReasons ? ` (${reasonCount})` : ''}`}
        title="Next connect reason"
      >
        <MessageSquarePlus className="h-3.5 w-3.5" />
        {hasReasons ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white"
            aria-hidden
          />
        ) : null}
      </button>
    </div>
  );
}
