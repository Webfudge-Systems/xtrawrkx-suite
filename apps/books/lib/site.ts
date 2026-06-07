import { FUDGE_SUITE_ASSETS } from '@webfudge/utils'

const siteUrl = (process.env.NEXT_PUBLIC_BOOKS_APP_URL || 'http://localhost:3008').replace(/\/$/, '')

export const BOOKS_SITE = {
  brandName: 'Xtrawrkx',
  brandShortName: 'Xtrawrkx',
  legalName: 'Xtrawrkx',
  name: 'Fudge Books',
  shortName: 'Books',
  creatorName: 'Webfudge Systems',
  creatorLine: 'by Webfudge Systems',
  description:
    'Fudge Books is the finance and accounting workspace for receivables, payables, projects, time tracking, and documents across the Xtrawrkx suite.',
  tagline: 'Finance and accounting for service agencies and modern teams.',
  url: siteUrl,
  ...FUDGE_SUITE_ASSETS.xtrawrkx,
  brandLogoPath: FUDGE_SUITE_ASSETS.xtrawrkx.brandLogoPath,
  ogImagePath: FUDGE_SUITE_ASSETS.xtrawrkx.brandLogoPath,
  creatorLogoPath: FUDGE_SUITE_ASSETS.webfudge.brandLogoPath,
  creatorIconPath: FUDGE_SUITE_ASSETS.webfudge.logoPath,
  locale: 'en_US',
  themeColor: '#F5630F',
  backgroundColor: '#FFFAF7',
  twitterHandle: '@xtrawrkx',
  keywords: ['Fudge Books', 'accounting', 'finance', 'invoicing', 'bookkeeping', 'Xtrawrkx'],
} as const
