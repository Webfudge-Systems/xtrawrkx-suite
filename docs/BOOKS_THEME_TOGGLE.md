# Books light / dark theme

## Summary

Books supports a persisted light/dark theme via `localStorage` key `books-theme`, `class="dark"` on `<html>`, and CSS custom properties in `apps/books/app/globals.css`. There is no `next-themes` dependency; `BooksThemeProvider` syncs React state with the DOM.

## Scope

- **Apps:** `apps/books` (layout, globals, Tailwind `darkMode: 'class'`, sidebar toggle, shell colors).
- **Packages:** `packages/ui` — `TabsWithActions` adds optional `variant="booksModern"` + `searchInputClassName` for Sales/Purchases/Accountant list toolbars (CRM `modern` unchanged).
- **`packages/ui/book-components`:** Dashboard widgets plus **Books list primitives** — `BooksKPICard`, `BooksDataTable`, `BooksListTableCard`, `BooksTableResultsCount`, `BooksTableEmptyBelow`, `booksToolbarSearchInputClassName` — all use `--books-*` tokens so list pages match dashboard card surfaces in dark mode.

## Usage

- Toggle: sidebar, above the quick-action (+) button (Sun / Moon, native `title` tooltips; no `Tooltip` export in `@webfudge/ui`).
- FOUC: inline script in `app/layout.tsx` `<head>` applies `dark` before hydration.

## Tokens

See `:root` and `.dark` in `apps/books/app/globals.css` (`--books-bg-page`, `--books-bg-card`, text, borders, inputs, chart helpers, scrollbars).

### Shared chrome (dashboard + sidebar + headers)

- **`--books-shell-radius`** (12px) and **`--books-shell-shadow`** — same elevation recipe as `Card` variant `elevated` (e.g. Total Balance).
- **`.books-shell-surface`** / **`.books-shell-surface--rail`** — **sidebar** vertical rails (full capsule).
- **`.books-shell-surface-pill`** — horizontal capsules for **header**: tab track is separate from **`TopbarTrailing`** (utilities pill = route icons + bell, profile pill = avatar).
- **`TabsWithActions`** `booksModern` and **`pill`** tab track use **`rounded-full`** (stadium/pill bar), same fill and **`--books-shell-shadow`** as dashboard cards.
- **`BooksListTableCard`** uses the same dark-mode shadow scale for parity with those surfaces.
