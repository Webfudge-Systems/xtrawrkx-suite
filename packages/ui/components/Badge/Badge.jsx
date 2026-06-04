import { clsx } from 'clsx'

const variants = {
  default: 'bg-gray-50 text-gray-700 border border-gray-200',
  primary: 'bg-blue-50 text-blue-700 border border-blue-200',
  success: 'bg-green-50 text-green-700 border border-green-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  error: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-blue-50 text-blue-700 border border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border border-orange-200',
  cyan: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  pink: 'bg-pink-50 text-pink-700 border border-pink-200',
  gray: 'bg-gray-50 text-gray-700 border border-gray-200',

  // Status badges (more vibrant)
  new: 'bg-blue-50 text-blue-700 border border-blue-200',
  active: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
  qualified: 'bg-purple-50 text-purple-700 border border-purple-200',
  contacted: 'bg-blue-50 text-blue-700 border border-blue-200',
  lost: 'bg-gray-50 text-gray-700 border border-gray-200',
}

const sizes = {
  sm: 'text-xs px-2 py-0.5 rounded-md',
  md: 'text-xs px-2.5 py-1 rounded-lg',
  lg: 'text-sm px-3 py-1.5 rounded-lg',
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
  ...props
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold tracking-wide',
        variants[variant],
        sizes[size],
        dot && 'gap-1.5',
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export default Badge
