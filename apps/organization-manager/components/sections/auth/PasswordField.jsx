'use client'

import { useState } from 'react'
import { clsx } from 'clsx'
import { Icon } from '@iconify/react'
import { Button } from '@webfudge/ui'

const inputClasses =
  'block w-full rounded-lg border shadow-sm px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200'

export default function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  placeholder,
  required,
  autoComplete,
  minLength,
  className,
  containerClassName,
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          className={clsx(
            inputClasses,
            'pr-10',
            error ? 'border-red-300 text-red-900' : 'border-gray-300',
            className
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute inset-y-0 right-0 pr-3 flex items-center rounded-lg"
          onClick={() => setShowPassword((s) => !s)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <Icon
            icon={showPassword ? 'lucide:eye-off' : 'lucide:eye'}
            className="h-5 w-5 text-gray-400"
            aria-hidden
          />
        </Button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
