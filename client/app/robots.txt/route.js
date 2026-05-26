export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://xtrawrkx.com';

    const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/

# Allow specific important pages
Allow: /
Allow: /about
Allow: /services
Allow: /communities
Allow: /events
Allow: /resources
Allow: /gallery
Allow: /contact-us
Allow: /sitemap

# Crawl delay (optional)
Crawl-delay: 1`;

    return new Response(robots, {
        headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
    });
} 