'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ORG_MANAGER_SITE } from '../../lib/site'

export default function Logo() {
  return (
    <Link href="/" className="flex items-center shrink-0" aria-label={`${ORG_MANAGER_SITE.brandName} Home`}>
      <Image
        src={ORG_MANAGER_SITE.logoPath}
        alt={ORG_MANAGER_SITE.brandName}
        width={160}
        height={160}
        priority
        className="h-10 w-auto md:h-12 md:w-auto"
      />
    </Link>
  )
}
