'use client'

import { Search } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { Input } from './Input'
import { workspaceSearchInputClassName } from './workspaceSearchInputClassName'

/**
 * CRM WorkspaceHeader topbar search — single source of truth for pill search styling.
 */
export function WorkspaceSearchInput({
  placeholder = 'Search... (⌘K)',
  containerClassName,
  className,
  ...props
}) {
  return (
    <Input
      icon={Search}
      type="text"
      placeholder={placeholder}
      containerClassName={twMerge('w-64 min-w-[16rem] shrink-0', containerClassName)}
      className={twMerge(workspaceSearchInputClassName, className)}
      {...props}
    />
  )
}

export default WorkspaceSearchInput
