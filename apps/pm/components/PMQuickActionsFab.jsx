'use client'

import { useRouter } from 'next/navigation'
import { CheckSquare, FolderOpen, Building2 } from 'lucide-react'
import { QuickActionsFab } from '@webfudge/ui'
import { canWritePM, canWriteClientAccounts } from '../lib/rbac'
import { canCreateProjectsInPm } from '../lib/pmOrgRoles'

const ACTION_ITEMS = [
  {
    label: 'New Task',
    module: 'my_tasks',
    icon: CheckSquare,
    href: '/my-tasks?createTask=1',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    label: 'New Project',
    module: 'projects',
    icon: FolderOpen,
    href: '/projects/add',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    requiresProjectCreate: true,
  },
  {
    label: 'New Client',
    module: 'client_accounts',
    icon: Building2,
    href: '/clients/accounts/new',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
]

export default function PMQuickActionsFab() {
  const router = useRouter()

  const actions = ACTION_ITEMS.filter((item) => {
    if (item.module === 'client_accounts') {
      return canWriteClientAccounts()
    }
    if (!canWritePM(item.module)) return false
    if (item.requiresProjectCreate && !canCreateProjectsInPm()) return false
    return true
  }).map((item) => ({
    ...item,
    onClick: () => router.push(item.href),
  }))

  return <QuickActionsFab actions={actions} />
}
