'use client'

import Image from 'next/image'

/** Xtrawrkx icon + name — top-left on login branding panels. */
export function LoginBrandCorner({
  brandIconPath,
  brandLogoPath,
  brandName = 'Xtrawrkx',
  className = '',
}) {
  const iconSrc = brandIconPath || brandLogoPath
  if (!iconSrc) return null

  return (
    <div
      className={`absolute top-8 left-8 z-10 flex items-center gap-3 ${className}`.trim()}
    >
      <Image
        src={iconSrc}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-xl object-contain"
        priority
      />
      <span className="text-white font-bold text-xl tracking-tight">{brandName}</span>
    </div>
  )
}

/** Product name + creator line — text only, no icon. */
export function LoginProductCredit({
  productName,
  creatorLine,
  className = '',
  tone = 'on-orange',
}) {
  const onOrange = tone === 'on-orange'

  return (
    <div className={`mb-8 ${className}`.trim()}>
      <p
        className={`font-bold leading-tight ${
          onOrange ? 'text-white text-lg' : 'text-brand-foreground text-base'
        }`}
      >
        {productName}
      </p>
      {creatorLine ? (
        <p className={`text-xs mt-0.5 ${onOrange ? 'text-white/70' : 'text-gray-500'}`}>
          {creatorLine}
        </p>
      ) : null}
    </div>
  )
}

/** Product name + company line — workspace sidebars. */
export function SidebarProductBranding({
  productName,
  companyName = 'Xtrawrkx',
  className = '',
}) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <span className="block font-bold text-xl tracking-tight leading-tight bg-gradient-to-r from-orange-700 via-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(249,115,22,0.35)]">
        {productName}
      </span>
      <span className="block text-xs font-medium text-gray-500 tracking-tight mt-0.5">
        {companyName}
      </span>
    </div>
  )
}

/** Mobile login form column — product mark + product / company names. */
export function LoginMobileBrandHeader({
  brandIconPath,
  brandLogoPath,
  logoPath,
  productName,
  creatorLine = 'Xtrawrkx',
}) {
  const iconSrc = brandIconPath || brandLogoPath || logoPath

  return (
    <div className="mb-8 lg:hidden">
      {iconSrc && productName ? (
        <div className="flex items-center gap-2.5">
          <Image
            src={iconSrc}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-lg object-contain"
            priority
          />
          <SidebarProductBranding productName={productName} companyName={creatorLine} />
        </div>
      ) : null}
    </div>
  )
}
