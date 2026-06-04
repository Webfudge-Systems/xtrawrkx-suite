'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { Eye, Pencil } from 'lucide-react';
import { Select } from '../Select';
import { Badge } from '../Badge';
import { TableCellLeadStatus, TableCellStatusPill } from './TableCrmCells';

export const LEAD_STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'LOST', label: 'Lost' },
];

export const TASK_STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'INTERNAL_REVIEW', label: 'Internal review' },
  { value: 'ON_HOLD', label: 'On hold' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const DEAL_STAGE_OPTIONS = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export const ACCOUNT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

/** PM task table labels (same enum values as {@link TASK_STATUS_OPTIONS}). */
export const PM_TASK_STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'INTERNAL_REVIEW', label: 'In Review' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const PROJECT_STATUS_OPTIONS = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export const PROPOSAL_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
];

export const INVOICE_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const LEAD_STATUS_FILL_CLASS = {
  NEW: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
  CONTACTED: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
  QUALIFIED: 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100',
  LOST: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
};

const TASK_STATUS_FILL_CLASS = {
  SCHEDULED: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
  IN_PROGRESS: 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
  INTERNAL_REVIEW: 'border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100',
  ON_HOLD: 'border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100',
  OVERDUE: 'border-red-200 bg-red-50 text-red-900 hover:bg-red-100',
  COMPLETED: 'border-green-200 bg-green-50 text-green-900 hover:bg-green-100',
  CANCELLED: 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
};

const DEAL_STAGE_FILL_CLASS = {
  discovery: 'border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100',
  prospect: 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100',
  proposal: 'border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100',
  negotiation: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
  won: 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
  lost: 'border-red-200 bg-red-50 text-red-900 hover:bg-red-100',
};

const ACCOUNT_STATUS_FILL_CLASS = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  INACTIVE: 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100',
};

const PM_VARIANT_FILL_CLASS = {
  primary: 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
  orange: 'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100',
  cyan: 'border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100',
  purple: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100',
  success: 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100',
  danger: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
  default: 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100',
};

const PM_TASK_STATUS_VARIANT = {
  SCHEDULED: 'primary',
  IN_PROGRESS: 'warning',
  INTERNAL_REVIEW: 'purple',
  ON_HOLD: 'cyan',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  OVERDUE: 'danger',
};

const PROJECT_STATUS_VARIANT = {
  PLANNING: 'primary',
  ACTIVE: 'cyan',
  IN_PROGRESS: 'orange',
  ON_HOLD: 'purple',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  OVERDUE: 'danger',
};

const PROPOSAL_STATUS_FILL_CLASS = {
  DRAFT: 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100',
  SENT: 'border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100',
  ACCEPTED: 'border-green-200 bg-green-50 text-green-900 hover:bg-green-100',
  REJECTED: 'border-red-200 bg-red-50 text-red-900 hover:bg-red-100',
  EXPIRED: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
};

const INVOICE_STATUS_FILL_CLASS = {
  DRAFT: 'border-gray-200 bg-gray-50 text-gray-800 hover:bg-gray-100',
  SENT: 'border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100',
  PARTIAL: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
  PAID: 'border-green-200 bg-green-50 text-green-900 hover:bg-green-100',
  OVERDUE: 'border-red-200 bg-red-50 text-red-900 hover:bg-red-100',
  CANCELLED: 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100',
};

const PROPOSAL_STATUS_BADGE_VARIANT = {
  DRAFT: 'default',
  SENT: 'info',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'warning',
};

const INVOICE_STATUS_BADGE_VARIANT = {
  DRAFT: 'default',
  SENT: 'info',
  PARTIAL: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'default',
};

const SELECT_BASE_CLASS =
  'rounded-lg py-1.5 text-xs font-semibold uppercase tracking-wide shadow-sm';

export function crmLeadTableSelectFillProps(status) {
  const key = (status || 'NEW').toString().toUpperCase();
  const fill = LEAD_STATUS_FILL_CLASS[key] || LEAD_STATUS_FILL_CLASS.NEW;
  return {
    className: `${SELECT_BASE_CLASS} ${fill}`,
    chevronClassName: 'text-current opacity-60',
  };
}

export function crmTaskTableSelectFillProps(status) {
  const key = (status || 'SCHEDULED').toString().toUpperCase();
  const fill = TASK_STATUS_FILL_CLASS[key] || TASK_STATUS_FILL_CLASS.SCHEDULED;
  return {
    className: `${SELECT_BASE_CLASS} ${fill}`,
    chevronClassName: 'text-current opacity-60',
  };
}

export function crmDealStageTableSelectFillProps(stage) {
  const key = (stage || 'discovery').toString().toLowerCase();
  const fill = DEAL_STAGE_FILL_CLASS[key] || DEAL_STAGE_FILL_CLASS.discovery;
  return {
    className: `${SELECT_BASE_CLASS} ${fill}`,
    chevronClassName: 'text-current opacity-60',
  };
}

