const siteUrl = (
  process.env.NEXT_PUBLIC_ORG_MANAGER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_ORG_MANAGER_APP_URL ||
  'http://localhost:3004'
).replace(/\/$/, '');

/** Site metadata, SEO, and PWA config for the Xtrawrkx Organization Manager (Orbit) */
export const ORG_MANAGER_SITE = {
  // Brand identity
  brandName: 'Xtrawrkx',
  brandShortName: 'Xtrawrkx',
  legalName: 'Xtrawrkx',
  name: 'Fudge Orbit',
  shortName: 'Fudge Orbit',
  description:
    'Fudge Orbit is the platform super-admin workspace to create, configure, and manage tenant organizations, teams, and access across the Xtrawrkx suite.',
  tagline: 'Create and manage organizations, teams, and platform access.',

  // URLs and paths
  url: siteUrl,
  faviconPath: '/favicon/favicon.svg',
  ogImagePath: '/favicon/web-app-manifest-512x512.png',

  // Theme
  locale: 'en_US',
  themeColor: '#FF4A74',
  backgroundColor: '#FFFFFF',

  // Social
  twitterHandle: '@xtrawrkx',

  // SEO keywords
  keywords: [
    'Xtrawrkx',
    'Orbit',
    'organization management',
    'team management',
    'platform administration',
    'multi-tenant',
    'super admin',
  ],
};

/** @deprecated Use ORG_MANAGER_SITE */
export const LANDING_SITE = ORG_MANAGER_SITE;

export function orgManagerJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: ORG_MANAGER_SITE.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: ORG_MANAGER_SITE.description,
    url: ORG_MANAGER_SITE.url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      category: 'SaaS',
    },
    publisher: {
      '@type': 'Organization',
      name: ORG_MANAGER_SITE.legalName,
      url: ORG_MANAGER_SITE.url,
    },
  };
}

/** @deprecated Use orgManagerJsonLd */
export function landingJsonLd() {
  return orgManagerJsonLd();
}
