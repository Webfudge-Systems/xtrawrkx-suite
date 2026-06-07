import './globals.css'
import { AuthProvider } from '@webfudge/auth'
import { xtrawrkxMetadataIcons } from '@webfudge/utils'
import LayoutContent from '../components/LayoutContent'
import { ACCOUNTS_SITE } from '../lib/site'

const siteUrl = ACCOUNTS_SITE.url
const shareDescription =
  'A modern workspace for managing your organization—users, roles, security, billing, and compliance.'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: ACCOUNTS_SITE.name,
    template: `%s | ${ACCOUNTS_SITE.name}`,
  },
  description: ACCOUNTS_SITE.description,
  applicationName: ACCOUNTS_SITE.name,
  keywords: ACCOUNTS_SITE.keywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: ACCOUNTS_SITE.name,
    description: shareDescription,
    type: 'website',
    images: [
      {
        url: ACCOUNTS_SITE.ogImagePath,
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
    images: [ACCOUNTS_SITE.ogImagePath],
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
  icons: xtrawrkxMetadataIcons(),
  manifest: ACCOUNTS_SITE.manifestPath,
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
