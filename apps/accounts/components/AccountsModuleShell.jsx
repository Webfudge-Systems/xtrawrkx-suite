'use client'

import { Card, EmptyState } from '@webfudge/ui'
import AccountsPageHeader from './AccountsPageHeader'

export default function AccountsModuleShell({ title, subtitle, breadcrumb, icon: Icon, description }) {
  return (
    <div className="p-4 space-y-4 bg-white min-h-full">
      <AccountsPageHeader title={title} subtitle={subtitle} breadcrumb={breadcrumb} showSearch />
      <Card glass title={title} subtitle={subtitle}>
        <EmptyState icon={Icon} title={title} description={description} />
      </Card>
    </div>
  )
}
