'use client'

import { ChevronLeft } from 'lucide-react'

export const workspaceBackButtonClassName =
  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-brand-foreground bg-white/70 backdrop-blur-sm border border-orange-200/50 shadow-sm hover:bg-orange-50/90 hover:border-orange-300/60 hover:shadow transition-all duration-200'

export function WorkspaceBackButton({ onClick, label = 'Back', className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${workspaceBackButtonClassName} ${className}`.trim()}
      aria-label={label}
    >
      <ChevronLeft className="w-4 h-4 shrink-0" strokeWidth={2} />
      <span>{label}</span>
    </button>
  )
}

export default WorkspaceBackButton
