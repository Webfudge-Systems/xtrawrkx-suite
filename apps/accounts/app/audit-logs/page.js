'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  GanttChart,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Table2,
  Trash2,
  X,
  Eye,
} from 'lucide-react'
import {
  ActivitiesTimeline,
  Avatar,
  Button,
  Input,
  KPICard,
  LoadingSpinner,
  Modal,
  Pagination,
  Table,
  TableCellText,
  TableCellTitleSubtitle,
  ViewToggleButton,
  ViewToggleGroup,
  formatTableDate,
  ownerDisplayFromUser,
  useTableColumnPreferences,
  TableColumnPicker,
} from '@webfudge/ui'
import AccountsPageHeader from '../../components/AccountsPageHeader'
import { auditService } from '../../lib/api'

const PAGE_SIZE = 12

function isUnauthorizedError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    message.includes('http 401') ||
    message.includes('unauthorized') ||
    message.includes('missing or invalid credentials') ||
    message.includes('token expired')
  )
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch (_) {
    return String(value)
  }
}

function getModuleFromRow(row = {}) {
  if (row?.module || row?.app || row?.source || row?.area) {
    return String(row?.module || row?.app || row?.source || row?.area).toLowerCase()
  }
  const subjectType = String(row?.subjectType || '').toLowerCase()
  if (['task', 'project'].includes(subjectType)) return 'pm'
  if (['contact', 'lead_company', 'deal', 'client_account', 'meeting'].includes(subjectType)) return 'crm'
  if (
    ['organization_user', 'invitation', 'organization_role', 'team', 'department', 'app_access'].includes(
      subjectType
    )
  ) {
    return 'accounts'
  }
  const metaModule = row?.meta?.module || row?.metadata?.module
  if (metaModule) return String(metaModule).toLowerCase()
  return 'accounts'
}

function getSeverityFromRow(row = {}) {
  const base = String(row?.severity || '').toLowerCase()
  if (['critical', 'high', 'medium', 'low'].includes(base)) return base
  const action = String(row?.action || row?.event || '').toLowerCase()
  if (action.includes('delete') || action.includes('disable') || action.includes('revoke')) return 'high'
  if (action.includes('update') || action.includes('edit') || action.includes('reset')) return 'medium'
  return 'low'
}

function parseRowMeta(meta) {
  if (meta == null) return {}
  if (typeof meta === 'string') {
    try {
      const p = JSON.parse(meta)
      return typeof p === 'object' && p !== null ? p : {}
    } catch {
      return {}
    }
  }
  return typeof meta === 'object' ? meta : {}
}

function buildEntityTimelineParams(entityType, subjectId) {
  const id = subjectId != null ? Number(subjectId) : NaN
  if (subjectId == null || subjectId === '' || Number.isNaN(id)) return null
  const st = String(entityType || '').toLowerCase()
  const limit = 80
  if (st === 'contact') return { contactId: id, limit }
  if (st === 'lead_company') return { leadCompanyId: id, limit }
  if (st === 'deal') return { dealId: id, limit }
  if (st === 'client_account') return { clientAccountId: id, limit }
  if (st === 'meeting') return { meetingId: id, limit }
  if (st === 'task') return { taskId: id, limit }
  if (st === 'project') return { projectId: id, limit }
  return null
}

/** Optional: set NEXT_PUBLIC_CRM_ORIGIN (e.g. http://localhost:3001) for "Open in CRM" in entity drawer. */
function entityRecordExternalHref(entityType, subjectId) {
  const origin = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_CRM_ORIGIN : ''
  if (!origin || subjectId == null || subjectId === '') return null
  const id = subjectId
  const st = String(entityType || '').toLowerCase()
  const base = String(origin).replace(/\/$/, '')
  if (st === 'contact') return `${base}/sales/contacts/${id}`
  if (st === 'lead_company') return `${base}/sales/lead-companies/${id}`
  if (st === 'deal') return `${base}/sales/deals/${id}`
  if (st === 'client_account') return `${base}/clients/accounts/${id}`
  if (st === 'meeting') return `${base}/meetings/${id}`
  if (st === 'task') return `${base}/clients/tasks`
  if (st === 'project') return `${base}/clients/projects`
  return null
}

