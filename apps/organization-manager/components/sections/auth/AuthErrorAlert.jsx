'use client'

import { Icon } from '@iconify/react'

export default function AuthErrorAlert({ title, message }) {
  return (
    <div
      className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
      role="alert"
    >
      <Icon
        icon="lucide:circle-alert"
        className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-red-800">{title}</h3>
        <p className="text-sm text-red-700 mt-1">{message}</p>
      </div>
    </div>
  )
}
