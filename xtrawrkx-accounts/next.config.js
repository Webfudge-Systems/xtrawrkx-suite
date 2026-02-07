/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@xtrawrkx/ui', '@xtrawrkx/utils'],
    env: {
        NEXT_PUBLIC_STRAPI_URL:
            process.env.NEXT_PUBLIC_STRAPI_URL ||
            (process.env.NODE_ENV === 'development' ? 'http://localhost:1337' : 'https://xtrawrkxsuits-production.up.railway.app'),
    },
    async rewrites() {
        const base = process.env.NEXT_PUBLIC_STRAPI_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:1337' : 'https://xtrawrkxsuits-production.up.railway.app');
        return [
            {
                source: '/api/:path*',
                destination: `${base}/api/:path*`,
            },
        ];
    },
}

module.exports = nextConfig
