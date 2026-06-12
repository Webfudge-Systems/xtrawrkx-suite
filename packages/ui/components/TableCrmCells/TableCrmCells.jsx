import { clsx } from 'clsx';
import { User, Mail, Phone } from 'lucide-react';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { getNextConnectFlagLabel, getNextConnectFlagVariant } from '../NextConnectFlag/NextConnectFlag';
import { formatRelativeTime, formatTableDate, ownerDisplayFromUser } from '../../utils/crmTableFormat';

const cell = {
  created: {
    wrap: 'min-w-[130px]',
    wrapCenter: 'text-center',
    date: 'whitespace-nowrap text-sm font-semibold text-gray-900',
    relative: 'text-sm font-normal text-gray-500',
  },
  owner: {
    row: 'flex min-w-[180px] items-center gap-2',
    label: 'min-w-0 flex-1 truncate font-semibold text-gray-900',
    icon: 'h-4 w-4 flex-shrink-0 text-gray-400',
  },
  status: {
    pill: (active) =>
      clsx(
        'inline-flex rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        active
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
          : 'border-gray-300 bg-gray-50 text-gray-700'
      ),
  },
  role: {
    secondary:
      'inline-flex rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-gray-700',
  },
};

function truncateClamped(text, max = 100) {
  if (text == null || text === '') return '';
  const s = String(text).replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

/**
 * Default truncated text cell (lead companies, client accounts, deals).
 */
export function TableCellText({
  value,
  emphasized = false,
  nowrap = false,
  capitalize = false,
  maxWidthClass = 'max-w-[200px]',
  className,
}) {
  const display = value != null && value !== '' ? String(value) : null;
  return (
    <span
      className={clsx(
        'inline-block text-sm',
        emphasized && 'whitespace-nowrap font-semibold text-gray-900',
        !emphasized && nowrap && 'whitespace-nowrap text-gray-600',
        !emphasized && !nowrap && maxWidthClass,
        !emphasized && !nowrap && 'truncate whitespace-nowrap text-gray-600',
        capitalize && 'capitalize',
        className
      )}
      title={display || ''}
    >
      {display || '—'}
    </span>
  );
}

/**
 * Industry / priority pill: orange border, uppercase (CRM list tables).
 */
export function TableCellOrangePill({ value, emptyLabel = '—', className }) {
  const raw = value != null && String(value).trim() !== '' ? String(value).replace(/_/g, ' ').trim() : '';
  if (!raw) {
    return (
      <span className={clsx('text-sm text-gray-400', className)}>
        {emptyLabel}
      </span>
    );
  }
  return (
    <span
      className={clsx(
        'inline-flex rounded-lg border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-800',
        className
      )}
    >
      {raw.toUpperCase()}
    </span>
  );
}

/**
 * Source column (capitalize, N/A when empty) — lead companies pattern.
 */
export function TableCellSource({ value, className }) {
  const s = value ? String(value).replace(/_/g, ' ') : '';
  return (
    <span className={clsx('whitespace-nowrap text-sm capitalize text-gray-600', className)}>
      {s || 'N/A'}
    </span>
  );
}

/**
 * Notes / description: two-line clamp, lead companies pattern.
 */
export function TableCellMultiline({
  text,
  maxChars = 100,
  maxWidthClass = 'max-w-[200px]',
  className,
}) {
  const t = text == null || text === '' ? '' : String(text).replace(/\s+/g, ' ').trim();
  const display = t ? truncateClamped(t, maxChars) : '';
  if (!t) {
    return <span className={clsx('text-sm text-gray-400', className)}>—</span>;
  }
  return (
    <span
      className={clsx('inline-block line-clamp-2 text-sm text-gray-600', maxWidthClass, className)}
      title={t}
    >
      {display}
    </span>
  );
}

/**
 * Primary contact: mail + phone rows (lead companies list).
 */
export function TableCellPrimaryContact({ email, phone, className }) {
  return (
    <div className={clsx('min-w-[200px] space-y-1', className)}>
      <div className="flex items-center gap-2 text-sm text-gray-900">
        <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden />
        <span className="truncate">{email || 'No email'}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Phone className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden />
        <span className="truncate">{phone || 'No contact'}</span>
      </div>
    </div>
  );
}

/**
 * Deal / entity title + subtitle stack (lead company name + caption).
 */
export function TableCellTitleSubtitle({ title, subtitle, subtitleTitle, className }) {
  const sub =
    subtitle != null && String(subtitle).trim() !== '' ? String(subtitle).trim() : '—';
  return (
    <div className={clsx('min-w-0 flex-1', className)}>
      <div className="truncate font-medium text-gray-900">{title || '—'}</div>
      <div
        className="truncate text-sm text-gray-500"
        title={subtitleTitle ?? (typeof subtitle === 'string' ? subtitle : undefined)}
      >
        {sub}
      </div>
    </div>
  );
}

/**
 * Probability bar + percent (deals table).
 */
export function TableCellProbability({ value, className }) {
  const p = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className={clsx('flex min-w-[120px] items-center gap-2', className)}>
      <div className="h-1.5 min-w-[56px] flex-1 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${p}%` }} />
      </div>
      <span className="whitespace-nowrap text-sm font-medium text-gray-700">{p}%</span>
    </div>
  );
}

