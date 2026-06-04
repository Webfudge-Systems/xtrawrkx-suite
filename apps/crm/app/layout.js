import './globals.css';
import { AuthProvider } from '@webfudge/auth';
import LayoutContent from '../components/LayoutContent';

export const viewport = {
  themeColor: '#F5630F',
  width: 'device-width',
  initialScale: 1,
};

const siteUrl = (process.env.NEXT_PUBLIC_CRM_APP_URL || 'http://localhost:3007').replace(/\/$/, '');
const shareDescription =
  'A modern CRM workspace for leads, deals, client accounts, projects, and communication workflows.';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Fudge People',
    template: '%s | Fudge People',
  },
  description:
    'Fudge People for lead management, deals, accounts, projects, invoices, and team collaboration.',
  applicationName: 'Fudge People',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fudge People',
  },
  formatDetection: {
    telephone: false,
  },
  keywords: ['CRM', 'sales CRM', 'lead management', 'deal pipeline', 'client accounts'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Fudge People',
    description: shareDescription,
    type: 'website',
    images: [
      {
        url: '/favicon/web-app-manifest-512x512.png',
        width: 512,
        height: 512,
        alt: 'Fudge People',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Fudge People',
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
