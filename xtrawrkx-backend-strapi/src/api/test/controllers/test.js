'use strict';

module.exports = {
    async hello(ctx) {
        ctx.body = {
            message: 'Hello from Strapi!',
            timestamp: new Date().toISOString(),
            path: ctx.request.path
        };
    },

    /**
     * Chrome extension: full-document HTML capture for LinkedIn profiles.
     * Expected JSON: { url, html, title, capturedAt }
     */
    async receiveLinkedInProfileHtml(ctx) {
        const body = ctx.request.body || {};
        if (!body.url || typeof body.html !== 'string') {
            return ctx.badRequest('url (string) and html (string) are required');
        }

        ctx.body = {
            success: true,
            receivedAt: new Date().toISOString(),
            title: body.title || null,
            url: body.url,
            htmlLength: body.html.length,
        };
    },
};
