'use client'

import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import { Button } from '@webfudge/ui'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full text-center bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-5">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
        <p className="text-gray-600 mb-6">
          This portal is restricted to platform super administrators. Use the Accounts or PM apps with your organization credentials.
        </p>
        <Link href="/login">
          <Button variant="primary">Back to admin login</Button>
        </Link>
      </div>
    </div>
  )
}
