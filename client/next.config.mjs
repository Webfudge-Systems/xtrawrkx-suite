/** @type {import('next').NextConfig} */
const nextConfig = {
    // Basic image optimization only
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],
    },

    // Basic performance optimizations
    compress: true,
    poweredByHeader: false,
};

export default nextConfig;
