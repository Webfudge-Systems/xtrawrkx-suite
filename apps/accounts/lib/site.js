const siteUrl = (process.env.NEXT_PUBLIC_ACCOUNTS_APP_URL || 'http://localhost:3003').replace(/\/$/, '')

export const ACCOUNTS_SITE = {
  brandName: 'Xtrawrkx',
  brandShortName: 'Xtrawrkx',
  legalName: 'Xtrawrkx',
  name: 'Fudge Base',
  shortName: 'Fudge Base',
  description:
    'Fudge Base is the organization administration workspace for users, roles, departments, teams, security, billing, app access, and audit logs across the Xtrawrkx suite.',
  tagline: 'Manage your organization—users, roles, security, billing, and compliance.',
  url: siteUrl,
  logoPath: '/favicon/web-app-manifest-512x512.png',
  ogImagePath: '/favicon/web-app-manifest-512x512.png',
  locale: 'en_US',
  themeColor: '#F5630F',
  backgroundColor: '#FFFAF7',
  twitterHandle: '@xtrawrkx',
  keywords: [
    'Fudge Base',
    'organization admin',
    'user management',
    'roles and permissions',
    'RBAC',
    'teams',
    'departments',
    'billing',
    'audit logs',
    'Xtrawrkx',
  ],
}

export function accountsJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: ACCOUNTS_SITE.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: ACCOUNTS_SITE.description,
    url: ACCOUNTS_SITE.url,
    image: `${ACCOUNTS_SITE.url}${ACCOUNTS_SITE.ogImagePath}`,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      category: 'SaaS',
    },
    publisher: {
      '@type': 'Organization',
      name: ACCOUNTS_SITE.legalName,
      url: ACCOUNTS_SITE.url,
    },
  }
}
