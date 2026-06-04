const { spawnSync } = require('node:child_process')
const withSerwistInit = require('@serwist/next').default

const revision =
  spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout?.trim() ||
  String(Date.now())

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@webfudge/ui', '@webfudge/auth', '@webfudge/utils'],
}

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [{ url: '/~offline', revision }],
})

module.exports = withSerwist(nextConfig)
