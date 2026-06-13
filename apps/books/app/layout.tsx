import './globals.css'
import { AuthProvider } from '@webfudge/auth'
import { xtrawrkxMetadataIcons, FUDGE_SUITE_ASSETS } from '@webfudge/utils'
import LayoutContent from '@/components/layout/LayoutContent'
import { BooksThemeProvider } from '@/components/theme/BooksThemeProvider'
import { BOOKS_SITE } from '@/lib/site'

const xAssets = FUDGE_SUITE_ASSETS.xtrawrkx

export const metadata = {
  title: {
    default: BOOKS_SITE.name,
    template: `%s | ${BOOKS_SITE.name}`,
  },
  description: BOOKS_SITE.description,
  applicationName: BOOKS_SITE.name,
  openGraph: {
    title: BOOKS_SITE.name,
    description: BOOKS_SITE.description,
    type: 'website',
    images: [
      {
        url: xAssets.brandLogoPath,
        width: 512,
        height: 512,
        alt: BOOKS_SITE.name,
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: BOOKS_SITE.name,
    description: BOOKS_SITE.description,
    images: [xAssets.brandLogoPath],
  },
  icons: xtrawrkxMetadataIcons(),
  manifest: xAssets.manifestPath,
}

const BOOKS_THEME_BOOT_SCRIPT = `
(function() {
  try {
    var theme = localStorage.getItem('books-theme');
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOKS_THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <BooksThemeProvider>
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
          </AuthProvider>
        </BooksThemeProvider>
      </body>
    </html>
  )
}
