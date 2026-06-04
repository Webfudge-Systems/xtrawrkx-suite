'use client'

import { Modal, Input, EmptyState } from '@webfudge/ui'
import { Search } from 'lucide-react'

export default function GlobalSearchModal({ isOpen, onClose, initialQuery = '' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Accounts" maxWidth="xl">
      <div className="space-y-4">
        <Input placeholder="Search users, roles, departments..." icon={Search} defaultValue={initialQuery} />
        <EmptyState
          icon={Search}
          title="Search is coming soon"
          description="Global search wiring will use the same backend pattern as CRM/PM."
        />
      </div>
    </Modal>
  )
}
