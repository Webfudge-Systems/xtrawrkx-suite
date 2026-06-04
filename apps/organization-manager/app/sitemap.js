import { ORG_MANAGER_SITE } from '../lib/site';

/** Public entry routes for the Organization Manager app */
export default function sitemap() {
  const lastModified = new Date();
  const publicRoutes = ['/login', '/signup'];

  return publicRoutes.map((path) => ({
    url: `${ORG_MANAGER_SITE.url}${path}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: path === '/login' ? 0.8 : 0.5,
  }));
}
