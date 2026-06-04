'use client'

import { clsx } from 'clsx'
import { ChevronLeft, X } from 'lucide-react'
import { useEffect } from 'react'

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  className,
  contentClassName,
  showCloseButton = true,
  closeOnBackdrop = true,
  variant = 'default',
  onBack,
  ...props
}) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBack = onBack ?? onClose

  if (variant === 'navPanel') {
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div
          className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity"
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden="true"
        />

        <div
          className={clsx(
            'fixed right-4 top-4 bottom-4 z-10 flex w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden bg-white',
            'rounded-3xl shadow-[0_24px_64px_-16px_rgba(15,23,42,0.22),0_0_0_1px_rgba(15,23,42,0.06)]',
            className
          )}
          {...props}
        >
          {(title || showCloseButton) && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="shrink-0 rounded-lg p-1 text-gray-600 transition-colors hover:bg-gray-200"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                {title && (
                  <div className="min-w-0">
                    <h2
                      id="modal-title"
                      className="text-lg font-semibold capitalize leading-tight text-gray-900"
                    >
                      {title}
                    </h2>
                    {subtitle ? (
                      <p className="text-sm text-gray-600">{subtitle}</p>
                    ) : null}
                  </div>
                )}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-200"
                  aria-label="Close dialog"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </button>
              )}
            </div>
          )}

          <div
            className={clsx(
              'min-h-0 flex-1 overflow-y-auto bg-white p-4',
              contentClassName
            )}
          >
            {children}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={clsx(
          'relative flex w-full max-h-[calc(100vh-2rem)] flex-col overflow-hidden bg-[#F1F1F1] rounded-3xl',
          'shadow-[0_24px_64px_-16px_rgba(15,23,42,0.22),0_0_0_1px_rgba(15,23,42,0.06)]',
          'transform transition-all',
          sizes[size],
          className
        )}
        {...props}
      >
        {(title || showCloseButton) && (
          <div
            className={clsx(
              'flex shrink-0 items-start gap-4 px-8 pt-8 pb-5 border-b border-gray-300',
              title ? 'justify-between' : 'justify-end'
            )}
          >
            {title && (
              <div className="min-w-0 pr-2">
                <h3
                  id="modal-title"
                  className="text-3xl font-bold tracking-tight text-slate-900 leading-tight"
                >
                  {title}
                </h3>
                {subtitle ? (
                  <p className="mt-1.5 text-base text-gray-600">{subtitle}</p>
                ) : null}
              </div>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={clsx(
                  'shrink-0 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors',
                  title ? '-mr-1 -mt-0.5' : '-mr-1'
                )}
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" strokeWidth={1.75} aria-hidden />
              </button>
            )}
          </div>
        )}

        <div
          className={clsx(
            'min-h-0 flex-1 overflow-y-auto px-8 pb-8 pt-6',
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
