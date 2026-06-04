const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@webfudge/ui', '@webfudge/auth', '@webfudge/config', '@webfudge/utils'],
  webpack: (config) => {
    config.resolve.alias['@webfudge/auth'] = path.resolve(__dirname, '../../packages/auth/src')
    return config
  },
}

module.exports = nextConfig
