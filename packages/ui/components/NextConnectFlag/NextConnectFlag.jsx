import { clsx } from 'clsx';
import { Calendar, CalendarCheck } from 'lucide-react';
import { calendarDayDiff, parseDisplayDate } from '@webfudge/utils';

/**
 * @param {string | Date | null | undefined} dateString
 * @returns {'today' | 'future' | 'overdue' | null}
 */
export function getNextConnectFlagVariant(dateString) {
  const date = parseDisplayDate(dateString);
  if (!date) return null;
  const diff = calendarDayDiff(date);
  if (diff === 0) return 'today';
  if (diff > 0) return 'future';
  return 'overdue';
}

/**
 * @param {string | Date | null | undefined} dateString
 * @returns {string}
 */
export function getNextConnectFlagLabel(dateString) {
  const date = parseDisplayDate(dateString);
  if (!date) return '';
  const diff = calendarDayDiff(date);
  if (diff === 0) return 'Today';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const variantStyles = {
  today: {
    wrap: 'bg-orange-100 text-orange-700',
    icon: Calendar,
  },
  future: {
    wrap: 'bg-emerald-100 text-emerald-700',
    icon: CalendarCheck,
  },
  overdue: {
    wrap: 'bg-orange-100 text-orange-800',
    icon: Calendar,
  },
};

/**
 * Ribbon-style flag for the next scheduled connect date (CRM leads table + detail).
 */
export function NextConnectFlag({ date, size = 'sm', className, title }) {
  const variant = getNextConnectFlagVariant(date);
  if (!variant) return null;

  const label = getNextConnectFlagLabel(date);
  const config = variantStyles[variant];
  const Icon = config.icon;
  const tooltip =
    title ??
    (variant === 'today'
      ? 'Connect today'
      : variant === 'future'
        ? `Next connect ${label}`
        : `Overdue — was ${label}`);

  return (
    <span
      className={clsx(
        'inline-flex max-w-full items-center gap-1 rounded-l font-semibold leading-none',
        'relative [clip-path:polygon(0_0,calc(100%-5px)_0,100%_50%,calc(100%-5px)_100%,0_100%)]',
        size === 'sm' && 'px-1.5 py-0.5 pr-2.5 text-[11px]',
        size === 'md' && 'gap-1.5 px-2.5 py-1 pr-3 text-xs',
        config.wrap,
        className
      )}
      title={tooltip}
      aria-label={tooltip}
    >
      <Icon className={clsx('shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}

/**
 * Normalize API / date-picker values to YYYY-MM-DD for HTML date inputs.
 * @param {string | Date | null | undefined} dateString
 * @returns {string}
 */
export function toDateInputValue(dateString) {
  const date = parseDisplayDate(dateString);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
