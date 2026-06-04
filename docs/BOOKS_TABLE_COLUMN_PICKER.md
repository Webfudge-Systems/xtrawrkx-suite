# Books Table Column Picker (CRM Eye Icon)

## Summary
The **eye** icon on Sales, Purchases, and Accountant list toolbars now opens a **Columns** dropdown aligned with CRM: checkboxes to show/hide columns, drag handles to reorder (first column fixed at top), **Reset to default**, and preferences stored in `localStorage` per route.

## Scope
- `apps/books/app/_components/BooksTableColumnPicker.tsx` — `useBooksTableColumnPicker` hook + dropdown UI (`Button`, native checkboxes styled like CRM)
- `apps/books/app/sales/_components/BooksSalesListShell.tsx`
- `apps/books/app/purchases/_components/BooksPurchasesListShell.tsx`
- `apps/books/app/accountant/_components/BooksAccountantListShell.tsx`

## Storage keys
- Pattern: `books.table:<pathname>` with suffixes `.visibility` and `.order`

## Notes
- At least one column must remain visible (last toggle is ignored if it would hide everything).
- CSV export uses the **currently visible** column order.