/**
 * Created column: absolute date (bold) + relative time (muted), matching CRM contacts table.
 */
export function TableCellCreated({
  dateString,
  align = 'start',
  showRelative = true,
  /** 'auto' detects date-only / midnight UTC; use 'calendar' for start/due fields */
  dateMode = 'auto',
  className,
}) {
  const dateOpts = dateMode === 'auto' ? {} : { dateMode };
  const date = formatTableDate(dateString, dateOpts);
  const relative = showRelative ? formatRelativeTime(dateString, dateOpts) : '';
  return (
    <div
      className={clsx(
        cell.created.wrap,
        align === 'center' && cell.created.wrapCenter,
        className
      )}
    >
      <div className={cell.created.date}>{date}</div>
      {showRelative ? <div className={cell.created.relative}>{relative || '—'}</div> : null}
    </div>
  );
}

/**
 * Single-line date (e.g. Updated column).
 */
export function TableCellDateOnly({ dateString, className }) {
  return (
    <div className={clsx('min-w-[120px] whitespace-nowrap text-sm text-gray-600', className)}>
      {formatTableDate(dateString)}
    </div>
  );
}

/**
 * Owner / Account manager / Assigned to: avatar + label + person icon (contacts table pattern).
 */
export function TableCellOwner({
  user,
  label: labelProp,
  avatarFallback: fallbackProp,
  avatarClassName,
  showIcon = true,
  className,
}) {
  const derived = ownerDisplayFromUser(user);
  const label = labelProp ?? derived.label;
  const avatarFallback = fallbackProp ?? derived.avatarFallback;
  return (
    <div className={clsx(cell.owner.row, className)}>
      <Avatar
        fallback={avatarFallback}
        alt={label}
        size="sm"
        className={clsx('flex-shrink-0 bg-gray-600 text-white', avatarClassName)}
      />
      <span className={cell.owner.label}>{label}</span>
      {showIcon ? <User className={cell.owner.icon} aria-hidden /> : null}
    </div>
  );
}

/**
 * Active / inactive status pill (contacts + client accounts).
 */
export function TableCellStatusPill({ status, className }) {
  const s = (status || 'ACTIVE').toString().toUpperCase();
  const isActive = s === 'ACTIVE';
  return <span className={clsx(cell.status.pill(isActive), className)}>{s}</span>;
}

/**
 * Role column: primary contact badge, custom role chip, or em dash.
 */
export function TableCellRole({ isPrimaryContact, roleLabel, className }) {
  if (isPrimaryContact) {
    return (
      <div className={className}>
        <Badge variant="success" className="whitespace-nowrap font-medium">
          PRIMARY CONTACT
        </Badge>
      </div>
    );
  }
  if (roleLabel?.trim()) {
    return (
      <span className={clsx(cell.role.secondary, className)}>{roleLabel.trim()}</span>
    );
  }
  return <span className={clsx('text-sm text-gray-400', className)}>—</span>;
}

const leadStatusConfig = {
  new: { variant: 'primary', label: 'New' },
  contacted: { variant: 'warning', label: 'Contacted' },
  qualified: { variant: 'success', label: 'Qualified' },
  lost: { variant: 'danger', label: 'Lost' },
};

/**
 * Lead company row status (pipeline + converted/client).
 */
export function TableCellLeadStatus({ company, className }) {
  const isConverted =
    company?.status?.toUpperCase() === 'CONVERTED' ||
    company?.status?.toUpperCase() === 'CLIENT' ||
    Boolean(company?.convertedAccount);
  if (isConverted) {
    const statusUpper = (company?.status || '').toString().toUpperCase();
    const label =
      statusUpper === 'CLIENT' || company?.convertedAccount ? 'CLIENT' : 'CONVERTED';
    return (
      <div className={className}>
        <Badge variant="success" className="font-semibold">
          {label}
        </Badge>
      </div>
    );
  }
  const status = company?.status?.toLowerCase() || 'new';
  const config = leadStatusConfig[status] || leadStatusConfig.new;
  return (
    <div className={className}>
      <Badge variant={config.variant} className="font-semibold">
        {config.label.toUpperCase()}
      </Badge>
    </div>
  );
}

const nextConnectBadgeVariant = {
  today: 'warning',
  future: 'success',
  overdue: 'orange',
};

/**
 * Next connect date — status-style pill (CRM lead companies table).
 */
export function TableCellNextConnect({ date, className }) {
  const flagVariant = getNextConnectFlagVariant(date);
  if (!flagVariant) {
    return <span className={clsx('text-sm text-gray-400', className)}>—</span>;
  }
  const label = getNextConnectFlagLabel(date);
  return (
    <div className={clsx('min-w-[100px]', className)}>
      <Badge
        variant={nextConnectBadgeVariant[flagVariant]}
        className="whitespace-nowrap font-semibold uppercase"
        title={
          flagVariant === 'today'
            ? 'Connect today'
            : flagVariant === 'future'
              ? `Next connect ${label}`
              : `Overdue — was ${label}`
        }
      >
        {label}
      </Badge>
    </div>
  );
}

export { formatRelativeTime, formatTableDate, ownerDisplayFromUser };
