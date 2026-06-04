'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ORG_MANAGER_SITE } from '../../../lib/site'

export default function AuthBrandingSide({
  title,
  subtitle,
  description = 'We provide all the tools that simplify your mobility operations and fleet management without any further requirements.',
}) {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 py-20">
      <div className="flex items-center mb-12">
        <Link
          href="/"
          className="w-32 h-32 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Image
            src={ORG_MANAGER_SITE.logoPath}
            alt={ORG_MANAGER_SITE.brandName}
            width={200}
            height={200}
            className="w-full h-full object-contain"
          />
        </Link>
      </div>

      <div className="max-w-lg">
        <h1 className="text-6xl font-bold text-brand-dark mb-8 leading-tight">{title}</h1>
        <h2 className="text-2xl text-brand-dark mb-8 font-medium">{subtitle}</h2>
        <p className="text-brand-dark/90 text-xl leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
