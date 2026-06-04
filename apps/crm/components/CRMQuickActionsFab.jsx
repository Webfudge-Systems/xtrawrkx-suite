'use client'

import { useRouter } from 'next/navigation'
import {
  Users,
  Phone,
  MessageCircle,
  FileText,
  Calendar,
  CheckSquare,
} from 'lucide-react'
import { QuickActionsFab } from '@webfudge/ui'
import { canWriteCRM } from '../lib/rbac'

const comingSoonHref = (feature) => `/coming-soon?feature=${encodeURIComponent(feature)}`

const ACTION_ITEMS = [
  {
    label: 'New Task',
    module: 'client_projects',
    icon: CheckSquare,
    href: '/clients/tasks',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    label: 'New Meeting',
    module: 'meetings',
    icon: Calendar,
    href: '/meetings/new',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
  },
  {
    label: 'New Lead',
    module: 'leads',
    icon: Users,
    href: '/sales/lead-companies/new',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    label: 'New Proposal',
    module: 'proposals',
    icon: FileText,
    href: '/clients/proposals/new',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    label: 'Log Call',
    module: 'leads',
    icon: Phone,
    href: comingSoonHref('Log Call'),
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
  },
  {
    label: 'Send WhatsApp',
    module: 'leads',
    icon: MessageCircle,
    href: comingSoonHref('Send WhatsApp'),
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
]

export default function CRMQuickActionsFab() {
  const router = useRouter()

  const actions = ACTION_ITEMS.filter((item) => canWriteCRM(item.module)).map((item) => ({
    ...item,
    onClick: () => router.push(item.href),
  }))

  return <QuickActionsFab actions={actions} menuWidth="w-56" />
}
