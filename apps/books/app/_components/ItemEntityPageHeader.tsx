'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Edit, Share2 } from 'lucide-react'
import BooksEntityPageHeader, { type BooksEntityBreadcrumb } from '@/app/_components/BooksEntityPageHeader'
import { useBooksToast } from '@/app/_components/useBooksToast'
import { BooksTopbarIconButton } from '@/components/layout/BooksTopbarShared'
import type { ItemRow } from '@/lib/mock-data'

type ItemEntityPageHeaderProps = {
  title: string
  subtitle?: string
  breadcrumb: BooksEntityBreadcrumb[]
  item?: ItemRow | null
  showToolbar?: boolean
}

/** Entity header with functional edit / share / download + notifications (via BooksEntityPageHeader). */
export default function ItemEntityPageHeader({
  title,
  subtitle,
  breadcrumb,
  item,
  showToolbar = true,
}: ItemEntityPageHeaderProps) {
  const router = useRouter()
  const { toast, Toast } = useBooksToast()

  const handleShare = useCallback(async () => {
    if (!item || typeof window === 'undefined') return
    const url = `${window.location.origin}/items/all/${item.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: item.name, url })
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
  }, [item, toast])

  const handleDownload = useCallback(() => {
    if (!item || typeof window === 'undefined') return
    const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `item-${item.id}-${item.sku || 'export'}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast('Item exported')
  }, [item, toast])

  const utilityActions =
    showToolbar && item ? (
      <>
        <BooksTopbarIconButton title="Edit" onClick={() => router.push(`/items/all/${item.id}/edit`)}>
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
