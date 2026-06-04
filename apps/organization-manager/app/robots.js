import { ORG_MANAGER_SITE } from '../lib/site';

/** Private admin workspace — block indexing of authenticated app surfaces. */
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
    sitemap: `${ORG_MANAGER_SITE.url}/sitemap.xml`,
    host: ORG_MANAGER_SITE.url,
  };
}
