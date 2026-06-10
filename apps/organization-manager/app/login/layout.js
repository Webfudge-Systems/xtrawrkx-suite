import { ORG_MANAGER_SITE } from '../../lib/site';

export const metadata = {
  title: 'Sign in',
  description: `Sign in to ${ORG_MANAGER_SITE.name} to manage your companies and organizations.`,
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: `Sign in | ${ORG_MANAGER_SITE.name}`,
    description: ORG_MANAGER_SITE.tagline,
    url: `${ORG_MANAGER_SITE.url}/login`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `Sign in | ${ORG_MANAGER_SITE.name}`,
    description: ORG_MANAGER_SITE.tagline,
  },
  robots: {
    index: true,
    follow: false,
  },
};

export default function LoginLayout({ children }) {
  return children;
}
