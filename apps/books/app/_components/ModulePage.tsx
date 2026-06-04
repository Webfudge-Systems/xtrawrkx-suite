'use client'

import { useMemo } from 'react'
import { Archive, CheckCircle2, FileText, Layers } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'

type ModulePageProps = {
  title: string
  subtitle?: string
  columns?: Array<{ key: string; title: string }>
  data?: Array<Record<string, string | number>>
  addHref?: string
  addLabel?: string
}

export default function ModulePage({
  title,
  subtitle,
  columns,
  data,
  addHref,
  addLabel = `Add ${title.replace(/^All\s+/i, '').replace(/s$/, '')}`,
}: ModulePageProps) {
  const defaultColumns = useMemo(
    () =>
      columns ?? [
        { key: 'name', title: 'Name' },
        { key: 'status', title: 'Status' },
        { key: 'updatedAt', title: 'Updated' },
      ],
    [columns]
  )

  const tableData = useMemo(
    () =>
      data ?? [
        { id: 1, name: `${title} Record`, status: 'Active', updatedAt: 'Today' },
        { id: 2, name: `${title} Draft`, status: 'Draft', updatedAt: 'Yesterday' },
      ],
    [data, title]
  )

  const kpis = useMemo(() => {
    const total = tableData.length
    const active = tableData.filter((r) => String(r.status).toLowerCase() === 'active').length
    const draft = tableData.filter((r) => String(r.status).toLowerCase() === 'draft').length
    return [
      { title: 'Total records', value: total, subtitle, icon: Layers },
      { title: 'Active', value: active, icon: CheckCircle2 },
      { title: 'Draft', value: draft, icon: FileText },
      { title: 'Archived', value: Math.max(0, total - active - draft), icon: Archive },
    ]
  }, [tableData, subtitle])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All', count: tableData.length },
      {
        key: 'active',
        label: 'Active',
        count: tableData.filter((r) => String(r.status).toLowerCase() === 'active').length,
      },
      {
        key: 'draft',
        label: 'Draft',
        count: tableData.filter((r) => String(r.status).toLowerCase() === 'draft').length,
      },
    ],
    [tableData]
  )

  return (
    <BooksListPageShell
      title={title}
      subtitle={subtitle}
      kpis={kpis}
      tabs={tabs}
      columns={defaultColumns}
      data={tableData as Record<string, unknown>[]}
      emptyIcon={FileText}
      emptyTitle={`No ${title.toLowerCase()} yet`}
      emptyDescription={subtitle ?? `Create your first ${title.toLowerCase()} record.`}
      addHref={addHref}
      addLabel={addLabel}
      searchPlaceholder="Search records..."
      exportFilePrefix="books-module"
    />
  )
}
