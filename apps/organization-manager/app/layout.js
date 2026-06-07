import './globals.css';
import { webfudgeMetadataIcons } from '@webfudge/utils';
import Providers from '../components/Providers';
import LayoutContent from '../components/LayoutContent';
import { ORG_MANAGER_SITE, orgManagerJsonLd } from '../lib/site';

export const viewport = {
  themeColor: ORG_MANAGER_SITE.themeColor,
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  metadataBase: new URL(ORG_MANAGER_SITE.url),
  title: {
    default: ORG_MANAGER_SITE.name,
    template: `%s | ${ORG_MANAGER_SITE.name}`,
  },
  description: ORG_MANAGER_SITE.description,
  applicationName: ORG_MANAGER_SITE.name,
  authors: [{ name: ORG_MANAGER_SITE.legalName, url: ORG_MANAGER_SITE.url }],
  creator: ORG_MANAGER_SITE.legalName,
  publisher: ORG_MANAGER_SITE.legalName,
  category: 'productivity',
  referrer: 'origin-when-cross-origin',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: ORG_MANAGER_SITE.shortName,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  keywords: ORG_MANAGER_SITE.keywords,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: ORG_MANAGER_SITE.locale,
    url: ORG_MANAGER_SITE.url,
    siteName: ORG_MANAGER_SITE.name,
    title: ORG_MANAGER_SITE.name,
    description: ORG_MANAGER_SITE.tagline,
    images: [
      {
        url: ORG_MANAGER_SITE.ogImagePath,
        width: 512,
        height: 512,
        alt: `${ORG_MANAGER_SITE.brandName} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: ORG_MANAGER_SITE.name,
    description: ORG_MANAGER_SITE.tagline,
    images: [ORG_MANAGER_SITE.ogImagePath],
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
  icons: webfudgeMetadataIcons(),
  manifest: ORG_MANAGER_SITE.manifestPath,
};

export default function RootLayout({ children }) {
  const jsonLd = orgManagerJsonLd();

  return (
    <html lang="en">
      <body className="bg-gray-50">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