export function crmAccountTableSelectFillProps(status) {
  const key = (status || 'ACTIVE').toString().toUpperCase();
  const fill = ACCOUNT_STATUS_FILL_CLASS[key] || ACCOUNT_STATUS_FILL_CLASS.ACTIVE;
  return {
    className: `${SELECT_BASE_CLASS} ${fill}`,
    chevronClassName: 'text-current opacity-60',
  };
}

export function crmPmTaskTableSelectFillProps(status) {
  const key = (status || 'SCHEDULED').toString().toUpperCase();
  const variant = PM_TASK_STATUS_VARIANT[key] || 'default';
  const fill = PM_VARIANT_FILL_CLASS[variant] || PM_VARIANT_FILL_CLASS.default;
  return {
    className: `${SELECT_BASE_CLASS} ${fill}`,
    chevronClassName: 'text-current opacity-60',
  };
}

export function crmProjectTableSelectFillProps(status) {
  const key = (status || 'PLANNING').toString().toUpperCase();
  const variant = PROJECT_STATUS_VARIANT[key] || 'default';
  const fill = PM_VARIANT_FILL_CLASS[variant] || PM_VARIANT_FILL_CLASS.default;
  return {
    className: `${SELECT_BASE_CLASS} ${fill}`,
    chevronClassName: 'text-current opacity-60',
  };
}

export function crmProposalTableSelectFillProps(status) {
  const key = (status || 'DRAFT').toString().toUpperCase();
  const fill = PROPOSAL_STATUS_FILL_CLASS[key] || PROPOSAL_STATUS_FILL_CLASS.DRAFT;
  return {
    className: `${SELECT_BASE_CLASS} ${fill}`,
    chevronClassName: 'text-current opacity-60',
  };
}

export function crmInvoiceTableSelectFillProps(status) {
  const key = (status || 'DRAFT').toString().toUpperCase();
  const fill = INVOICE_STATUS_FILL_CLASS[key] || INVOICE_STATUS_FILL_CLASS.DRAFT;
  return {
    className: `${SELECT_BASE_CLASS} ${fill}`,
    chevronClassName: 'text-current opacity-60',
  };
}

function isLeadConverted(company) {
  const status = (company?.status || '').toString().toUpperCase();
  return status === 'CLIENT' || status === 'CONVERTED' || Boolean(company?.convertedAccount);
}

function taskStatusBadgeVariant(status) {
  const s = (status || 'SCHEDULED').toUpperCase();
  if (s === 'COMPLETED') return 'completed';
  if (s === 'CANCELLED') return 'cancelled';
  if (s === 'OVERDUE') return 'danger';
  if (s === 'IN_PROGRESS') return 'active';
  if (s === 'INTERNAL_REVIEW') return 'warning';
  if (s === 'ON_HOLD') return 'pending';
  return 'pending';
}

function dealStageBadgeVariant(stage) {
  const s = String(stage ?? 'discovery').toLowerCase();
  if (s.includes('won')) return 'completed';
  if (s.includes('lost')) return 'danger';
  if (s.includes('negotiation') || s.includes('proposal')) return 'active';
  return 'pending';
}

function taskStatusLabel(status, options) {
  const s = (status || 'SCHEDULED').toUpperCase();
  const fromOptions = options?.find((o) => o.value === s)?.label;
  return fromOptions ?? s.replace(/_/g, ' ');
}

/** Read-only task status badge (CRM tables). */
export function TableCellTaskStatus({ status, className, compact = false, options }) {
  const s = (status || 'SCHEDULED').toUpperCase();
  return (
    <Badge
      variant={taskStatusBadgeVariant(s)}
      className={clsx(
        'whitespace-nowrap font-semibold uppercase',
        compact ? 'text-[10px]' : 'text-xs',
        className
      )}
    >
      {taskStatusLabel(s, options)}
    </Badge>
  );
}

function projectStatusBadgeVariant(status) {
  const s = (status || 'PLANNING').toUpperCase();
  const variant = PROJECT_STATUS_VARIANT[s] || 'default';
  if (variant === 'success') return 'completed';
  if (variant === 'danger') return 'danger';
  if (variant === 'warning' || variant === 'orange') return 'active';
  if (variant === 'purple') return 'warning';
  if (variant === 'cyan') return 'active';
  return 'pending';
}

/** Read-only project status badge (PM tables). */
export function TableCellProjectStatus({ status, className, compact = false }) {
  const s = (status || 'PLANNING').toUpperCase();
  const label =
    PROJECT_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s.replace(/_/g, ' ');
  return (
    <Badge
      variant={projectStatusBadgeVariant(s)}
      className={clsx(
        'whitespace-nowrap font-semibold uppercase',
        compact ? 'text-[10px]' : 'text-xs',
        className
      )}
    >
      {label}
    </Badge>
  );
}

