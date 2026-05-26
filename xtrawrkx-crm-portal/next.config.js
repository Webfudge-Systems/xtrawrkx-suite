/** @type {import('next').NextConfig} */
const nextConfig = {
    // Production optimizations
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,

    // Performance optimizations
    swcMinify: true,

    // Image optimization
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
    },

    experimental: {
        externalDir: true,
        // Fewer modules on first compile — avoids dev ChunkLoadError when the server is still building
        optimizePackageImports: [
            'lucide-react',
            'recharts',
            'react-icons',
            'date-fns',
        ],
    },

    webpack: (config, { dev }) => {
        if (dev && config.output) {
            config.output.chunkLoadTimeout = 300000
        }
        return config
    },

    // Security headers
    async headers() {
        return [
            {
                // Apply security headers to all routes
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Robots-Tag',
                        value: 'noindex, nofollow, nocache, noarchive, nosnippet, noimageindex'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains'
                    }
                ]
            }
        ]
    }
}

module.exports = nextConfig
