'use client'

import { Shield, Sparkles, User, Users } from 'lucide-react'
import { clsx } from 'clsx'

function pickRoleIcon(codeRaw, isSystem) {
  const code = String(codeRaw || '').toLowerCase()
  if (code.includes('admin')) return Shield
  if (code.includes('manager')) return Users
  if (code.includes('member')) return User
  return isSystem ? Shield : Sparkles
}

/**
 * Role column: icon tile + strong title + muted monospace slug (Accounts tables).
 */
export default function RoleTableCell({ name, code, isSystem, className }) {
  const Icon = pickRoleIcon(code, Boolean(isSystem))
  const title = name?.trim() ? name.trim() : '—'
  const slugRaw = code != null && String(code).trim() !== '' ? String(code).trim() : null
  const slug = slugRaw || '—'

  return (
    <div className={clsx('flex min-w-0 max-w-[min(100%,20rem)] items-center gap-3', className)}>
      <div
        className={clsx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
          isSystem
            ? 'border-orange-100 bg-orange-50 text-orange-600'
            : 'border-teal-100 bg-teal-50 text-teal-700'
        )}
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-tight text-gray-900">{title}</p>
        <p className="truncate font-mono text-xs text-gray-500" title={slugRaw || undefined}>
          {slug}
        </p>
      </div>
    </div>
  )
}
