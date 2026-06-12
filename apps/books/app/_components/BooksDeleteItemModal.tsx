'use client'

import { Button, Modal } from '@webfudge/ui'
import { Trash2 } from 'lucide-react'

type BooksDeleteItemModalProps = {
  isOpen: boolean
  itemName?: string
  entityLabel?: string
  deleting?: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function BooksDeleteItemModal({
  isOpen,
  itemName,
  entityLabel = 'Item',
  deleting = false,
  onClose,
  onConfirm,
}: BooksDeleteItemModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (deleting) return
        onClose()
      }}
      title={`Delete ${entityLabel}`}
      size="md"
      theme="books"
      closeOnBackdrop={!deleting}
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-300">This action cannot be undone</p>
            {itemName ? (
              <p className="text-sm text-[var(--books-text-secondary,#9ca3af)]">
                You are about to delete <span className="font-medium text-[var(--books-text-primary,#f8fafc)]">{itemName}</span>.
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="muted"
            disabled={deleting}
            className="!border-0 !bg-[var(--books-bg-card,#1f2937)] !text-[var(--books-text-secondary,#9ca3af)] !shadow-none hover:!bg-[var(--books-surface-muted,#2a2e38)] hover:!text-[var(--books-text-primary,#f8fafc)]"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={deleting}
            onClick={onConfirm}
            className="min-w-[9rem] rounded-xl py-2.5"
          >
            {deleting ? 'Deleting…' : `Delete ${entityLabel}`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
