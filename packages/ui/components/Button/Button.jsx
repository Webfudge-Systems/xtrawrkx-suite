import { clsx } from 'clsx'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  rounded = 'default', // "default" = rounded-lg, "pill" = rounded-full
  className,
  disabled,
  as: Component = 'button',
  ...props
}) {
  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-md',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    outline: 'border border-orange-500 hover:bg-orange-50 text-orange-600',
    ghost: 'hover:bg-orange-50 text-orange-600',
    muted: 'bg-gray-50/80 hover:bg-gray-100 text-gray-500 hover:text-gray-700 shadow-none border-0 focus:ring-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const roundedStyles = {
    default: 'rounded-lg',
    pill: 'rounded-full',
  }

  return (
    <Component
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        roundedStyles[rounded],
        variants[variant],
        sizes[size],
        className
      )}
      disabled={Component === 'button' ? disabled : undefined}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Button
