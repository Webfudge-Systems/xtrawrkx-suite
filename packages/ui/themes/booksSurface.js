/**
 * Books app surface tokens — CSS variables from apps/books globals.
 * Used by shared Card, KPICard, Table, and list chrome when `surface` / `theme` is `books`.
 */

/** Elevated list-table shell (no inner padding). */
export const booksListTableCardClassName =
  'overflow-hidden rounded-xl border border-[color:var(--books-border,rgba(0,0,0,0.08))] !bg-[var(--books-bg-card,#ffffff)] p-0 shadow-[0_3px_16px_rgba(15,23,42,0.10),0_2px_5px_rgba(15,23,42,0.06)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.55),0_2px_10px_rgba(0,0,0,0.38)]'

/** Dashboard / list KPI tile surface. */
export const booksKpiCardClassName =
  'relative overflow-hidden p-6 pb-0 pr-0 !bg-[var(--books-bg-card,#ffffff)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.55),0_2px_10px_rgba(0,0,0,0.38)]'

/** Generic elevated card with Books dark-mode shadow. */
export const booksElevatedCardClassName =
  '!bg-[var(--books-bg-card,#ffffff)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.55),0_2px_10px_rgba(0,0,0,0.38)]'

/** Pill tab track shell (shared by stretch + hug layouts). */
const booksPillTrackShell =
  'flex min-h-[48px] items-center gap-1 overflow-x-auto rounded-full border border-[color:var(--books-border,rgba(255,255,255,0.12))] bg-[var(--books-bg-elevated,#252830)] px-2 py-1.5 shadow-[var(--books-shell-shadow,0_4px_28px_rgba(0,0,0,0.35))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

/** List toolbars — track grows with the row. */
export const booksPillTrackClassName = `${booksPillTrackShell} min-w-0 flex-1`

/** Header sub-nav — track hugs tab labels with even left/right inset. */
export const booksPillTrackHugClassName = `${booksPillTrackShell} w-fit max-w-full shrink-0`
