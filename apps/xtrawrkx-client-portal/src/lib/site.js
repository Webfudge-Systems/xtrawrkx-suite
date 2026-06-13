import { FUDGE_SUITE_ASSETS } from "@webfudge/utils";

const siteUrl = (
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || "http://localhost:3002"
).replace(/\/$/, "");

export const PORTAL_SITE = {
  brandName: "Xtrawrkx",
  brandShortName: "Xtrawrkx",
  name: "Client Portal",
  shortName: "Portal",
  description:
    "Xtrawrkx Client Portal — access projects, communities, and collaborate with your team.",
  tagline: "Sign in to access your projects and collaborate with your team.",
  url: siteUrl,
  ...FUDGE_SUITE_ASSETS.xtrawrkx,
  brandLogoPath: FUDGE_SUITE_ASSETS.xtrawrkx.brandLogoPath,
  ogImagePath: FUDGE_SUITE_ASSETS.xtrawrkx.brandLogoPath,
  locale: "en_US",
  themeColor: "#F5630F",
  backgroundColor: "#FFFAF7",
};
