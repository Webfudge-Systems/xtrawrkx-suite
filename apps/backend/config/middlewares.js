const allowedOrigins = [
  // Local development
  'http://localhost:3000', // Client (public site)
  'http://localhost:3001', // CRM
  'http://localhost:3002', // Client Portal
  'http://localhost:3003', // Accounts
  'http://localhost:3004', // Organization Manager (Orbit)
  'http://localhost:3005', // PM
  'http://localhost:3008', // Books (future)
  // Production — update when domains are confirmed
  'https://xtrawrkx.com',
  'https://www.xtrawrkx.com',
  'https://crm.xtrawrkx.com',
  'https://pm.xtrawrkx.com',
  'https://accounts.xtrawrkx.com',
  'https://orbit.10x1.webfudge.in',
  'https://portal.xtrawrkx.com',
  'https://xtrawrkxsuits-production.up.railway.app',
];

const allowedOriginPatterns = [
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+\.xtrawrkx\.com$/,
  /^https:\/\/[a-z0-9-]+\.10x1\.webfudge\.in$/,
];

module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
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
        'X-Organization-Id',
        'X-Department-Id',
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  'global::jwt-auth',
  'global::api-cache',
];
