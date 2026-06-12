import './globals.css'
import { AuthProvider } from '@webfudge/auth'
import LayoutContent from '../components/LayoutContent'
import { ACCOUNTS_SITE } from '../lib/site'

const siteUrl = (process.env.NEXT_PUBLIC_ACCOUNTS_APP_URL || 'http://localhost:3003').replace(/\/$/, '')
const shareDescription =
  'A modern workspace for managing your organization—users, roles, departments, security, and compliance.'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: ACCOUNTS_SITE.name,
    template: `%s | ${ACCOUNTS_SITE.name}`,
  },
  description: ACCOUNTS_SITE.description,
  applicationName: ACCOUNTS_SITE.name,
  keywords: [
    'accounts',
    'organization admin',
    'user management',
    'roles and permissions',
    'RBAC',
    'teams',
    'departments',
    'audit logs',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: ACCOUNTS_SITE.name,
    description: shareDescription,
    type: 'website',
    images: [
      {
        url: '/favicon/web-app-manifest-512x512.png',
        width: 512,
        height: 512,
        alt: ACCOUNTS_SITE.name,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: ACCOUNTS_SITE.name,
    description: shareDescription,
    images: ['/favicon/web-app-manifest-512x512.png'],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  icons: {
    icon: [
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon/favicon.svg'],
  },
  manifest: '/favicon/site.webmanifest',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  )
}
