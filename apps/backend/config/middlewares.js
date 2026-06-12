const allowedOrigins = [
  'http://localhost:3000', // Landing
  'http://localhost:3001', // CRM
  'http://localhost:3002', // Client portal
  'http://localhost:3003', // Accounts
  'http://localhost:3004', // Organization manager
  'http://localhost:3005', // PM
  'http://localhost:3008', // Books
  'https://webfudge.in',
  'https://www.webfudge.in',
  'https://crm.webfudge.in',
  'https://pm.webfudge.in',
  'https://accounts.webfudge.in',
  'https://vendor.webfudge.in',
  'https://books.webfudge.in',
  'https://api.webfudge.in',
  'https://webfudgesystems.in',
  'https://www.webfudgesystems.in',
];

const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+\.webfudge\.in$/,
  /^https:\/\/[a-z0-9-]+\.webfudgesystems\.in$/,
];

module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'https://*.amazonaws.com',
            'https://*.cloudfront.net',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'https://*.amazonaws.com',
            'https://*.cloudfront.net',
          ],
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: (ctx) => {
        const requestOrigin = ctx.request.header.origin;

        if (!requestOrigin) {
          return '*';
        }

        if (allowedOrigins.includes(requestOrigin)) {
          return requestOrigin;
        }

        if (allowedOriginPatterns.some((pattern) => pattern.test(requestOrigin))) {
          return requestOrigin;
        }

        return '';
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: [
        'Content-Type',
        'Authorization',
        'Origin',
        'Accept',
        'X-Organization-Id', // CRM / apps send active org; must match preflight Allow-Headers
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  'global::jwt-auth', // Custom JWT authentication middleware
  'global::api-cache', // Redis cache for GET /api/* (leads, contacts, tasks, projects, …)
];
