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

/** Mobile login form column — Xtrawrkx icon + name, then product credit (text only). */
export function LoginMobileBrandHeader({
  brandIconPath,
  brandLogoPath,
  brandName = 'Xtrawrkx',
  productName,
  creatorLine,
}) {
  const iconSrc = brandIconPath || brandLogoPath

  return (
    <div className="mb-8 lg:hidden">
      {iconSrc ? (
        <div className="flex items-center gap-2.5 mb-4">
          <Image
            src={iconSrc}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-lg object-contain"
            priority
          />
          <span className="font-bold text-lg text-brand-foreground tracking-tight">{brandName}</span>
        </div>
      ) : null}
      {productName ? (
        <LoginProductCredit
          productName={productName}
          creatorLine={creatorLine}
          tone="light"
          className="mb-0"
        />
      ) : null}
    </div>
  )
}
