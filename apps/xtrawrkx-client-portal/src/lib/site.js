const siteUrl = (
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || "http://localhost:3002"
).replace(/\/$/, "");

export const PORTAL_SITE = {
  brandName: "Xtrawrkx",
  brandShortName: "Xtrawrkx",
  name: "Client Portal",
  shortName: "Portal",
  creatorName: "Webfudge Systems",
  creatorLine: "by Webfudge Systems",
  description:
    "Xtrawrkx Client Portal — access projects, communities, and collaborate with your team.",
  tagline: "Sign in to access your projects and collaborate with your team.",
  url: siteUrl,
  logoPath: "/favicon/logo.png",
  brandLogoPath: "/favicon/logo_full.png",
  locale: "en_US",
  themeColor: "#F5630F",
  backgroundColor: "#FFFAF7",
};
