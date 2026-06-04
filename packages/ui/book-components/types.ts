import type { ReactNode } from 'react'

/** Column definition for Books list tables (`Table` with `variant="books"`). */
export type BooksDataColumn = {
  key: string
  title?: string
  label?: string
  width?: string
  className?: string
  headerClassName?: string
  render?: (value: unknown, row: Record<string, unknown>, rowIndex: number) => ReactNode
}
