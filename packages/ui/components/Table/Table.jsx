'use client'

import { Fragment, useCallback, useMemo, useRef } from 'react'
import { clsx } from 'clsx'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

const DEFAULT_MIN_COL_WIDTH = 72

function parseWidthPx(width) {
  if (typeof width === 'number' && Number.isFinite(width)) return width
  if (typeof width === 'string') {
    const m = width.match(/^(\d+(?:\.\d+)?)px$/)
    if (m) return Number(m[1])
  }
  return null
}

function columnKey(column, index) {
  return column.key ?? String(index)
}

function widthStyle(px, { resizable = false, flexGrow = false } = {}) {
  if (flexGrow && resizable) {
    if (px) return { minWidth: px, width: 'auto' }
    return { minWidth: DEFAULT_MIN_COL_WIDTH, width: 'auto' }
  }
  if (!px) return {}
  if (resizable) {
    return { width: px, minWidth: px }
  }
  return {
    width: px,
    minWidth: px,
    maxWidth: px,
  }
}

function SortHeaderIndicator({ direction, priority }) {
  return (
    <span className="ml-1.5 inline-flex shrink-0 items-center gap-0.5">
      {!direction ? (
        <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 opacity-0 transition-opacity group-hover/th:opacity-100" aria-hidden />
      ) : direction === 'asc' ? (
        <ArrowUp className="h-3.5 w-3.5 text-orange-600" aria-hidden />
      ) : (
        <ArrowDown className="h-3.5 w-3.5 text-orange-600" aria-hidden />
      )}
      {priority != null && priority > 1 ? (
        <span
          className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-orange-100 px-1 text-[10px] font-bold leading-none text-orange-800"
          title={`Sort priority ${priority}`}
        >
          {priority}
        </span>
      ) : null}
    </span>
  )
}

