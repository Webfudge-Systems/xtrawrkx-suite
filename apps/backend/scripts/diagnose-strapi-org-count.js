'use strict';

/** Compare Strapi entityService org filter vs raw SQL link counts. */
const path = require('path');
const { createStrapi } = require('@strapi/strapi');

const appDir = path.join(__dirname, '..');
const ORG_ID = parseInt(String(process.env.TARGET_ORG_ID || '1'), 10);

async function main() {
  let strapi;
  try {
    strapi = createStrapi({ appDir, distDir: appDir });
    await strapi.load();

    for (const uid of ['api::lead-company.lead-company', 'api::contact.contact']) {
      const esCount = await strapi.db.query(uid).count({ where: { organization: ORG_ID } });
      const esFind = await strapi.entityService.findMany(uid, {
        filters: { organization: ORG_ID },
        fields: ['id'],
        limit: 5000,
      });
      console.log(`${uid}: db.count=${esCount}, findMany.length=${esFind.length}`);
    }
  } finally {
    if (strapi) await strapi.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