/** Read-only deal stage badge (CRM tables). */
export function TableCellDealStage({ stage, className, compact = false }) {
  const s = String(stage ?? 'discovery').toLowerCase();
  const label = DEAL_STAGE_OPTIONS.find((o) => o.value === s)?.label ?? s.replace(/_/g, ' ');
  return (
    <Badge
      variant={dealStageBadgeVariant(s)}
      className={clsx(
        'whitespace-nowrap font-semibold capitalize',
        compact ? 'text-[10px]' : 'text-xs',
        className
      )}
    >
      {label}
    </Badge>
  );
}

export function TableCellLeadStatusSelect({
  company,
  onStatusChange,
  saving = false,
  canEdit = true,
  containerClassName = 'min-w-[150px]',
}) {
  if (!company || isLeadConverted(company) || !canEdit || !onStatusChange) {
    return <TableCellLeadStatus company={company} />;
  }

  const status = (company.status || 'NEW').toString().toUpperCase();
  const companyId = company.id ?? company.documentId;

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Select
        value={status}
        options={LEAD_STATUS_OPTIONS}
        onChange={(next) => onStatusChange(companyId, next)}
        disabled={saving}
        allowEmpty={false}
        {...crmLeadTableSelectFillProps(status)}
        containerClassName={containerClassName}
        placeholder="Status"
      />
    </div>
  );
}

export function TableCellTaskStatusSelect({
  status,
  onStatusChange,
  saving = false,
  canEdit = true,
  containerClassName = 'min-w-[150px]',
  options = TASK_STATUS_OPTIONS,
  fillStyle = 'crm',
}) {
  if (!canEdit || !onStatusChange) {
    return <TableCellTaskStatus status={status} options={options} />;
  }

  const normalized = (status || 'SCHEDULED').toString().toUpperCase();
  const fillProps =
    fillStyle === 'pm'
      ? crmPmTaskTableSelectFillProps(normalized)
      : crmTaskTableSelectFillProps(normalized);

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Select
        value={normalized}
        options={options}
        onChange={onStatusChange}
        disabled={saving}
        allowEmpty={false}
        {...fillProps}
        containerClassName={containerClassName}
        placeholder="Status"
      />
    </div>
  );
}

export function TableCellAccountStatusSelect({
  status,
  onStatusChange,
  saving = false,
  canEdit = true,
  containerClassName = 'min-w-[130px]',
}) {
  if (!canEdit || !onStatusChange) {
    return <TableCellStatusPill status={status} />;
  }

  const normalized = (status || 'ACTIVE').toString().toUpperCase();

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Select
        value={normalized}
        options={ACCOUNT_STATUS_OPTIONS}
        onChange={onStatusChange}
        disabled={saving}
        allowEmpty={false}
        {...crmAccountTableSelectFillProps(normalized)}
        containerClassName={containerClassName}
        placeholder="Status"
      />
    </div>
  );
}

export function TableCellProjectStatusSelect({
  status,
  onStatusChange,
  saving = false,
  canEdit = true,
  containerClassName = 'min-w-[150px]',
}) {
  if (!canEdit || !onStatusChange) {
    return <TableCellProjectStatus status={status} />;
  }

  const normalized = (status || 'PLANNING').toString().toUpperCase();

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Select
        value={normalized}
        options={PROJECT_STATUS_OPTIONS}
        onChange={onStatusChange}
        disabled={saving}
        allowEmpty={false}
        {...crmProjectTableSelectFillProps(normalized)}
        containerClassName={containerClassName}
        placeholder="Status"
      />
    </div>
  );
}

function proposalStatusLabel(status) {
  const key = (status || 'DRAFT').toString().toUpperCase();
  return PROPOSAL_STATUS_OPTIONS.find((o) => o.value === key)?.label ?? key;
}

function invoiceStatusLabel(status) {
  const key = (status || 'DRAFT').toString().toUpperCase();
  return INVOICE_STATUS_OPTIONS.find((o) => o.value === key)?.label ?? key;
}

/** Read-only proposal status badge (CRM tables). */
export function TableCellProposalStatus({ status, className, compact = false }) {
  const key = (status || 'DRAFT').toString().toUpperCase();
  const variant = PROPOSAL_STATUS_BADGE_VARIANT[key] || 'default';
  return (
    <Badge
      variant={variant}
      className={clsx(
        'whitespace-nowrap font-semibold uppercase',
        compact ? 'text-[10px]' : 'text-xs',
        className
      )}
    >
      {proposalStatusLabel(key)}
    </Badge>
  );
}

