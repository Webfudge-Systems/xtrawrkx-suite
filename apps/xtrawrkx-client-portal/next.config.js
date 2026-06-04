const PRODUCTION_STRAPI_URL = 'https://xtrawrkxsuits-production.up.railway.app';
const PRODUCTION_WEBSITE_URL = 'https://xtrawrkx.com';

const strapiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    (process.env.NODE_ENV === 'development'
        ? 'http://localhost:1337'
        : PRODUCTION_STRAPI_URL);

const websiteBaseUrl =
    process.env.NEXT_PUBLIC_XTRAWRKX_WEBSITE_URL ||
    process.env.NEXT_PUBLIC_WEBSITE_URL ||
    (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : PRODUCTION_WEBSITE_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    env: {
        NEXT_PUBLIC_API_URL: strapiBaseUrl,
        NEXT_PUBLIC_STRAPI_URL: strapiBaseUrl,
        NEXT_PUBLIC_XTRAWRKX_WEBSITE_URL: websiteBaseUrl,
    },
    // Optimize for Vercel deployment
    swcMinify: true,

    // Ensure proper static optimization
    poweredByHeader: false,
    reactStrictMode: true,
}

module.exports = nextConfig
