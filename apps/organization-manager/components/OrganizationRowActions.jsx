'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ExternalLink,
  Eye,
  LayoutDashboard,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Button, TableRowActionMenuPortal } from '@webfudge/ui'
import platformService from '../lib/platformService'

const ACCOUNTS_URL = process.env.NEXT_PUBLIC_ACCOUNTS_APP_URL || 'http://localhost:3003'
const PM_URL = process.env.NEXT_PUBLIC_PM_APP_URL || 'http://localhost:3002'

export function openOrganizationApp(orgId, url) {
  localStorage.setItem('current-org-id', String(orgId))
  window.open(url, '_blank', 'noopener,noreferrer')
}

const appActionClass =
  'hidden h-8 shrink-0 gap-1.5 whitespace-nowrap border-gray-200 px-2.5 text-xs text-gray-700 hover:border-orange-200 hover:bg-orange-50 hover:text-brand-primary sm:inline-flex sm:px-3 sm:text-sm'

const appActionCompactClass =
  'h-8 shrink-0 gap-1.5 whitespace-nowrap border-gray-200 px-2.5 text-xs text-gray-700 hover:border-orange-200 hover:bg-orange-50 hover:text-brand-primary'

const menuTriggerClass =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600'

export default function OrganizationRowActions({ orgId, orgName, onDeleted, compact = false }) {
  const router = useRouter()
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const menuOpen = Boolean(menuAnchor)

  const handleDelete = async () => {
    const label = orgName ? `"${orgName}"` : 'this organization'
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return

    setDeleting(true)
    try {
      await platformService.deleteOrganization(orgId)
      onDeleted?.()
    } catch (err) {
      window.alert(err?.message || 'Failed to delete organization')
    } finally {
      setDeleting(false)
    }
  }

  const menuItems = useMemo(
    () => [
      {
        label: 'View',
        icon: Eye,
        onClick: () => router.push(`/organizations/${orgId}`),
      },
      {
        label: 'Edit',
        icon: Pencil,
        onClick: () => router.push(`/organizations/${orgId}`),
      },
      {
        label: 'Open Accounts',
        icon: ExternalLink,
        onClick: () => openOrganizationApp(orgId, ACCOUNTS_URL),
      },
      {
        label: 'Open PM',
        icon: LayoutDashboard,
        onClick: () => openOrganizationApp(orgId, PM_URL),
      },
      {
        label: 'Delete',
        icon: Trash2,
        danger: true,
        disabled: deleting,
        onClick: handleDelete,
      },
    ],
    [deleting, orgId, router]
  )

  const openMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuAnchor(
      menuOpen
        ? null
        : { top: rect.bottom + 4, left: rect.right - 160, triggerEl: event.currentTarget }
    )
  }

  return (
    <div
      className="inline-flex flex-nowrap items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="secondary"
        size="sm"
        className={compact ? appActionCompactClass : appActionClass}
        title="Open Accounts workspace"
        onClick={() => openOrganizationApp(orgId, ACCOUNTS_URL)}
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        Accounts
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className={compact ? appActionCompactClass : appActionClass}
        title="Open Project Management"
        onClick={() => openOrganizationApp(orgId, PM_URL)}
      >
        <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
        PM
      </Button>

      <button
        type="button"
        onClick={openMenu}
        className={menuTriggerClass}
        aria-label="More organization actions"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <TableRowActionMenuPortal
        open={menuOpen}
        anchor={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        menuClassName="w-44"
      >
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setMenuAnchor(null)
                item.onClick?.()
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                item.danger
                  ? 'text-red-700 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
              }`}
              role="menuitem"
            >
              {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
              <span>{item.label}</span>
            </button>
          )
        })}
      </TableRowActionMenuPortal>
    </div>
  )
}
