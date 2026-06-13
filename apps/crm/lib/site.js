import { FUDGE_SUITE_ASSETS } from '@webfudge/utils'

const siteUrl = (process.env.NEXT_PUBLIC_CRM_APP_URL || 'http://localhost:3007').replace(/\/$/, '')

export const CRM_SITE = {
  brandName: 'Xtrawrkx',
  brandShortName: 'Xtrawrkx',
  legalName: 'Xtrawrkx',
  name: 'Fudge Grow',
  shortName: 'Grow',
  description:
    'Fudge Grow is the sales CRM workspace for leads, deals, contacts, client accounts, and pipeline management across the Xtrawrkx suite.',
  tagline: 'Manage leads, deals, contacts, and your pipeline in one place.',
  loginTagline: 'Close more deals, faster.',
  loginDetail:
    'Sign in to manage leads, contacts, deals, and your sales pipeline from one workspace.',
  loginFeatures: [
    { value: 'Capture', label: 'Leads' },
    { value: 'Close', label: 'Deals' },
    { value: 'Grow', label: 'Pipeline' },
  ],
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
  keywords: ['Fudge Grow', 'CRM', 'sales CRM', 'lead management', 'deal pipeline', 'Xtrawrkx'],
}
