/** Shared public asset paths for Fudge Suite workspace apps. */
export const FUDGE_SUITE_ASSETS = {
  xtrawrkx: {
    logoPath: '/favicon_io/android-chrome-512x512.png',
    brandLogoPath: '/logo/xtrawrkx_logo_full.png',
    manifestPath: '/favicon_io/site.webmanifest',
    faviconIco: '/favicon_io/favicon.ico',
    favicon16: '/favicon_io/favicon-16x16.png',
    favicon32: '/favicon_io/favicon-32x32.png',
    appleTouchIcon: '/favicon_io/apple-touch-icon.png',
    pwaIcon192: '/favicon_io/android-chrome-192x192.png',
    pwaIcon512: '/favicon_io/android-chrome-512x512.png',
  },
  webfudge: {
    logoPath: '/favicon/web-app-manifest-512x512.png',
    brandLogoPath: '/logo/Vertical logo 1 bg removed.png',
    manifestPath: '/favicon/site.webmanifest',
    faviconSvg: '/favicon/favicon.svg',
    favicon96: '/favicon/favicon-96x96.png',
    appleTouchIcon: '/favicon/apple-touch-icon.png',
    pwaIcon192: '/favicon/web-app-manifest-192x192.png',
    pwaIcon512: '/favicon/web-app-manifest-512x512.png',
  },
}

export function xtrawrkxMetadataIcons() {
  const { faviconIco, favicon16, favicon32, appleTouchIcon } = FUDGE_SUITE_ASSETS.xtrawrkx
  return {
    icon: [
      { url: faviconIco },
      { url: favicon32, sizes: '32x32', type: 'image/png' },
      { url: favicon16, sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: appleTouchIcon, sizes: '180x180', type: 'image/png' }],
    shortcut: [faviconIco],
  }
}

export function webfudgeMetadataIcons() {
  const { faviconSvg, favicon96, appleTouchIcon } = FUDGE_SUITE_ASSETS.webfudge
  return {
    icon: [
      { url: faviconSvg, type: 'image/svg+xml' },
      { url: favicon96, sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: appleTouchIcon, sizes: '180x180', type: 'image/png' }],
    shortcut: [faviconSvg],
  }
}
