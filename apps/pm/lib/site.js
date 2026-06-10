import { FUDGE_SUITE_ASSETS } from '@webfudge/utils'

const siteUrl = (process.env.NEXT_PUBLIC_PM_APP_URL || 'http://localhost:3006').replace(/\/$/, '')

export const PM_SITE = {
  brandName: 'Xtrawrkx',
  brandShortName: 'Xtrawrkx',
  legalName: 'Xtrawrkx',
  name: 'Fudge Work',
  shortName: 'Work',
  description:
    'Fudge Work is the project management workspace for projects, tasks, teams, messages, and delivery across the Xtrawrkx suite.',
  tagline: 'Track projects, tasks, and your team in one place.',
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
  keywords: ['Fudge Work', 'project management', 'tasks', 'team collaboration', 'delivery', 'Xtrawrkx'],
}
