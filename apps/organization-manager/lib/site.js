import { FUDGE_SUITE_ASSETS } from '@webfudge/utils';

const siteUrl = (
  process.env.NEXT_PUBLIC_ORG_MANAGER_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_ORG_MANAGER_APP_URL ||
  'http://localhost:3004'
).replace(/\/$/, '');

/** Site metadata, SEO, and PWA config — Webfudge Systems Orbit */
export const ORG_MANAGER_SITE = {
  brandName: 'Webfudge Systems',
  brandShortName: 'Webfudge',
  legalName: 'Webfudge Systems',
  name: 'Orbit',
  shortName: 'Orbit',
  description:
    'Orbit — your central hub to manage multiple companies, teams, and access across Webfudge Systems.',
  tagline: 'Your hub for all your companies.',
  url: siteUrl,
  ...FUDGE_SUITE_ASSETS.webfudge,
  brandLogoPath: FUDGE_SUITE_ASSETS.webfudge.brandLogoPath,
  ogImagePath: FUDGE_SUITE_ASSETS.webfudge.brandLogoPath,
  faviconPath: FUDGE_SUITE_ASSETS.webfudge.faviconSvg,
  locale: 'en_US',
  themeColor: '#F5630F',
  backgroundColor: '#FFFAF7',
  keywords: [
    'Webfudge Systems',
    'Orbit',
    'organization management',
    'company management',
    'multi-company',
    'business hub',
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
