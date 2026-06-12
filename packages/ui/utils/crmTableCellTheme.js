const actionLinkClass =
  'inline-flex rounded-md p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300';

const defaultTheme = {
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-500',
  textMuted: 'text-gray-400',
  textBody: 'text-gray-600',
  iconMuted: 'text-gray-400',
  title: 'truncate font-medium text-gray-900',
  subtitle: 'truncate text-sm text-gray-500',
  createdDate: 'whitespace-nowrap text-sm font-semibold text-gray-900',
  createdRelative: 'text-sm font-normal text-gray-500',
  dateOnly: 'min-w-[120px] whitespace-nowrap text-sm text-gray-600',
  emphasized: 'whitespace-nowrap font-semibold text-gray-900',
  body: 'text-sm text-gray-600',
  actionView: `${actionLinkClass} text-orange-600 hover:bg-orange-50`,
  actionEdit: `${actionLinkClass} text-emerald-600 hover:bg-emerald-50`,
  actionDelete: `${actionLinkClass} text-red-600 hover:bg-red-50 disabled:opacity-50`,
  avatar: 'flex-shrink-0 bg-blue-100 text-blue-600',
  statusActive:
    'inline-flex rounded-lg border border-emerald-500 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700',
  statusDraft:
    'inline-flex rounded-lg border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700',
  orangePill:
    'inline-flex rounded-lg border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-800',
};

const booksTheme = {
  textPrimary: 'text-[var(--books-text-primary,#111827)]',
  textSecondary: 'text-[var(--books-text-secondary,#6b7280)]',
  textMuted: 'text-[var(--books-text-tertiary,#9ca3af)]',
  textBody: 'text-[var(--books-text-secondary,#6b7280)]',
  iconMuted: 'text-[var(--books-text-tertiary,#9ca3af)]',
  title: 'truncate font-medium text-[var(--books-text-primary,#111827)]',
  subtitle: 'truncate text-sm text-[var(--books-text-secondary,#6b7280)]',
  createdDate: 'whitespace-nowrap text-sm font-semibold text-[var(--books-text-primary,#111827)]',
  createdRelative: 'text-sm font-normal text-[var(--books-text-secondary,#6b7280)]',
  dateOnly: 'min-w-[120px] whitespace-nowrap text-sm text-[var(--books-text-secondary,#6b7280)]',
  emphasized: 'whitespace-nowrap font-semibold text-[var(--books-text-primary,#111827)]',
  body: 'text-sm text-[var(--books-text-secondary,#6b7280)]',
  actionView: `${actionLinkClass} text-[var(--books-orange-text,#f97316)] hover:bg-[var(--books-orange-bg,rgba(249,115,22,0.12))]`,
  actionEdit: `${actionLinkClass} text-emerald-500 hover:bg-emerald-500/10`,
  actionDelete: `${actionLinkClass} text-red-400 hover:bg-red-500/10 disabled:opacity-50`,
  avatar: 'flex-shrink-0 bg-[var(--books-orange-bg,rgba(249,115,22,0.15))] text-[var(--books-orange-text,#f97316)]',
  statusActive:
    'inline-flex rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-400',
  statusDraft:
    'inline-flex rounded-lg border border-[color:var(--books-border,rgba(255,255,255,0.12))] bg-[var(--books-surface-muted,#2a2e38)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--books-text-secondary,#9ca3af)]',
  orangePill:
    'inline-flex rounded-lg border border-[color:var(--books-orange-border,rgba(249,115,22,0.35))] bg-[var(--books-orange-bg,rgba(249,115,22,0.12))] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--books-orange-text,#f97316)]',
};

/** Shared CRM table cell tokens — `books` uses `--books-*` CSS variables for light/dark. */
export function crmTableCellTheme(theme = 'default') {
  return theme === 'books' ? booksTheme : defaultTheme;
}
