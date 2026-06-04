import { clsx } from 'clsx'

/**
 * CRM-style "Showing N results" line above a data table.
 */
export function TableResultsCount({ count, className, theme = 'default' }) {
  const isBooks = theme === 'books'
  return (
    <div
      className={clsx(
        'text-sm',
        isBooks ? 'text-[var(--books-text-secondary,#6b7280)]' : 'text-gray-600',
        className
      )}
    >
      Showing{' '}
      <span
        className={clsx(
          'font-semibold',
          isBooks ? 'text-[var(--books-text-primary,#111827)]' : 'text-gray-900'
        )}
      >
        {count}
      </span>{' '}
      result{count !== 1 ? 's' : ''}
    </div>
  )
}

/**
 * Empty block below a `Table` (border-t), matching CRM list pages (e.g. lead companies).
 */
export function TableEmptyBelow({ icon: Icon, title, description, action, className, theme = 'default' }) {
  const isBooks = theme === 'books'
  return (
    <div className={clsx('bg-transparent p-12 text-center', className)}>
      {Icon ? (
        <div
          className={clsx(
            'mx-auto mb-4 flex h-14 w-14 items-center justify-center',
            isBooks ? 'text-[var(--books-text-tertiary,#9ca3af)]' : 'text-gray-400'
          )}
        >
          <Icon className="h-10 w-10 opacity-90" strokeWidth={1.25} aria-hidden />
        </div>
      ) : null}
      {title ? (
        <h3
          className={clsx(
            'text-base font-semibold',
            isBooks ? 'text-[var(--books-text-primary,#111827)]' : 'text-gray-900'
          )}
        >
          {title}
        </h3>
      ) : null}
      {description ? (
        <p
          className={clsx(
            'mx-auto mt-1.5 max-w-md text-sm leading-relaxed',
            isBooks ? 'text-[var(--books-text-secondary,#6b7280)]' : 'text-gray-500'
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