function subjectTypeLabel(entityType) {
  const st = String(entityType || '').toLowerCase()
  const map = {
    lead_company: 'Lead company',
    client_account: 'Client account',
    contact: 'Contact',
    deal: 'Deal',
    task: 'Task',
    project: 'Project',
    meeting: 'Meeting',
    organization_user: 'Organization member',
    invitation: 'Invitation',
    organization_role: 'Role',
    record: 'Record',
  }
  if (map[st]) return map[st]
  if (!st) return 'Record'
  return st.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function actionVerb(action) {
  const a = String(action || '').toLowerCase()
  if (a === 'create') return 'Created'
  if (a === 'delete') return 'Deleted'
  if (a === 'comment') return 'Comment on'
  if (a === 'update') return 'Updated'
  return a ? a.charAt(0).toUpperCase() + a.slice(1) : 'Activity'
}

function actionIconFor(action) {
  const a = String(action || '').toLowerCase()
  if (a === 'comment') return MessageSquare
  if (a === 'create') return Plus
  if (a === 'delete') return Trash2
  if (a === 'update') return Pencil
  return Activity
}

/** Matches ActivitiesTimeline badge styling (CREATE / UPDATE / DELETE / COMMENT). */
function actionBadgeClasses(action) {
  const a = String(action || '').toLowerCase()
  if (a === 'create') return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
  if (a === 'delete') return 'bg-red-50 text-red-800 ring-red-200/80'
  if (a === 'comment') return 'bg-blue-50 text-blue-800 ring-blue-200/80'
  return 'bg-slate-100 text-slate-800 ring-slate-200/90'
}

function actionIconBoxClasses(action) {
  const a = String(action || '').toLowerCase()
  if (a === 'create') return 'bg-emerald-50 text-emerald-700 ring-emerald-200/80'
  if (a === 'delete') return 'bg-red-50 text-red-700 ring-red-200/80'
  if (a === 'comment') return 'bg-blue-50 text-blue-700 ring-blue-200/80'
  return 'bg-slate-50 text-slate-700 ring-slate-200/90'
}

function formatAuditTimeStack(dateString) {
  if (!dateString) return { time: '—', date: '—' }
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return { time: '—', date: '—' }
  return {
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    date: formatTableDate(dateString),
  }
}

function getCategoryFromRow(row = {}) {
  const typeRaw = String(row?.type || row?.category || row?.eventType || '').toLowerCase()
  if (typeRaw) return typeRaw
  const subjectType = String(row?.subjectType || '').toLowerCase()
  if (['organization_user', 'invitation', 'organization_role', 'app_access'].includes(subjectType)) {
    return 'access'
  }
  const action = String(row?.action || row?.event || '').toLowerCase()
  if (action.includes('login') || action.includes('password') || action.includes('session') || action.includes('2fa')) {
    return 'authentication'
  }
  if (action.includes('invite') || action.includes('role') || action.includes('permission') || action.includes('user')) {
    return 'access'
  }
  if (action.includes('delete') || action.includes('create') || action.includes('update') || action.includes('restore')) {
    return 'data-change'
  }
  return 'workspace'
}

function normalizeAuditRows(rows = []) {
  return rows.map((entry, index) => {
    const row = entry?.attributes ? { id: entry.id, ...entry.attributes } : entry || {}
    const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {}
    const meta = parseRowMeta(row?.meta)
    const changes = row?.changes && typeof row.changes === 'object' ? row.changes : {}
    const fieldChanges = Array.isArray(meta?.changes) ? meta.changes : []
    const beforeFromFieldChanges = fieldChanges.reduce((acc, item) => {
      if (!item?.key) return acc
      acc[item.key] = item.before
      return acc
    }, {})
    const afterFromFieldChanges = fieldChanges.reduce((acc, item) => {
      if (!item?.key) return acc
      acc[item.key] = item.after
      return acc
    }, {})
    const before = row?.before || row?.beforeState || changes.before || null
    const after = row?.after || row?.afterState || changes.after || null
    const actorUser = row?.actor && typeof row.actor === 'object' ? row.actor : null
    const actorFallback =
      row?.actorName ||
      actorUser?.name ||
      actorUser?.username ||
      actorUser?.email ||
      row?.createdBy?.username ||
      row?.createdBy?.email ||
      row?.user?.email ||
      'System'

    const sid = row?.subjectId
    const subjectId =
      sid != null && sid !== '' && !Number.isNaN(Number(sid)) ? Number(sid) : null

    return {
      id: row?.id || `audit-${index}`,
      action: row?.action || row?.event || row?.title || 'Workspace update',
      category: getCategoryFromRow(row),
      actor: actorFallback,
      actorUser,
      subjectId,
      module: getModuleFromRow(row),
      entityType: String(row?.entityType || row?.subjectType || row?.entity || row?.resourceType || 'record').toLowerCase(),
      entityName:
        row?.targetName ||
        row?.resource ||
        row?.subject ||
        row?.entityName ||
        parseRowMeta(row?.meta)?.email ||
        (row?.subjectId != null ? `${String(row?.subjectType || 'record')} #${row.subjectId}` : '—'),
      severity: getSeverityFromRow(row),
      description: row?.description || row?.message || row?.summary || '',
      createdAt: row?.createdAt || row?.timestamp || row?.date || null,
      ipAddress: row?.ipAddress || metadata?.ipAddress || metadata?.ip || '—',
      device: row?.device || metadata?.device || metadata?.userAgent || '—',
      relatedRecords: row?.relatedRecords || metadata?.relatedRecords || [],
      before: before || (Object.keys(beforeFromFieldChanges).length ? beforeFromFieldChanges : null),
      after: after || (Object.keys(afterFromFieldChanges).length ? afterFromFieldChanges : null),
      raw: row,
    }
  })
}

function AuditTableCellTime({ dateString }) {
  const { time, date } = formatAuditTimeStack(dateString)
  if (time === '—') {
    return (
      <div className="min-w-[100px]">
        <TableCellText value="—" />
      </div>
    )
  }
  return (
    <div className="min-w-[108px]">
      <div className="whitespace-nowrap text-sm font-semibold text-gray-900">{time}</div>
      <div className="whitespace-nowrap text-sm text-gray-500">{date}</div>
    </div>
  )
}

function AuditTableCellActor({ log }) {
  const u = log.actorUser
  let primary = String(log.actor || 'System')
  let secondary = ''
  let avatarFallback = '?'

  if (u && typeof u === 'object') {
    const derived = ownerDisplayFromUser(u)
    avatarFallback = derived.avatarFallback
    const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
    if (full) {
      primary = full
      secondary = u.email ? u.email : ''
    } else if (u.name && String(u.name).trim()) {
      primary = String(u.name).trim()
      secondary = u.email || ''
    } else if (u.email) {
      primary = u.email
      secondary = ''
    } else {
      primary = derived.label
      secondary = u.email || ''
    }
  } else {
    const s = String(log.actor || '')
    if (s.includes('@')) {
      const local = s.split('@')[0] || 'u'
      avatarFallback = local.slice(0, 2).toUpperCase()
      primary = s
      secondary = ''
    } else {
      const parts = s.split(/\s+/).filter(Boolean)
      avatarFallback =
        parts.length >= 2
          ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
          : (s.slice(0, 2).toUpperCase() || '?')
      primary = s || 'System'
      secondary = ''
    }
  }

  return (
    <div className="flex min-w-[200px] items-start gap-2">
      <Avatar fallback={avatarFallback} alt={primary} size="sm" className="flex-shrink-0 bg-gray-600 text-white" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-gray-900" title={primary}>
          {primary}
        </div>
        {secondary ? (
          <div className="truncate text-sm text-gray-500" title={secondary}>
            {secondary}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function AuditTableCellEntity({ log, onOpenEntity }) {
  const params = buildEntityTimelineParams(log.entityType, log.subjectId)
  const subtitle = subjectTypeLabel(log.entityType)
  if (!params) {
    return <TableCellTitleSubtitle title={log.entityName} subtitle={subtitle} />
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpenEntity()
      }}
      className="group flex w-full min-w-[160px] max-w-[280px] items-start gap-2 rounded-lg text-left outline-none transition-colors hover:bg-orange-50/70 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1"
    >
      <ChevronRight
        className="mt-1 h-4 w-4 shrink-0 text-orange-500 opacity-60 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="truncate text-sm font-semibold text-orange-700 group-hover:underline">{log.entityName}</div>
        <div className="mt-0.5 truncate text-xs font-medium text-gray-500">
          {subtitle}
          {log.subjectId != null ? (
            <span className="text-gray-400"> · #{log.subjectId}</span>
          ) : null}
        </div>
        <span className="mt-1 inline-block text-[11px] font-semibold uppercase tracking-wide text-orange-600/90">
          Full history
        </span>
      </div>
    </button>
  )
}

function AuditTableCellAction({ log }) {
  const raw = log.raw || {}
  const meta = parseRowMeta(raw.meta)
  const changes = Array.isArray(meta?.changes) ? meta.changes : []
  const Icon = actionIconFor(log.action)
  const badgeRing = actionBadgeClasses(log.action)
  const iconRing = actionIconBoxClasses(log.action)
  const entity = subjectTypeLabel(log.entityType)
  const title = `${actionVerb(log.action)} ${entity}`.trim()
  const summaryFallback = (log.description || '').trim()

  return (
    <div className="flex min-w-[280px] max-w-[400px] items-start gap-3">
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${iconRing}`}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${badgeRing}`}
          >
            {String(log.action || 'update').toUpperCase()}
          </span>
          <span className="text-sm font-semibold leading-snug text-gray-900">{title}</span>
        </div>

        {changes.length > 0 ? (
          <ul className="space-y-1.5" aria-label="Field changes">
            {changes.slice(0, 2).map((c) => (
              <li key={c.key || `${c.label}-${c.before}`} className="text-xs leading-snug text-gray-600">
                <span className="font-medium text-gray-800">{c.label}:</span>{' '}
                <span className="inline-block max-w-[140px] truncate align-bottom rounded-md bg-white px-1.5 py-0.5 text-gray-700 shadow-sm ring-1 ring-gray-200/80">
                  {c.before}
                </span>
                <span className="mx-1 font-medium text-gray-400">→</span>
                <span className="inline-block max-w-[140px] truncate align-bottom rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-900 shadow-sm ring-1 ring-emerald-200/70">
                  {c.after}
                </span>
              </li>
            ))}
          </ul>
        ) : summaryFallback ? (
          <p className="line-clamp-2 text-xs leading-snug text-gray-500">{summaryFallback}</p>
        ) : null}

        {changes.length > 2 ? (
          <p className="text-[11px] font-medium text-gray-400">+{changes.length - 2} more fields</p>
        ) : null}
      </div>
    </div>
  )
}

function badgeClass(value, kind = 'category') {
  const v = String(value || '').toLowerCase()
  if (kind === 'severity') {
    if (v === 'critical') return 'bg-red-100 text-red-700 border-red-200'
    if (v === 'high') return 'bg-orange-100 text-orange-700 border-orange-200'
    if (v === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200'
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }

  if (v === 'authentication') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (v === 'access') return 'bg-violet-100 text-violet-700 border-violet-200'
  if (v === 'data-change') return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

function isWithinDateRange(createdAt, dateRange) {
  if (!createdAt || dateRange === 'all') return true
  const ms = new Date(createdAt).getTime()
  if (Number.isNaN(ms)) return true
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  if (dateRange === 'today') return now - ms <= oneDay
  if (dateRange === '7d') return now - ms <= 7 * oneDay
  if (dateRange === '30d') return now - ms <= 30 * oneDay
  return true
}

function safeJson(value) {
  if (value == null) return '—'
  try {
    return JSON.stringify(value, null, 2)
  } catch (_) {
    return String(value)
  }
}

function csvEscapeCell(value) {
  const s = value == null ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

function FilterField({ label, children }) {
  return (
    <div className="space-y-1.5 min-w-0">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  )
}

const selectClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30'

const AUDIT_VIEW_STORAGE_KEY = 'accounts.auditLogs.viewMode'
const AUDIT_VIEW_MODES = ['table', 'timeline']

const COLUMN_VISIBILITY_STORAGE_KEY = 'accounts.auditLogs.tableColumnVisibility'
const COLUMN_ORDER_STORAGE_KEY = 'accounts.auditLogs.tableColumnOrder'
const COLUMN_WIDTHS_STORAGE_KEY = 'accounts.auditLogs.tableColumnWidths'

const DEFAULT_COLUMN_WIDTHS = {
  createdAt: 180,
  actor: 200,
  action: 160,
  module: 110,
  entityName: 220,
  severity: 120,
  category: 120,
}

const MIN_COLUMN_WIDTHS = {
  createdAt: 140,
  actor: 160,
  entityName: 160,
}

const TOGGLEABLE_COLUMNS = [
  { key: 'actor', label: 'User' },
  { key: 'action', label: 'Action' },
  { key: 'module', label: 'Module' },
  { key: 'entityName', label: 'Entity' },
  { key: 'severity', label: 'Severity' },
  { key: 'category', label: 'Type' },
]

const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((c) => c.key)

const DEFAULT_ON_COLUMN_KEYS = new Set(['actor', 'action', 'module', 'entityName'])

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, { key }) => {
  acc[key] = DEFAULT_ON_COLUMN_KEYS.has(key)
  return acc
}, {})

function readStoredAuditView() {
  if (typeof window === 'undefined') return 'table'
  try {
    const value = window.localStorage.getItem(AUDIT_VIEW_STORAGE_KEY)
    if (AUDIT_VIEW_MODES.includes(value)) return value
  } catch (_) {
    // ignore storage read failures
  }
  return 'table'
}

function normalizeTimelineAction(action) {
  const value = String(action || '').toLowerCase()
  if (value.includes('create')) return 'create'
  if (value.includes('delete') || value.includes('remove')) return 'delete'
  if (value.includes('comment') || value.includes('note')) return 'comment'
  if (value.includes('update') || value.includes('edit') || value.includes('change')) return 'update'
  return 'update'
}

function toTimelineItem(log) {
  if (!log) return null
  const action = normalizeTimelineAction(log.action)
  const subjectLabel = subjectTypeLabel(log.entityType)
  const summaryBase = log.description || `${actionVerb(action)} ${subjectLabel.toLowerCase()} "${log.entityName}"`
  return {
    id: log.id,
    action,
    createdAt: log.createdAt,
    summary: summaryBase,
    actor: {
      username: log.actorUser?.username || log.actor || null,
      email: log.actorUser?.email || null,
      id: log.actorUser?.id || null,
    },
    __rawLog: log,
  }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState(null)
  const [entityDrawer, setEntityDrawer] = useState(null)
  const [entityTimelineItems, setEntityTimelineItems] = useState([])
  const [entityTimelineLoading, setEntityTimelineLoading] = useState(false)
  const [entityTimelineError, setEntityTimelineError] = useState('')
  const [entityDrawerSelectedId, setEntityDrawerSelectedId] = useState(null)
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [entityFilter, setEntityFilter] = useState('all')
  const [actorFilter, setActorFilter] = useState('all')
  const [dateRange, setDateRange] = useState('30d')
  const [viewMode, setViewMode] = useState(() => readStoredAuditView())

  const {
    columnVisibility,
    columnOrder,
    columnPickerOpen,
    setColumnPickerOpen,
    columnDropIndicator,
    toolbarRef,
    setColumnVisible,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnRowDragOver,
    handleColumnListDragLeave,
    handleColumnDrop,
    resetColumnTablePreferences,
    tableResizeProps,
  } = useTableColumnPreferences({
    visibilityStorageKey: COLUMN_VISIBILITY_STORAGE_KEY,
    orderStorageKey: COLUMN_ORDER_STORAGE_KEY,
    widthsStorageKey: COLUMN_WIDTHS_STORAGE_KEY,
    defaultVisibility: DEFAULT_COLUMN_VISIBILITY,
    reorderableKeys: REORDERABLE_COLUMN_KEYS,
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    minWidths: MIN_COLUMN_WIDTHS,
  })

  useEffect(() => {
    if (!columnPickerOpen) return
    const onDocMouseDown = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setColumnPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [columnPickerOpen, setColumnPickerOpen, toolbarRef])

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError('')
      const response = await auditService.list({
        page: 1,
        pageSize: 250,
        sort: 'createdAt:desc',
      })
      const rows = normalizeAuditRows(response?.rows || [])
      setLogs(rows)
    } catch (error) {
      if (isUnauthorizedError(error) && typeof window !== 'undefined') {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('current-org-id')
        localStorage.removeItem('auth-user')
        window.location.href = '/login'
        return
      }
      setLogs([])
      setLoadError(error?.message || 'Failed to load activity feed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const openEntityDrawer = useCallback((log) => {
    if (!buildEntityTimelineParams(log.entityType, log.subjectId)) return
    setEntityDrawer({
      entityType: log.entityType,
      subjectId: log.subjectId,
      entityName: log.entityName,
    })
    setEntityTimelineItems([])
    setEntityDrawerSelectedId(null)
    setEntityTimelineError('')
  }, [])

  const closeEntityDrawer = useCallback(() => {
    setEntityDrawer(null)
    setEntityTimelineItems([])
    setEntityDrawerSelectedId(null)
    setEntityTimelineError('')
  }, [])

  useEffect(() => {
    if (!entityDrawer) return

    const prevBodyOverflow = document.body.style.overflow
    const mainEl = document.querySelector('main')
    const prevMainOverflow = mainEl ? mainEl.style.overflow : ''

    document.body.style.overflow = 'hidden'
    if (mainEl) mainEl.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevBodyOverflow
      if (mainEl) mainEl.style.overflow = prevMainOverflow
    }
  }, [entityDrawer])

  useEffect(() => {
    if (!entityDrawer) return
    const params = buildEntityTimelineParams(entityDrawer.entityType, entityDrawer.subjectId)
    if (!params) return
    let cancelled = false
    ;(async () => {
      setEntityTimelineLoading(true)
      setEntityTimelineError('')
      try {
        const { data } = await auditService.entityTimeline(params)
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setEntityTimelineItems(list)
        setEntityDrawerSelectedId(list[0]?.id ?? null)
      } catch (e) {
        if (!cancelled) setEntityTimelineError(e?.message || 'Failed to load entity history')
      } finally {
        if (!cancelled) setEntityTimelineLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [entityDrawer])

  const entityRelatedPageLogs = useMemo(() => {
    if (!entityDrawer) return []
    return logs
      .filter(
        (l) => l.entityType === entityDrawer.entityType && l.subjectId === entityDrawer.subjectId
      )
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }, [logs, entityDrawer])

  const entityDrawerSelectedRaw = useMemo(() => {
    if (entityDrawerSelectedId == null) return null
    return (
      entityTimelineItems.find((r) => r.id != null && String(r.id) === String(entityDrawerSelectedId)) ||
      null
    )
  }, [entityTimelineItems, entityDrawerSelectedId])

  const entityDrawerSelectedNormalized = useMemo(() => {
    if (!entityDrawerSelectedRaw) return null
    const rows = normalizeAuditRows([entityDrawerSelectedRaw])
    return rows[0] || null
  }, [entityDrawerSelectedRaw])

  const counts = useMemo(() => {
    let auth = 0
    let access = 0
    let dataChange = 0
    let highRisk = 0
    logs.forEach((log) => {
      if (log.category === 'authentication') auth += 1
      else if (log.category === 'access') access += 1
      else if (log.category === 'data-change') dataChange += 1
      if (log.severity === 'critical' || log.severity === 'high') highRisk += 1
    })
    return {
      total: logs.length,
      auth,
      access,
      dataChange,
      highRisk,
    }
  }, [logs])

  const filterOptions = useMemo(() => {
    const modules = new Set()
    const actors = new Set()
    const actions = new Set()
    const entities = new Set()

    logs.forEach((log) => {
      if (log.module) modules.add(log.module)
      if (log.actor) actors.add(log.actor)
      if (log.action) actions.add(log.action)
      if (log.entityType) entities.add(log.entityType)
    })

    return {
      modules: Array.from(modules).sort(),
      actors: Array.from(actors).sort(),
      actions: Array.from(actions).sort(),
      entities: Array.from(entities).sort(),
    }
  }, [logs])

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return logs.filter((log) => {
      const matchesEventType = eventTypeFilter === 'all' || log.category === eventTypeFilter
      const matchesModule = moduleFilter === 'all' || log.module === moduleFilter
      const matchesAction = actionFilter === 'all' || log.action === actionFilter
      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter
      const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter
      const matchesActor = actorFilter === 'all' || log.actor === actorFilter
      const matchesDate = isWithinDateRange(log.createdAt, dateRange)
      const matchesQuery =
        q === '' ||
        String(log.action).toLowerCase().includes(q) ||
        String(log.actor).toLowerCase().includes(q) ||
        String(log.entityName).toLowerCase().includes(q) ||
        String(log.module).toLowerCase().includes(q) ||
        String(log.description).toLowerCase().includes(q)
      return (
        matchesEventType &&
        matchesModule &&
        matchesAction &&
        matchesSeverity &&
        matchesEntity &&
        matchesActor &&
        matchesDate &&
        matchesQuery
      )
    })
  }, [logs, eventTypeFilter, moduleFilter, actionFilter, severityFilter, entityFilter, actorFilter, dateRange, searchQuery])

  const handleExportAuditLogs = useCallback(() => {
    const headers = [
      'Time',
      'User',
      'Action',
      'Module',
      'Entity',
      'Entity type',
      'Severity',
      'Event type',
      'Summary',
      'Subject ID',
    ]
    const rows = filteredLogs.map((log) => {
      const ts = formatAuditTimeStack(log.createdAt)
      const when =
        log.createdAt && ts.time !== '—'
          ? `${ts.time} · ${ts.date}`
          : ''
      const summary = String(log.description || '').replace(/\r?\n/g, ' ').trim()
      return [
        when,
        log.actor,
        log.action,
        log.module,
        log.entityName,
        subjectTypeLabel(log.entityType),
        log.severity,
        log.category,
        summary,
        log.subjectId != null ? String(log.subjectId) : '',
      ]
    })
    const csv = [headers.map(csvEscapeCell).join(',')]
      .concat(rows.map((r) => r.map(csvEscapeCell).join(',')))
      .join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filteredLogs])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredLogs.slice(start, start + PAGE_SIZE)
  }, [filteredLogs, currentPage])
  const paginatedTimelineItems = useMemo(
    () => paginatedLogs.map(toTimelineItem).filter(Boolean),
    [paginatedLogs]
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, eventTypeFilter, moduleFilter, actionFilter, severityFilter, entityFilter, actorFilter, dateRange])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(AUDIT_VIEW_STORAGE_KEY, viewMode)
    } catch (_) {
      // ignore storage write failures
    }
  }, [viewMode])

  const columns = useMemo(
    () => [
      {
        key: 'createdAt',
        label: 'TIME',
        render: (_, row) => <AuditTableCellTime dateString={row.createdAt} />,
      },
      {
        key: 'actor',
        label: 'USER',
        render: (_, row) => <AuditTableCellActor log={row} />,
      },
      {
        key: 'action',
        label: 'ACTION',
        render: (_, row) => <AuditTableCellAction log={row} />,
      },
      {
        key: 'module',
        label: 'MODULE',
        render: (_, row) => (
          <TableCellText value={String(row.module || '').toUpperCase()} emphasized nowrap className="uppercase tracking-wide" />
        ),
      },
      {
        key: 'entityName',
        label: 'ENTITY',
        render: (_, row) => (
          <AuditTableCellEntity log={row} onOpenEntity={() => openEntityDrawer(row)} />
        ),
      },
      {
        key: 'severity',
        label: 'SEVERITY',
        render: (_, row) => (
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${badgeClass(row.severity, 'severity')}`}>
            {row.severity}
          </span>
        ),
      },
      {
        key: 'category',
        label: 'TYPE',
        render: (_, row) => (
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${badgeClass(row.category)}`}>
            {row.category}
          </span>
        ),
      },
    ],
    [openEntityDrawer]
  )

  const visibleColumns = useMemo(() => {
    const byKey = Object.fromEntries(columns.map((c) => [c.key, c]))
    const out = []
    if (byKey.createdAt) out.push(byKey.createdAt)
    for (const key of columnOrder) {
      if (columnVisibility[key] && byKey[key]) out.push(byKey[key])
    }
    return out
  }, [columns, columnVisibility, columnOrder])

  return (
    <div className="p-4 md:p-6 space-y-6 bg-white min-h-full">
      <AccountsPageHeader
        title="Audit Logs"
        subtitle="Organization-wide trail for CRM, PM, Accounts and all critical system activities."
        breadcrumb={[{ label: 'Audit Logs', href: '/audit-logs' }]}
        showActions
        onExportClick={handleExportAuditLogs}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Events" value={counts.total} subtitle="Who did what, when and where" icon={ClipboardList} colorScheme="orange" />
        <KPICard title="Authentication" value={counts.auth} subtitle="Login, logout, reset, session changes" icon={ShieldCheck} colorScheme="orange" />
        <KPICard title="Data Changes" value={counts.dataChange} subtitle="Create, update, delete, restore operations" icon={Activity} colorScheme="orange" />
        <KPICard title="High Risk" value={counts.highRisk} subtitle="Critical and high severity actions" icon={AlertTriangle} colorScheme="orange" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50/90 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-white/80">
          <p className="text-sm font-semibold text-gray-900">Filters</p>
          <p className="text-xs text-gray-500 mt-0.5">Primary = timeframe & scope · Secondary = people & record details</p>
        </div>
        <div className="p-4 space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-3">Primary filters</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <FilterField label="Date range">
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={selectClassName}>
                  <option value="all">All dates</option>
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </FilterField>
              <FilterField label="Module">
                <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className={selectClassName}>
                  <option value="all">All modules</option>
                  {filterOptions.modules.map((item) => (
                    <option key={item} value={item}>
                      {item.toUpperCase()}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Severity">
                <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={selectClassName}>
                  <option value="all">All severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </FilterField>
              <FilterField label="Search">
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Action, user, entity, module…"
                  className="w-full"
                />
              </FilterField>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-3">Secondary filters</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <FilterField label="User">
                <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)} className={selectClassName}>
                  <option value="all">All users</option>
                  {filterOptions.actors.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Action">
                <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={selectClassName}>
                  <option value="all">All actions</option>
                  {filterOptions.actions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Entity">
                <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className={selectClassName}>
                  <option value="all">All entity types</option>
                  {filterOptions.entities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FilterField>
              <FilterField label="Event type">
                <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value)} className={selectClassName}>
                  <option value="all">All event types ({counts.total})</option>
                  <option value="authentication">Authentication ({counts.auth})</option>
                  <option value="access">User &amp; role changes ({counts.access})</option>
                  <option value="data-change">Data changes ({counts.dataChange})</option>
                  <option value="workspace">Other / workspace</option>
                </select>
              </FilterField>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between text-sm text-gray-600" ref={toolbarRef}>
        <p>
          Showing <span className="font-semibold text-gray-900">{filteredLogs.length}</span> event
          {filteredLogs.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-3">
          <ViewToggleGroup aria-label="Audit logs view">
            <ViewToggleButton active={viewMode === 'table'} title="Table view" onClick={() => setViewMode('table')}>
              <Table2 className="h-[18px] w-[18px]" strokeWidth={2} />
            </ViewToggleButton>
            <ViewToggleButton active={viewMode === 'timeline'} title="Timeline view" onClick={() => setViewMode('timeline')}>
              <GanttChart className="h-[18px] w-[18px]" strokeWidth={2} />
            </ViewToggleButton>
          </ViewToggleGroup>
          {viewMode === 'table' ? (
            <button
              type="button"
              onClick={() => setColumnPickerOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-md transition-colors duration-200 hover:border-gray-400 hover:bg-gray-50"
              title="Show, hide, or reorder columns"
            >
              <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>
          ) : null}
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <TableColumnPicker
          open={viewMode === 'table' && columnPickerOpen}
          description="Time stays visible. Drag column edges in the table to resize."
          reorderableRows={TOGGLEABLE_COLUMNS}
          columnVisibility={columnVisibility}
          columnOrder={columnOrder}
          columnDropIndicator={columnDropIndicator}
          onSetVisible={setColumnVisible}
          onDragStart={handleColumnDragStart}
          onDragEnd={handleColumnDragEnd}
          onRowDragOver={handleColumnRowDragOver}
          onListDragLeave={handleColumnListDragLeave}
          onDrop={handleColumnDrop}
          onReset={resetColumnTablePreferences}
        />
      </div>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <LoadingSpinner size="lg" message="Loading organization audit logs..." />
          </div>
        ) : (
          <>
            {viewMode === 'table' ? (
              <>
                <Table
                  columns={visibleColumns}
                  data={paginatedLogs}
                  keyField="id"
                  variant="modern"
                  onRowClick={setSelectedLog}
                  {...tableResizeProps}
                />
                {paginatedLogs.length === 0 && (
                  <div className="p-12 text-center border-t border-gray-200">
                    <Activity className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No audit events found</h3>
                    <p className="text-sm text-gray-500">Try adjusting filters or search criteria.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 md:p-5">
                <ActivitiesTimeline
                  items={paginatedTimelineItems}
                  onItemClick={(item) => setSelectedLog(item?.__rawLog || null)}
                  className="max-w-none"
                />
              </div>
            )}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredLogs.length}
                  itemsPerPage={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `${selectedLog.action} (${selectedLog.module.toUpperCase()})` : 'Audit Details'}
        size="xl"
      >
        {selectedLog ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Who</p>
                <p className="font-semibold text-gray-900">{selectedLog.actor}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">When</p>
                <p className="font-semibold text-gray-900">{formatDate(selectedLog.createdAt)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Where</p>
                <p className="font-semibold text-gray-900 uppercase">{selectedLog.module}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Entity</p>
                <p className="font-semibold text-gray-900">
                  {selectedLog.entityName} <span className="text-gray-500">({selectedLog.entityType})</span>
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs text-gray-500 mb-1">Action detail</p>
              <p className="text-sm text-gray-800">{selectedLog.description || selectedLog.action}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700">
                  Before JSON
                </div>
                <pre className="p-3 text-xs text-gray-800 overflow-auto max-h-56">{safeJson(selectedLog.before)}</pre>
              </div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-700">
                  After JSON
                </div>
                <pre className="p-3 text-xs text-gray-800 overflow-auto max-h-56">{safeJson(selectedLog.after)}</pre>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3 text-sm text-gray-700 space-y-1">
              <p>
                <span className="font-medium text-gray-900">IP / Device:</span> {selectedLog.ipAddress} / {selectedLog.device}
              </p>
              <p>
                <span className="font-medium text-gray-900">Related records:</span>{' '}
                {Array.isArray(selectedLog.relatedRecords) && selectedLog.relatedRecords.length
                  ? safeJson(selectedLog.relatedRecords)
                  : '—'}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      {entityDrawer && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed top-0 left-0 right-0 bottom-0 z-[100] bg-slate-900/40 backdrop-blur-[2px]"
                aria-label="Close entity panel"
                onClick={closeEntityDrawer}
              />
              <aside
                className="fixed top-0 right-0 bottom-0 z-[101] flex w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-2xl md:max-w-2xl animate-in slide-in-from-right duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="entity-drawer-title"
              >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2 id="entity-drawer-title" className="truncate text-lg font-bold text-gray-900">
                  {entityDrawer.entityName}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {subjectTypeLabel(entityDrawer.entityType)}
                  {entityDrawer.subjectId != null ? ` · ID ${entityDrawer.subjectId}` : ''}
                </p>
                {entityRecordExternalHref(entityDrawer.entityType, entityDrawer.subjectId) ? (
                  <a
                    href={entityRecordExternalHref(entityDrawer.entityType, entityDrawer.subjectId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                  >
                    Open in CRM
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeEntityDrawer}
                className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8">
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Full history</h3>
                <p className="mt-1 text-xs text-gray-500">Select an entry to inspect before/after and metadata below.</p>
                <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                  <ActivitiesTimeline
                    items={entityTimelineItems}
                    loading={entityTimelineLoading}
                    error={entityTimelineError || null}
                    onItemClick={(row) => setEntityDrawerSelectedId(row?.id ?? null)}
                    selectedItemId={entityDrawerSelectedId}
                  />
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Before / after</h3>
                {entityDrawerSelectedNormalized ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                        Before
                      </div>
                      <pre className="max-h-52 overflow-auto p-3 text-xs text-gray-800">
                        {safeJson(entityDrawerSelectedNormalized.before)}
                      </pre>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                        After
                      </div>
                      <pre className="max-h-52 overflow-auto p-3 text-xs text-gray-800">
                        {safeJson(entityDrawerSelectedNormalized.after)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">Select an activity in the timeline above.</p>
                )}
              </section>

              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Metadata</h3>
                <pre className="mt-3 max-h-56 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800">
                  {entityDrawerSelectedRaw
                    ? safeJson({
                        id: entityDrawerSelectedRaw.id,
                        action: entityDrawerSelectedRaw.action,
                        subjectType: entityDrawerSelectedRaw.subjectType,
                        subjectId: entityDrawerSelectedRaw.subjectId,
                        summary: entityDrawerSelectedRaw.summary,
                        meta: parseRowMeta(entityDrawerSelectedRaw.meta),
                        createdAt: entityDrawerSelectedRaw.createdAt,
                      })
                    : '—'}
                </pre>
              </section>

              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Related logs</h3>
                <p className="mt-1 text-xs text-gray-500">
                  Same record in the current audit feed ({entityRelatedPageLogs.length}).
                </p>
                {entityRelatedPageLogs.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No other matching rows in this view.</p>
                ) : (
                  <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {entityRelatedPageLogs.map((l) => (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(l)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-orange-200 hover:bg-orange-50/50"
                        >
                          <span className="font-semibold text-gray-900">{l.action}</span>
                          <span className="mt-0.5 block text-xs text-gray-500 line-clamp-2">
                            {l.description || l.entityName}
                          </span>
                          <span className="mt-1 block text-[10px] font-medium tabular-nums text-gray-400">
                            {(() => {
                              const st = formatAuditTimeStack(l.createdAt)
                              return `${st.time} · ${st.date}`
                            })()}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </aside>
            </>,
            document.body
          )
        : null}
    </div>
  )
}
