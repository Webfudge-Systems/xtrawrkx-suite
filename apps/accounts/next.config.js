/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@webfudge/ui', '@webfudge/auth', '@webfudge/utils'],
  // Public env: use apps/accounts/.env.production or hosting dashboard (NEXT_PUBLIC_* inlined at build).
}

module.exports = nextConfig
