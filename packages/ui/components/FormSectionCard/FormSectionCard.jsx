import { clsx } from 'clsx'
import { Card } from '../Card'

export function FormSectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  cardClassName,
  iconContainerClassName,
  iconClassName,
  headerClassName,
  headerAction,
}) {
  return (
    <Card
      variant="elevated"
      padding={false}
      className={clsx('rounded-2xl p-6', cardClassName, className)}
    >
      <div
        className={clsx(
          'flex items-start justify-between gap-3',
          headerAction ? 'mb-4' : 'mb-6',
          headerClassName
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {Icon ? (
            <div
              className={clsx(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary shadow-sm',
                iconContainerClassName
              )}
            >
              <Icon className={clsx('h-5 w-5 text-white', iconClassName)} />
            </div>
          ) : null}
          <div className="min-w-0">
            {title ? <h3 className="text-lg font-semibold text-gray-900">{title}</h3> : null}
            {description ? <p className="text-sm text-gray-600">{description}</p> : null}
          </div>
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      {children}
    </Card>
  )
}

export default FormSectionCard
