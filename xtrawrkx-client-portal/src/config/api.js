const PRODUCTION_STRAPI_URL = 'https://xtrawrkxsuits-production.up.railway.app';
const DEVELOPMENT_STRAPI_URL = 'http://localhost:1337';

/**
 * Strapi base URL (no /api suffix). Env vars override; production builds default to Railway.
 */
export function getStrapiBaseUrl() {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    }
    if (process.env.NEXT_PUBLIC_STRAPI_URL) {
        return process.env.NEXT_PUBLIC_STRAPI_URL.replace(/\/$/, '');
    }
    if (process.env.NODE_ENV === 'development') {
        return DEVELOPMENT_STRAPI_URL;
    }
    return PRODUCTION_STRAPI_URL;
}

export const STRAPI_BASE_URL = getStrapiBaseUrl();
