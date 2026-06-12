'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Edit, Share2 } from 'lucide-react'
import BooksEntityPageHeader, { type BooksEntityBreadcrumb } from '@/app/_components/BooksEntityPageHeader'
import { useBooksToast } from '@/app/_components/useBooksToast'
import { BooksTopbarIconButton } from '@/components/layout/BooksTopbarShared'

type RecordEntity = { id: number; name: string }

type BooksRecordEntityPageHeaderProps = {
  title: string
  subtitle?: string
  breadcrumb: BooksEntityBreadcrumb[]
  basePath: string
  record?: RecordEntity | null
  exportPrefix?: string
  showToolbar?: boolean
}

export default function BooksRecordEntityPageHeader({
  title,
  subtitle,
  breadcrumb,
  basePath,
  record,
  exportPrefix = 'record',
  showToolbar = true,
}: BooksRecordEntityPageHeaderProps) {
  const router = useRouter()
  const { toast, Toast } = useBooksToast()

  const handleShare = useCallback(async () => {
    if (!record || typeof window === 'undefined') return
    const url = `${window.location.origin}${basePath}/${record.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: record.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast('Link copied to clipboard')
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      try {
        await navigator.clipboard.writeText(url)
        toast('Link copied to clipboard')
      } catch {
        toast('Could not share link')
      }
    }
  }, [basePath, record, toast])

  const handleDownload = useCallback(() => {
    if (!record || typeof window === 'undefined') return
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportPrefix}-${record.id}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast('Record exported')
  }, [exportPrefix, record, toast])

  const utilityActions =
    showToolbar && record ? (
      <>
        <BooksTopbarIconButton title="Edit" onClick={() => router.push(`${basePath}/${record.id}/edit`)}>
          <Edit className="h-4 w-4" />
        </BooksTopbarIconButton>
        <BooksTopbarIconButton title="Share" onClick={() => void handleShare()}>
          <Share2 className="h-4 w-4" />
        </BooksTopbarIconButton>
        <BooksTopbarIconButton title="Download JSON" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </BooksTopbarIconButton>
      </>
    ) : null

  return (
    <>
      {Toast}
      <BooksEntityPageHeader
        title={title}
        subtitle={subtitle}
        breadcrumb={breadcrumb}
        utilityActions={utilityActions}
      />
    </>
  )
}
