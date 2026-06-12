'use client'

import Image from 'next/image'
import Link from 'next/link'
import { PanelLeftOpen } from 'lucide-react'
import { SidebarProductBranding } from '../../components/LoginBrandCorner'

/**
 * Slim top bar shown only when the sidebar is fully hidden.
 * Provides open-sidebar control and branding.
 */
export function WorkspaceTopBar({ onOpenSidebar, branding }) {
  return (
    <div className="shrink-0 flex items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-white z-30">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="p-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
        aria-label="Open sidebar"
      >
        <PanelLeftOpen className="w-5 h-5" strokeWidth={1.75} />
      </button>
      {branding?.logoPath ? (
        <Link
          href={branding.homeHref || '/'}
          className="flex items-center gap-2 ml-1 min-w-0"
          aria-label={
            branding.productName || branding.brandName
              ? `${branding.productName || branding.brandName} home`
              : 'Home'
          }
        >
          <Image
            src={branding.logoPath}
            alt={branding.productName || branding.brandName || 'Logo'}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
          />
          {branding.productName ? (
            <div className="hidden sm:block min-w-0">
              <SidebarProductBranding
                productName={branding.productName}
                companyName={branding.companyName}
                className="scale-[0.85] origin-left"
              />
            </div>
          ) : branding.brandName ? (
            <span className="text-sm font-semibold text-gray-900 truncate hidden sm:block">
              {branding.brandName}
            </span>
          ) : null}
        </Link>
      ) : null}
    </div>
  )
}

export default WorkspaceTopBar
