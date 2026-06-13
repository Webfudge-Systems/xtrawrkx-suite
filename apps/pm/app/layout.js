import './globals.css';
import { AuthProvider } from '@webfudge/auth';
import { xtrawrkxMetadataIcons, FUDGE_SUITE_ASSETS } from '@webfudge/utils';
import LayoutContent from '../components/LayoutContent';
import { PM_SITE } from '../lib/site';

const xAssets = FUDGE_SUITE_ASSETS.xtrawrkx;

export const viewport = {
  themeColor: '#F5630F',
  width: 'device-width',
  initialScale: 1,
};

const siteUrl = (process.env.NEXT_PUBLIC_PM_APP_URL || 'http://localhost:3006').replace(/\/$/, '');
const shareDescription =
  'A modern workspace for projects, tasks, team collaboration, and delivery.';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: PM_SITE.name,
    template: `%s | ${PM_SITE.name}`,
  },
  description: PM_SITE.description,
  applicationName: PM_SITE.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: PM_SITE.name,
  },
  formatDetection: {
    telephone: false,
  },
  keywords: [
    'project management',
    'tasks',
    'team collaboration',
    'delivery',
    'productivity',
    'Webfudge',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: PM_SITE.name,
    description: shareDescription,
    type: 'website',
    images: [
      {
        url: xAssets.brandLogoPath,
        width: 512,
        height: 512,
        alt: PM_SITE.name,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: PM_SITE.name,
    description: shareDescription,
    images: [xAssets.brandLogoPath],
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
  manifest: xAssets.manifestPath,
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
