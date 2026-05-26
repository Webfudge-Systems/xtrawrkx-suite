import { eventService, resourceService, serviceService, galleryService } from "@/src/services/databaseService";

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://xtrawrkx.com';

    // Static pages
    const staticPages = [
        '',
        '/about',
        '/services',
        '/communities',
        '/events',
        '/resources',
        '/gallery',
        '/teams',
        '/contact-us',
        '/modals',
        '/sitemap',
        '/privacy-policy',
        '/terms-of-service',
    ];

    try {
        // Fetch dynamic data from Firebase
        const [services, events, resources] = await Promise.all([
            serviceService.getAll().catch(() => []),
            eventService.getAll().catch(() => []),
            resourceService.getAll().catch(() => [])
        ]);

        // Dynamic pages
        const servicePages = services
            .filter(service => service.slug)
            .map(service => `/services/${service.slug}`);

        const eventPages = events
            .filter(event => event.slug)
            .map(event => `/events/${event.slug}`);

        const resourcePages = resources
            .filter(resource => resource.slug)
            .map(resource => `/resources/${resource.slug}`);

        // Combine all pages
        const allPages = [
            ...staticPages,
            ...servicePages,
            ...eventPages,
            ...resourcePages,
        ];

        // Generate XML
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${getChangeFreq(page)}</changefreq>
    <priority>${getPriority(page)}</priority>
  </url>`).join('\n')}
</urlset>`;

        return new Response(sitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            },
        });

    } catch (error) {


        // Fallback to static pages only if Firebase fails
        const fallbackPages = [...staticPages];

        const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${fallbackPages.map(page => `  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${getChangeFreq(page)}</changefreq>
    <priority>${getPriority(page)}</priority>
  </url>`).join('\n')}
</urlset>`;

        return new Response(fallbackSitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600', // Shorter cache for fallback
            },
        });
    }
}

function getChangeFreq(page) {
    if (page === '' || page === '/about' || page === '/contact-us') {
        return 'weekly';
    }
    if (page.startsWith('/events/')) {
        return 'weekly';
    }
    if (page.startsWith('/resources/')) {
        return 'monthly';
    }
    return 'monthly';
}

function getPriority(page) {
    if (page === '') return '1.0'; // Homepage
    if (page === '/about' || page === '/services' || page === '/contact-us') {
        return '0.9';
    }
    if (page === '/communities' || page === '/events' || page === '/resources' || page === '/teams' || page === '/gallery') {
        return '0.8';
    }
    if (page.startsWith('/services/')) {
        return '0.7';
    }
    if (page.startsWith('/events/') || page.startsWith('/resources/')) {
        return '0.6';
    }
    return '0.5';
} 