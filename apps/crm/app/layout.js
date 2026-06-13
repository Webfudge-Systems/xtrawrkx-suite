import './globals.css';
import { AuthProvider } from '@webfudge/auth';
import { xtrawrkxMetadataIcons, FUDGE_SUITE_ASSETS } from '@webfudge/utils';
import LayoutContent from '../components/LayoutContent';
import { CRM_SITE } from '../lib/site';

const xAssets = FUDGE_SUITE_ASSETS.xtrawrkx;

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
    default: CRM_SITE.name,
    template: `%s | ${CRM_SITE.name}`,
  },
  description: CRM_SITE.description,
  applicationName: CRM_SITE.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: CRM_SITE.name,
  },
  formatDetection: {
    telephone: false,
  },
  keywords: ['CRM', 'sales CRM', 'lead management', 'deal pipeline', 'client accounts'],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: CRM_SITE.name,
    description: shareDescription,
    type: 'website',
    images: [
      {
        url: xAssets.brandLogoPath,
        width: 512,
        height: 512,
        alt: CRM_SITE.name,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: CRM_SITE.name,
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
