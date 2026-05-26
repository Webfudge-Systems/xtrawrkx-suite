import "../styles/globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/lib/auth";

const SITE_URL = "https://client.xtrawrkx.com";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Xtrawrkx Client Portal",
    template: "%s | Xtrawrkx Client Portal",
  },
  description:
    "Modern client portal for project management, communities, events, services, and team collaboration. Stay connected with your projects, tasks, and teams in one place.",
  applicationName: "Xtrawrkx Client Portal",
  generator: "Next.js",
  keywords: [
    "Xtrawrkx",
    "Client Portal",
    "Project Management",
    "Communities",
    "Events",
    "Tasks",
    "Collaboration",
    "Business Portal",
  ],
  authors: [{ name: "Xtrawrkx" }],
  creator: "Xtrawrkx",
  publisher: "Xtrawrkx",
  referrer: "strict-origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Xtrawrkx Client Portal",
    title: "Xtrawrkx Client Portal - Manage Projects, Teams & Communities",
    description:
      "Modern client portal for managing projects, communities, events, services, and team collaboration in one unified workspace.",
    locale: "en_US",
    images: [
      {
        url: "/favicon/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Xtrawrkx Client Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Xtrawrkx Client Portal - Manage Projects, Teams & Communities",
    description:
      "Modern client portal for managing projects, communities, events, services, and team collaboration.",
    images: ["/favicon/android-chrome-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      {
        url: "/favicon/favicon-16x16.png",
        type: "image/png",
        sizes: "16x16",
      },
      {
        url: "/favicon/favicon-32x32.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/favicon/android-chrome-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/favicon/android-chrome-512x512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/favicon/favicon.ico"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Xtrawrkx Client",
    statusBarStyle: "default",
  },
  other: {
    "msapplication-TileColor": "#FF4A74",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#FF4A74" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
