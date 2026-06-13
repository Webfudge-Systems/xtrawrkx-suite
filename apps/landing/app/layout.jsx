import { Poppins, Newsreader } from "next/font/google"; // add imports
import { xtrawrkxMetadataIcons, FUDGE_SUITE_ASSETS } from "@webfudge/utils";
import "./globals.css";
import ToastProvider from "@/src/components/common/ToastProvider";

const xAssets = FUDGE_SUITE_ASSETS.xtrawrkx;

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"], // light, regular, medium, bold
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "200", "400", "700", "500"], // adjust weights as needed
});

export const metadata = {
  title: {
    default: "xtrawrkx - Professional Development & Community Platform",
    template: "%s | xtrawrkx",
  },
  description:
    "xtrawrkx is a comprehensive professional development platform offering events, resources, networking opportunities, and community engagement for career growth and skill development.",
  keywords: [
    "professional development",
    "career growth",
    "networking",
    "events",
    "workshops",
    "resources",
    "community",
    "skill development",
    "professional training",
    "business networking",
  ],
  authors: [{ name: "xtrawrkx Team" }],
  creator: "xtrawrkx",
  publisher: "xtrawrkx",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://xtrawrkx.com"),
  alternates: {
    canonical: "/",
  },
  icons: xtrawrkxMetadataIcons(),
  manifest: xAssets.manifestPath,
  // other: {
  //   "google-site-verification": "your-google-verification-code", // Add your actual verification code when available
  // },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://xtrawrkx.com",
    siteName: "xtrawrkx",
    title: "xtrawrkx - Professional Development & Community Platform",
    description:
      "Join xtrawrkx for professional development, networking events, and community engagement. Discover opportunities for career growth and skill development.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "xtrawrkx - Professional Development Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "xtrawrkx - Professional Development & Community Platform",
    description:
      "Join xtrawrkx for professional development, networking events, and community engagement.",
    images: ["/images/twitter-image.png"],
    creator: "@xtrawrkx",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  //   yahoo: "your-yahoo-verification-code",
  // },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-NS76C2JWEQ"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-NS76C2JWEQ');
            `,
          }}
        />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="canonical" href="https://xtrawrkx.com" />
        <meta name="theme-color" content="#F5630F" />
        <meta name="msapplication-TileColor" content="#F5630F" />
        <meta name="msapplication-TileImage" content={xAssets.pwaIcon512} />
      </head>
      <body
        className={`${poppins.variable} ${newsreader.variable} antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
