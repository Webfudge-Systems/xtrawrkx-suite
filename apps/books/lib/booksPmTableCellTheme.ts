/**
 * PM production–aligned table cell tokens for Books list tables.
 * Uses `--books-pm-*` CSS variables (see globals.css) — works in light/dark without Tailwind `dark:` purge issues.
 */

const actionLinkClass =
  'inline-flex rounded-md p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300'

const badgeBase =
  'inline-flex rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide'

export const booksPmTableCellTheme = {
  textPrimary: 'text-[var(--books-text-primary)]',
  textSecondary: 'text-[var(--books-text-secondary)]',
  textMuted: 'text-[var(--books-text-tertiary)]',
  textBody: 'text-[var(--books-pm-table-body)]',
  title: 'truncate font-medium text-[var(--books-text-primary)]',
  subtitle: 'truncate text-sm text-[var(--books-text-secondary)]',
  createdDate: 'whitespace-nowrap text-sm font-semibold text-[var(--books-text-primary)]',
  createdRelative: 'text-sm font-normal text-[var(--books-text-secondary)]',
  dateOnly: 'min-w-[120px] whitespace-nowrap text-sm text-[var(--books-pm-table-body)]',
  emphasized: 'whitespace-nowrap font-semibold text-[var(--books-text-primary)]',
  body: 'text-sm text-[var(--books-pm-table-body)]',
  avatar: 'flex-shrink-0 bg-[var(--books-pm-avatar-bg)] text-[var(--books-pm-avatar-text)]',
  orangePill: `${badgeBase} border-[color:var(--books-pm-badge-orange-border)] bg-[var(--books-pm-badge-orange-bg)] text-[var(--books-pm-badge-orange-text)]`,
  statusActive: `${badgeBase} border-[color:var(--books-pm-badge-active-border)] bg-[var(--books-pm-badge-active-bg)] text-[var(--books-pm-badge-active-text)]`,
  statusDraft: `${badgeBase} border-[color:var(--books-pm-badge-neutral-border)] bg-[var(--books-pm-badge-neutral-bg)] text-[var(--books-pm-badge-neutral-text)]`,
  actionView: `${actionLinkClass} text-[var(--books-pm-action-view)] hover:bg-[var(--books-pm-action-view-hover)]`,
  actionEdit: `${actionLinkClass} text-[var(--books-pm-action-edit)] hover:bg-[var(--books-pm-action-edit-hover)]`,
  actionDelete: `${actionLinkClass} text-[var(--books-pm-action-delete)] hover:bg-[var(--books-pm-action-delete-hover)] disabled:opacity-50`,
} as const
