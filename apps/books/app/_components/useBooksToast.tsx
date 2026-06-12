'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

export function useBooksToast() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(() => setMessage(null), 2800)
    return () => window.clearTimeout(t)
  }, [message])

  const toast = (text: string) => setMessage(text)

  const Toast = message ? (
    <div
      role="status"
      className={clsx(
        'fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-full border border-[color:var(--books-border)]',
        'bg-[var(--books-bg-elevated,#252830)] px-4 py-2 text-sm font-medium text-[var(--books-text-primary,#f8fafc)]',
        'shadow-[0_12px_40px_rgba(0,0,0,0.45)]'
      )}
    >
      {message}
    </div>
  ) : null

  return { toast, Toast }
}
