'use strict';

/**
 * Quick check: does an email have client-portal-access credentials?
 * Usage: node scripts/diagnose-client-portal-login.js abhiraj@webfudge.in
 */

const { createStrapi } = require('@strapi/strapi');

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: node scripts/diagnose-client-portal-login.js <email>');
    process.exit(1);
  }

  const app = await createStrapi().load();
  const strapi = app;
  const { findPortalAccessByEmail, resolveClientAccountId, loadClientAccount } = require('../src/utils/client-auth');

  try {
    const match = await findPortalAccessByEmail(strapi, email);
    if (match) {
      const accountId = await resolveClientAccountId(strapi, match.access, match.contact);
      const account = await loadClientAccount(strapi, accountId);
      console.log(`Portal match: contact#${match.contact.id} access#${match.access.id}`);
      console.log(`Resolved clientAccountId: ${accountId ?? 'null'}`);
      console.log(`Loaded account: ${account ? `#${account.id} ${account.companyName}` : 'NOT FOUND'}`);
    } else {
      console.log('No portal access match for email');
    }

    const contacts = await strapi.entityService.findMany('api::contact.contact', {
      filters: { email },
      limit: 10,
      populate: ['clientAccount'],
    });

    console.log(`Contacts with email ${email}: ${contacts.length}`);
    for (const contact of contacts) {
      const accesses = await strapi.db
        .query('api::client-portal-access.client-portal-access')
        .findMany({
          where: { contact: contact.id },
          select: ['id', 'isActive', 'roleName', 'accessLevel', 'lastLogin'],
        });
      console.log(
        `  contact#${contact.id} clientAccount=${contact.clientAccount?.id ?? contact.clientAccount} portalAccess=${accesses.length}`
      );
      for (const access of accesses) {
        console.log(
          `    access#${access.id} active=${access.isActive} role=${access.roleName} level=${access.accessLevel}`
        );
      }
    }

    const accounts = await strapi.entityService.findMany('api::client-account.client-account', {
      filters: { email },
      limit: 5,
      fields: ['id', 'companyName', 'email', 'status'],
    });
    console.log(`Client accounts with email ${email}: ${accounts.length}`);
    for (const account of accounts) {
      console.log(`  account#${account.id} company=${account.companyName} status=${account.status}`);
    }
  } finally {
    await strapi.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
