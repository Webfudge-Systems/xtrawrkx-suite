/** Search field — Books list toolbars & dashboard widgets (dark-aware via CSS vars). */
export const booksToolbarSearchInputClassName =
  'min-w-[16rem] w-64 rounded-full border border-[color:var(--books-input-border,rgba(0,0,0,0.1))] bg-[var(--books-input-bg,#252830)] py-2.5 pl-10 pr-4 text-sm text-[var(--books-input-text,#f0f0f0)] shadow-sm transition-all duration-300 placeholder:text-[var(--books-input-placeholder,#6b7280)] focus:border-orange-400/70 focus:ring-2 focus:ring-orange-500/25'

export const booksToolbarFilterButtonClassName =
  'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors border-[color:var(--books-border,rgba(255,255,255,0.1))] bg-[var(--books-bg-elevated,#252830)] text-[var(--books-text-secondary,#9ca3af)] hover:border-orange-400/50 hover:bg-[var(--books-orange-bg,rgba(234,88,12,0.12))] hover:text-[var(--books-orange-text,#fb923c)]'

/** Icon-only actions on Books list bars (+, filter, export, columns). */
export const booksToolbarIconButtonClassName =
  'flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--books-border,rgba(255,255,255,0.12))] bg-[var(--books-bg-elevated,#252830)] text-[var(--books-text-secondary,#9ca3af)] shadow-sm transition-colors hover:border-orange-400/50 hover:bg-[var(--books-orange-bg,rgba(234,88,12,0.12))] hover:text-[var(--books-orange-text,#fb923c)]'
