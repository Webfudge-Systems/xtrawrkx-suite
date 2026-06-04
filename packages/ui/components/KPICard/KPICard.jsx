import React from 'react'
import { clsx } from 'clsx'
import { Card } from '../Card'
import { booksKpiCardClassName } from '../../themes/booksSurface'

/**
 * KPICard Component
 *
 * A reusable card component for displaying key performance indicators with an icon,
 * title, value, and optional subtitle.
 *
 * @param {string} title - The title/label for the KPI
 * @param {number|string} value - The main value to display
 * @param {string} subtitle - Optional subtitle text (e.g., "5 deals", "No items")
 * @param {string} change - Optional change/trend indicator (e.g., "+12%", "-5%")
 * @param {string} changeType - Type of change: 'increase' or 'decrease'
 * @param {React.Component} icon - Icon component to display (from lucide-react or similar)
 * @param {string} colorScheme - Color scheme: 'orange', 'yellow', 'green', 'red', 'blue', 'purple', 'emerald', 'indigo'
 * @param {string} iconColorScheme - Optional override for the inner icon color
 * @param {string} iconBgColorScheme - Optional override for icon background color
 * @param {function} onClick - Optional click handler for the card
 * @param {string} className - Optional additional CSS classes
 * @param {boolean} compact - Same layout as default with less top/bottom padding and no subtitle/trend footer
 */
const KPICard = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'increase',
  icon: Icon,
  colorScheme = 'blue',
  iconColorScheme = 'orange',
  iconBgColorScheme,
  onClick,
  className = '',
  compact = false,
  /** `books` uses `--books-*` tokens for Books app light/dark surfaces. */
  theme = 'default',
}) => {
  const isBooks = theme === 'books'
  const colorClasses = {
    orange: {
      iconBg: 'bg-brand-primary/10',
      iconColor: 'text-brand-primary',
      dotColor: 'bg-orange-500',
    },
    yellow: {
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-500',
      dotColor: 'bg-yellow-500',
    },
    green: {
      iconBg: 'bg-green-50',
      iconColor: 'text-green-500',
      dotColor: 'bg-green-500',
    },
    red: {
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      dotColor: 'bg-red-500',
    },
    blue: {
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      dotColor: 'bg-blue-500',
    },
    purple: {
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
      dotColor: 'bg-purple-500',
    },
    emerald: {
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      dotColor: 'bg-emerald-500',
    },
    indigo: {
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
      dotColor: 'bg-indigo-500',
    },
  }

  const colors = colorClasses[colorScheme] || colorClasses.blue

  const paddingClass = compact
    ? 'pl-5 pt-3 pb-0 pr-0 sm:pl-6 sm:pt-4'
    : isBooks
      ? booksKpiCardClassName
      : 'p-6 pb-0 pr-0'
  const showFooter = !compact && (change || (!change && subtitle))

  const iconBoxClass =
    'relative h-32 w-32 shrink-0 self-start overflow-hidden rounded-2xl rounded-bl-[0] rounded-tr-[0]'
  const iconImgClass = 'absolute -bottom-7 -right-7 h-32 w-32'

  const titleClass = isBooks
    ? 'mb-2 text-sm font-medium text-[var(--books-text-secondary,#6b7280)]'
    : 'mb-2 text-sm font-medium text-gray-600'
  const valueClass = isBooks
    ? clsx(
        'text-4xl font-bold tracking-tight text-[var(--books-text-primary,#111827)]',
        showFooter && 'mb-2'
      )
    : clsx('text-4xl font-bold text-gray-900', showFooter && 'mb-2')
  const footerClass = isBooks
    ? 'flex items-center gap-1.5 text-sm text-[var(--books-text-secondary,#6b7280)]'
    : 'flex items-center gap-1.5 text-sm text-gray-500'
  const booksDot = 'h-2 w-2 rounded-full bg-[var(--books-brand,#ea580c)]'
  const changeClass =
    changeType === 'increase'
      ? isBooks
        ? 'font-medium text-[var(--books-green,#059669)]'
        : 'font-medium text-green-600'
      : isBooks
        ? 'font-medium text-red-600 dark:text-red-400'
        : 'font-medium text-red-600'

  return (
    <Card
      variant="elevated"
      className={clsx(
        paddingClass,
        onClick &&
          'cursor-pointer hover:shadow-[0_6px_26px_rgba(15,23,42,0.13),0_3px_8px_rgba(15,23,42,0.07)] transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1 pr-2">
          <p className={titleClass}>{title}</p>
          <p className={valueClass}>{value}</p>
          {showFooter && change && (
            <div className={footerClass}>
              <span className={isBooks ? booksDot : `h-2 w-2 rounded-full ${colors.dotColor}`} aria-hidden />
              <span className={changeClass}>{change}</span>
              {change !== '0' && <span className={isBooks ? 'ml-0.5' : 'ml-1'}>this period</span>}
            </div>
          )}
          {showFooter && !change && subtitle && (
            <div className={footerClass}>
              <span className={isBooks ? booksDot : `h-2 w-2 rounded-full ${colors.dotColor}`} aria-hidden />
              <span>{subtitle}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={clsx(
              iconBoxClass,
              isBooks
                ? 'bg-[var(--books-orange-bg,rgba(234,88,12,0.1))]'
                : colors.iconBg
            )}
          >
            <Icon
              className={clsx(
                iconImgClass,
                isBooks ? 'text-[var(--books-orange-text,#ea580c)]' : colors.iconColor
              )}
              aria-hidden
            />
          </div>
        )}
      </div>
    </Card>
  )
}

export default KPICard