export function Table({
  columns = [],
  data = [],
  className,
  headerClassName,
  bodyClassName,
  rowClassName,
  getRowClassName,
  onRowClick,
  /** Optional row rendered immediately after each data row (e.g. expandable detail). */
  renderAfterRow,
  keyField = 'id',
  variant = 'default',
  /** Enable drag-to-resize on column header edges. */
  resizableColumns = false,
  /** Pixel widths keyed by column `key` (controlled). */
  columnWidths = {},
  onColumnWidthsChange,
  /** Called once when a resize drag ends (useful for persisting without writing every mousemove). */
  onColumnResizeEnd,
  minColumnWidth = DEFAULT_MIN_COL_WIDTH,
  ...props
}) {
  const resizingRef = useRef(null)
  const widthsRef = useRef(columnWidths)
  widthsRef.current = columnWidths

  const variants = {
    default: {
      container: 'overflow-x-auto bg-white',
      table: 'min-w-full divide-y divide-gray-200',
      header: 'bg-gray-50',
      headerCell:
        'px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
      body: 'bg-white divide-y divide-gray-100',
      row: 'hover:bg-gray-50 transition-colors duration-150',
      cell: 'px-6 py-4 text-sm text-gray-900',
    },
    modern: {
      container: 'overflow-x-auto bg-white border border-gray-200 rounded-xl',
      table: 'min-w-full',
      header: 'bg-gray-50 border-b border-gray-200',
      headerCell: 'px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide',
      body: 'bg-white divide-y divide-gray-100',
      row: 'hover:bg-blue-50/50 transition-all duration-200 group',
      cell: 'px-6 py-4 text-sm text-gray-700 group-hover:text-gray-900',
    },
    compact: {
      container: 'overflow-x-auto bg-white',
      table: 'min-w-full',
      header: 'bg-white border-b-2 border-gray-200',
      headerCell: 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase',
      body: 'bg-white divide-y divide-gray-100',
      row: 'hover:bg-gray-50 transition-colors',
      cell: 'px-4 py-3 text-sm text-gray-700',
    },
    /** Same as modern but no outer border/radius — use inside `rounded-xl border` shell with `TableEmptyBelow`. */
    modernEmbedded: {
      container: 'overflow-x-auto bg-white',
      table: 'min-w-full',
      header: 'bg-gray-50 border-b border-gray-200',
      headerCell: 'px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wide',
      body: 'bg-white divide-y divide-gray-100',
      row: 'hover:bg-blue-50/50 transition-all duration-200 group',
      cell: 'px-6 py-4 text-sm text-gray-700 group-hover:text-gray-900',
    },
    /** Books list pages — `--books-*` tokens, inside `Card` with `surface="books"`. */
    books: {
      container: 'overflow-x-auto min-w-full bg-[var(--books-bg-card,#ffffff)]',
      table: 'min-w-full',
      header: 'bg-[var(--books-surface-muted,#f5f5f5)] border-b border-[color:var(--books-border,rgba(0,0,0,0.08))]',
      headerCell:
        'px-6 py-4 text-left text-xs font-bold text-[var(--books-text-secondary,#4b5563)] uppercase tracking-wide',
      body: 'divide-y divide-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-bg-card,#ffffff)]',
      row: 'hover:bg-[var(--books-bg-elevated,#f9fafb)] transition-all duration-200 group',
      cell: 'px-6 py-4 text-sm text-[var(--books-text-primary,#111827)] group-hover:text-[var(--books-text-primary,#111827)]',
    },
    /** Books table inside elevated card (same tokens, no min-width on container). */
    booksEmbedded: {
      container: 'overflow-x-auto bg-[var(--books-bg-card,#ffffff)]',
      table: 'min-w-full',
      header: 'bg-[var(--books-surface-muted,#f5f5f5)] border-b border-[color:var(--books-border,rgba(0,0,0,0.08))]',
      headerCell:
        'px-6 py-4 text-left text-xs font-bold text-[var(--books-text-secondary,#4b5563)] uppercase tracking-wide',
      body: 'divide-y divide-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-bg-card,#ffffff)]',
      row: 'hover:bg-[var(--books-bg-elevated,#f9fafb)] transition-all duration-200 group',
      cell: 'px-6 py-4 text-sm text-[var(--books-text-primary,#111827)] group-hover:text-[var(--books-text-primary,#111827)]',
    },
  }

  const styles = variants[variant] || variants.default

  const resolveWidthPx = useCallback(
    (column, index) => {
      const key = columnKey(column, index)
      const fromState = columnWidths[key]
      if (typeof fromState === 'number' && Number.isFinite(fromState)) return fromState
      return parseWidthPx(column.width)
    },
    [columnWidths]
  )

  const setColumnWidth = useCallback(
    (key, px) => {
      if (!onColumnWidthsChange) return
      onColumnWidthsChange({ ...columnWidths, [key]: px })
    },
    [columnWidths, onColumnWidthsChange]
  )

  const startResize = useCallback(
    (event, column, index, thEl) => {
      if (!resizableColumns || column.resizable === false) return
      event.preventDefault()
      event.stopPropagation()

      const key = columnKey(column, index)
      const colMin = column.minWidth ?? minColumnWidth
      const startX = event.clientX
      const startW = resolveWidthPx(column, index) ?? thEl.offsetWidth

      resizingRef.current = { key, startX, startW, colMin }

      const onMove = (ev) => {
        const r = resizingRef.current
        if (!r) return
        const delta = ev.clientX - r.startX
        const next = Math.max(r.colMin, Math.round(r.startW + delta))
        setColumnWidth(r.key, next)
      }

      const onUp = () => {
        resizingRef.current = null
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        onColumnResizeEnd?.(widthsRef.current)
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [minColumnWidth, onColumnResizeEnd, resizableColumns, resolveWidthPx, setColumnWidth]
  )

  const tableMinWidthPx = useMemo(() => {
    if (!resizableColumns || columns.length === 0) return undefined
    return columns.reduce((sum, column, index) => {
      if (column.flexGrow) return sum + (resolveWidthPx(column, index) ?? DEFAULT_MIN_COL_WIDTH)
      const w = resolveWidthPx(column, index)
      return sum + (w ?? 120)
    }, 0)
  }, [columns, resizableColumns, resolveWidthPx])

  return (
    <div className={clsx(styles.container, 'transition-shadow duration-300')}>
      <table
        className={clsx(styles.table, resizableColumns && 'table-fixed')}
        style={
          tableMinWidthPx
            ? { minWidth: tableMinWidthPx, width: '100%' }
            : undefined
        }
        {...props}
      >
        <thead className={clsx(styles.header, headerClassName)}>
          <tr>
            {columns.map((column, index) => {
              const key = columnKey(column, index)
              const title = column.title || column.label || ''
              const isSortable = Boolean(column.sortable && column.onHeaderClick)
              const px = resolveWidthPx(column, index)
              const canResize = resizableColumns && column.resizable !== false
              const colWidthStyle = widthStyle(px, {
                resizable: resizableColumns,
                flexGrow: Boolean(column.flexGrow),
              })

              return (
                <th
                  key={key}
                  className={clsx(
                    styles.headerCell,
                    isSortable && 'group/th',
                    canResize && 'relative select-none',
                    column.headerClassName
                  )}
                  style={colWidthStyle}
                  aria-sort={
                    column.sortDirection === 'asc'
                      ? 'ascending'
                      : column.sortDirection === 'desc'
                        ? 'descending'
                        : isSortable
                          ? 'none'
                          : undefined
                  }
                >
                  {isSortable ? (
                    <button
                      type="button"
                      className={clsx(
                        'inline-flex max-w-full items-center text-left uppercase tracking-wide transition-colors hover:text-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 rounded-sm',
                        canResize && 'pr-2'
                      )}
                      onClick={(event) => column.onHeaderClick?.(event)}
                      title="Click to sort. Shift+click to add another sort column."
                    >
                      <span className="truncate">{title}</span>
                      <SortHeaderIndicator
                        direction={column.sortDirection}
                        priority={column.sortPriority}
                      />
                    </button>
                  ) : (
                    <span className={clsx(canResize && 'block truncate pr-2')}>{title}</span>
                  )}
                  {canResize ? (
                    <span
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Resize ${title || 'column'}`}
                      className="absolute right-0 top-0 z-10 h-full w-1.5 translate-x-1/2 cursor-col-resize touch-none before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-transparent hover:before:bg-orange-400 active:before:bg-orange-500"
                      onMouseDown={(event) =>
                        startResize(event, column, index, event.currentTarget.parentElement)
                      }
                      onDoubleClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        const def = parseWidthPx(column.defaultWidth)
                        if (def) setColumnWidth(key, def)
                      }}
                    />
                  ) : null}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className={clsx(styles.body, bodyClassName)}>
          {data.map((row, rowIndex) => {
            const rk = row[keyField] ?? row.id ?? rowIndex
            return (
              <Fragment key={rk}>
                <tr
                  className={clsx(
                    styles.row,
                    onRowClick && 'cursor-pointer',
                    rowClassName,
                    getRowClassName?.(row, rowIndex)
                  )}
                  onClick={() => onRowClick && onRowClick(row, rowIndex)}
                >
                  {columns.map((column, colIndex) => {
                    const cellPx = resolveWidthPx(column, colIndex)
                    const clipCell = resizableColumns && column.overflow !== 'visible'
                    return (
                      <td
                        key={columnKey(column, colIndex)}
                        className={clsx(
                          styles.cell,
                          clipCell && 'overflow-hidden',
                          column.className
                        )}
                        style={widthStyle(cellPx, {
                          resizable: resizableColumns,
                          flexGrow: Boolean(column.flexGrow),
                        })}
                      >
                        {column.render
                          ? column.render(row[column.key], row, rowIndex)
                          : row[column.key]}
                      </td>
                    )
                  })}
                </tr>
                {renderAfterRow ? renderAfterRow(row, rowIndex) : null}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default Table
