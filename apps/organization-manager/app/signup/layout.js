import { ORG_MANAGER_SITE } from '../../lib/site';

export const metadata = {
  title: 'Sign up',
  description: `Request access to ${ORG_MANAGER_SITE.name}.`,
  alternates: {
    canonical: '/signup',
  },
  openGraph: {
    title: `Sign up | ${ORG_MANAGER_SITE.name}`,
    description: ORG_MANAGER_SITE.tagline,
    url: `${ORG_MANAGER_SITE.url}/signup`,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `Sign up | ${ORG_MANAGER_SITE.name}`,
    description: ORG_MANAGER_SITE.tagline,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupLayout({ children }) {
  return children;
}