/** Read-only invoice status badge (CRM tables). */
export function TableCellInvoiceStatus({ status, className, compact = false }) {
  const key = (status || 'DRAFT').toString().toUpperCase();
  const variant = INVOICE_STATUS_BADGE_VARIANT[key] || 'default';
  return (
    <Badge
      variant={variant}
      className={clsx(
        'whitespace-nowrap font-semibold uppercase',
        compact ? 'text-[10px]' : 'text-xs',
        className
      )}
    >
      {invoiceStatusLabel(key)}
    </Badge>
  );
}

export function TableCellProposalStatusSelect({
  proposal,
  status,
  onStatusChange,
  saving = false,
  canEdit = true,
  containerClassName = 'w-full min-w-0 max-w-full',
}) {
  const record = proposal ?? (status != null ? { status } : null);
  const normalized = (record?.status || status || 'DRAFT').toString().toUpperCase();
  const recordId = record?.id ?? record?.documentId;

  if (!record || !canEdit || !onStatusChange || recordId == null) {
    return <TableCellProposalStatus status={normalized} compact />;
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Select
        value={normalized}
        options={PROPOSAL_STATUS_OPTIONS}
        onChange={(next) => onStatusChange(recordId, next)}
        disabled={saving}
        allowEmpty={false}
        {...crmProposalTableSelectFillProps(normalized)}
        containerClassName={containerClassName}
        placeholder="Status"
      />
    </div>
  );
}

export function TableCellInvoiceStatusSelect({
  invoice,
  status,
  onStatusChange,
  saving = false,
  canEdit = true,
  containerClassName = 'w-full min-w-0 max-w-full',
}) {
  const record = invoice ?? (status != null ? { status } : null);
  const normalized = (record?.status || status || 'DRAFT').toString().toUpperCase();
  const recordId = record?.id ?? record?.documentId;

  if (!record || !canEdit || !onStatusChange || recordId == null) {
    return <TableCellInvoiceStatus status={normalized} compact />;
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Select
        value={normalized}
        options={INVOICE_STATUS_OPTIONS}
        onChange={(next) => onStatusChange(recordId, next)}
        disabled={saving}
        allowEmpty={false}
        {...crmInvoiceTableSelectFillProps(normalized)}
        containerClassName={containerClassName}
        placeholder="Status"
      />
    </div>
  );
}

export function TableCellDealStageSelect({
  stage,
  onStageChange,
  saving = false,
  canEdit = true,
  containerClassName = 'min-w-[140px]',
}) {
  if (!canEdit || !onStageChange) {
    return <TableCellDealStage stage={stage} />;
  }

  const normalized = (stage || 'discovery').toString().toLowerCase();

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Select
        value={normalized}
        options={DEAL_STAGE_OPTIONS}
        onChange={onStageChange}
        disabled={saving}
        allowEmpty={false}
        {...crmDealStageTableSelectFillProps(normalized)}
        containerClassName={containerClassName}
        placeholder="Stage"
      />
    </div>
  );
}

const actionLinkClass =
  'inline-flex rounded-md p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300';

/** View / edit icon actions aligned for CRM table action columns. */
export function TableCellCrmRowActions({
  viewHref,
  editHref,
  onView,
  onEdit,
  viewTitle = 'View',
  editTitle = 'Edit',
  minWidthClass = 'min-w-[88px]',
  viewClassName = `${actionLinkClass} text-orange-600 hover:bg-orange-50`,
  editClassName = `${actionLinkClass} text-emerald-600 hover:bg-emerald-50`,
}) {
  return (
    <div
      className={clsx('flex items-center justify-end gap-0.5', minWidthClass)}
      onClick={(e) => e.stopPropagation()}
    >
      {viewHref ? (
        <Link href={viewHref} className={viewClassName} title={viewTitle} aria-label={viewTitle}>
          <Eye className="h-4 w-4" />
        </Link>
      ) : onView ? (
        <button type="button" className={viewClassName} title={viewTitle} aria-label={viewTitle} onClick={onView}>
          <Eye className="h-4 w-4" />
        </button>
      ) : null}
      {editHref ? (
        <Link href={editHref} className={editClassName} title={editTitle} aria-label={editTitle}>
          <Pencil className="h-4 w-4" />
        </Link>
      ) : onEdit ? (
        <button type="button" className={editClassName} title={editTitle} aria-label={editTitle} onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

/** Standard actions column config for CRM tables (fixes header/cell alignment). */
export function crmTableActionsColumn(getActions, { width = 100, label = 'Actions' } = {}) {
  return {
    key: 'actions',
    label,
    fixed: true,
    width,
    headerClassName: 'text-right',
    className: 'text-right',
    render: (_, row) => {
      const props = getActions(row) || {};
      return <TableCellCrmRowActions {...props} />;
    },
  };
}
