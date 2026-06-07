import './globals.css';
import { AuthProvider } from '@webfudge/auth';
import { xtrawrkxMetadataIcons } from '@webfudge/utils';
import LayoutContent from '../components/LayoutContent';
import { PM_SITE } from '../lib/site';

export const viewport = {
  themeColor: '#F5630F',
  width: 'device-width',
  initialScale: 1,
};

const siteUrl = PM_SITE.url;
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
    title: PM_SITE.shortName,
  },
  formatDetection: {
    telephone: false,
  },
  keywords: PM_SITE.keywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: PM_SITE.name,
    description: shareDescription,
    type: 'website',
    images: [
      {
        url: PM_SITE.ogImagePath,
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
    images: [PM_SITE.ogImagePath],
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
  manifest: PM_SITE.manifestPath,
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
