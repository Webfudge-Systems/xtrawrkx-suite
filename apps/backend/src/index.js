const { seed } = require('../database/seeds/apps-and-modules');
const rbac = require('./constants/rbac-app-matrix');
const {
  resolveOrganizationRoleId,
  assignMembershipRole,
  ORG_ROLE_UID,
  ORG_MEMBERSHIP_UID,
} = require('./utils/organization-role');
const redis = require('./utils/redis');

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    console.log('🚀 Strapi is bootstrapping...');

    if (redis.isRedisConfigured()) {
      const hostHint = (redis.resolveRedisUrl() || '').replace(/:[^:@]+@/, ':****@');
      try {
        const ok = await redis.ping();
        console.log(ok ? `✅ Redis connected (${hostHint})` : '⚠️ Redis configured but ping failed');
      } catch (e) {
        console.warn('⚠️ Redis unavailable — API will run without cache:', e?.message || e);
      }
    } else {
      console.log('ℹ️ Redis not configured (optional). Set REDIS_URL to enable caching.');
    }

    const forceSeed = process.env.SEED_DATA === 'true';
    let runSeed = forceSeed;
    if (!runSeed) {
      const anyApp = await strapi.entityService.findMany('api::app.app', { limit: 1 });
      runSeed = !anyApp?.length;
    }

    if (runSeed) {
      console.log(
        forceSeed
          ? '🌱 Running database seeds (SEED_DATA=true)...'
          : '🌱 No apps in database — running default app/module seeds...'
      );
      try {
        await seed(strapi);
      } catch (error) {
        console.error('❌ Seeding failed:', error);
      }
    }

    // Seed default organization roles for membership templates
    try {
      const defaultOrgRoles = [
        {
          name: 'Admin',
          code: 'admin',
          accessLevel: 'high',
          description: 'Full organization administration access.',
          isSystem: true,
        },
        {
          name: 'Manager',
          code: 'manager',
          accessLevel: 'medium',
          description: 'Operational management access with limited administration.',
          isSystem: true,
        },
        {
          name: 'Member',
          code: 'member',
          accessLevel: 'basic',
          description: 'Standard member access to assigned workspace features.',
          isSystem: true,
        },
      ];

      for (const role of defaultOrgRoles) {
        const perms = rbac.defaultPermissionsForSystemCode(role.code);
        const existing = await strapi.entityService.findMany(ORG_ROLE_UID, {
          filters: {
            $and: [{ name: role.name }, { organization: { $null: true } }],
          },
          limit: 1,
        });
        if (existing.length === 0) {
          await strapi.entityService.create(ORG_ROLE_UID, {
            data: { ...role, permissions: perms },
          });
        } else {
          /** @type {any} */
          const row = existing[0];
          const empty =
            !row.permissions ||
            (typeof row.permissions === 'object' && Object.keys(row.permissions).length === 0);
          if (empty) {
            await strapi.entityService.update(ORG_ROLE_UID, row.id, {
              data: { permissions: perms },
            });
          }
        }
      }

      const memberRoleId = await resolveOrganizationRoleId(strapi, 'Member');
      const memberships = await strapi.entityService.findMany(ORG_MEMBERSHIP_UID, {
        populate: {
          role: true,
          user: { fields: ['id'] },
          organization: { populate: { owner: { fields: ['id'] } } },
        },
        limit: 1000,
      });

      for (const membership of memberships) {
        /** @type {any} */
        const row = membership;
        const userId = typeof row.user === 'object' ? row.user?.id : row.user;
        const org = row.organization;
        const ownerId = typeof org?.owner === 'object' ? org.owner?.id : org?.owner;
        const isOwner = userId && ownerId && String(userId) === String(ownerId);
        const roleCode = String(row.role?.code || '').toLowerCase();
        const hasRole = Boolean(row.role?.id || row.role);

        if (isOwner) {
          if (!hasRole || roleCode === 'member') {
            await assignMembershipRole(strapi, row.id, 'Admin');
          }
          continue;
        }

        if (!hasRole) {
          await assignMembershipRole(strapi, row.id, memberRoleId);
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not seed organization roles:', e?.message || e);
    }

    // Allow REST access to direct-messages (custom JWT in middleware; Strapi sees unauthenticated)
    try {
      const roleTypes = ['public', 'authenticated'];
      const actions = [
        'api::direct-message.direct-message.find',
        'api::direct-message.direct-message.findOne',
        'api::direct-message.direct-message.create',
      ];
      for (const type of roleTypes) {
        const role = await strapi.db.query('plugin::users-permissions.role').findOne({
          where: { type },
        });
        if (!role) continue;
        for (const action of actions) {
          const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
            where: { action, role: role.id },
          });
          if (existing) continue;
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action, role: role.id, enabled: true },
          });
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not auto-grant direct-message permissions:', e?.message || e);
    }

    // Auto-grant public/authenticated access to all Books content-type actions
    try {
      const booksActions = [
        'api::item.item.find', 'api::item.item.findOne', 'api::item.item.create', 'api::item.item.update', 'api::item.item.delete',
        'api::bank-account.bank-account.find', 'api::bank-account.bank-account.findOne', 'api::bank-account.bank-account.create', 'api::bank-account.bank-account.update', 'api::bank-account.bank-account.delete', 'api::bank-account.bank-account.transactions',
        'api::bank-transaction.bank-transaction.find', 'api::bank-transaction.bank-transaction.findOne', 'api::bank-transaction.bank-transaction.create', 'api::bank-transaction.bank-transaction.update', 'api::bank-transaction.bank-transaction.delete', 'api::bank-transaction.bank-transaction.uncategorized', 'api::bank-transaction.bank-transaction.categorize', 'api::bank-transaction.bank-transaction.bulkCategorize',
        'api::invoice.invoice.find', 'api::invoice.invoice.findOne', 'api::invoice.invoice.create', 'api::invoice.invoice.update', 'api::invoice.invoice.delete', 'api::invoice.invoice.updateStatus', 'api::invoice.invoice.fromTime',
        'api::invoice-line-item.invoice-line-item.find', 'api::invoice-line-item.invoice-line-item.findOne', 'api::invoice-line-item.invoice-line-item.create', 'api::invoice-line-item.invoice-line-item.update', 'api::invoice-line-item.invoice-line-item.delete',
        'api::estimate.estimate.find', 'api::estimate.estimate.findOne', 'api::estimate.estimate.create', 'api::estimate.estimate.update', 'api::estimate.estimate.delete', 'api::estimate.estimate.updateStatus', 'api::estimate.estimate.convertToInvoice',
        'api::estimate-line-item.estimate-line-item.find', 'api::estimate-line-item.estimate-line-item.findOne', 'api::estimate-line-item.estimate-line-item.create', 'api::estimate-line-item.estimate-line-item.update', 'api::estimate-line-item.estimate-line-item.delete',
        'api::payment-received.payment-received.find', 'api::payment-received.payment-received.findOne', 'api::payment-received.payment-received.create', 'api::payment-received.payment-received.update', 'api::payment-received.payment-received.delete',
        'api::credit-note.credit-note.find', 'api::credit-note.credit-note.findOne', 'api::credit-note.credit-note.create', 'api::credit-note.credit-note.update', 'api::credit-note.credit-note.delete',
        'api::vendor.vendor.find', 'api::vendor.vendor.findOne', 'api::vendor.vendor.create', 'api::vendor.vendor.update', 'api::vendor.vendor.delete',
        'api::bill.bill.find', 'api::bill.bill.findOne', 'api::bill.bill.create', 'api::bill.bill.update', 'api::bill.bill.delete', 'api::bill.bill.updateStatus',
        'api::bill-line-item.bill-line-item.find', 'api::bill-line-item.bill-line-item.findOne', 'api::bill-line-item.bill-line-item.create', 'api::bill-line-item.bill-line-item.update', 'api::bill-line-item.bill-line-item.delete',
        'api::payment-made.payment-made.find', 'api::payment-made.payment-made.findOne', 'api::payment-made.payment-made.create', 'api::payment-made.payment-made.update', 'api::payment-made.payment-made.delete',
        'api::vendor-credit.vendor-credit.find', 'api::vendor-credit.vendor-credit.findOne', 'api::vendor-credit.vendor-credit.create', 'api::vendor-credit.vendor-credit.update', 'api::vendor-credit.vendor-credit.delete',
        'api::expense.expense.find', 'api::expense.expense.findOne', 'api::expense.expense.create', 'api::expense.expense.update', 'api::expense.expense.delete', 'api::expense.expense.addToInvoice',
        'api::manual-journal.manual-journal.find', 'api::manual-journal.manual-journal.findOne', 'api::manual-journal.manual-journal.create', 'api::manual-journal.manual-journal.update', 'api::manual-journal.manual-journal.delete', 'api::manual-journal.manual-journal.publish', 'api::manual-journal.manual-journal.reverse',
        'api::chart-of-account.chart-of-account.find', 'api::chart-of-account.chart-of-account.findOne', 'api::chart-of-account.chart-of-account.create', 'api::chart-of-account.chart-of-account.update', 'api::chart-of-account.chart-of-account.delete', 'api::chart-of-account.chart-of-account.trialBalance',
        'api::document.document.find', 'api::document.document.findOne', 'api::document.document.create', 'api::document.document.update', 'api::document.document.delete',
        'api::purchase-order.purchase-order.find', 'api::purchase-order.purchase-order.findOne', 'api::purchase-order.purchase-order.create', 'api::purchase-order.purchase-order.update', 'api::purchase-order.purchase-order.delete',
        'api::sales-order.sales-order.find', 'api::sales-order.sales-order.findOne', 'api::sales-order.sales-order.create', 'api::sales-order.sales-order.update', 'api::sales-order.sales-order.delete',
        'api::delivery-challan.delivery-challan.find', 'api::delivery-challan.delivery-challan.findOne', 'api::delivery-challan.delivery-challan.create', 'api::delivery-challan.delivery-challan.update', 'api::delivery-challan.delivery-challan.delete',
        'api::retainer-invoice.retainer-invoice.find', 'api::retainer-invoice.retainer-invoice.findOne', 'api::retainer-invoice.retainer-invoice.create', 'api::retainer-invoice.retainer-invoice.update', 'api::retainer-invoice.retainer-invoice.delete',
        'api::recurring-invoice.recurring-invoice.find', 'api::recurring-invoice.recurring-invoice.findOne', 'api::recurring-invoice.recurring-invoice.create', 'api::recurring-invoice.recurring-invoice.update', 'api::recurring-invoice.recurring-invoice.delete',
        'api::recurring-expense.recurring-expense.find', 'api::recurring-expense.recurring-expense.findOne', 'api::recurring-expense.recurring-expense.create', 'api::recurring-expense.recurring-expense.update', 'api::recurring-expense.recurring-expense.delete',
        'api::books.books.activate', 'api::books.books.dashboard', 'api::books.books.profitLoss', 'api::books.books.cashFlow', 'api::books.books.recentActivities', 'api::books.books.topExpenses', 'api::books.books.bankingOverview', 'api::books.books.postingTrend', 'api::books.books.weeklyTimesheet',
        'api::books.reports.profitLoss', 'api::books.reports.balanceSheet', 'api::books.reports.cashFlow', 'api::books.reports.salesByCustomer', 'api::books.reports.expensesByCategory', 'api::books.reports.receivablesAging', 'api::books.reports.payablesAging', 'api::books.reports.utilization',
        'api::project.project.find', 'api::project.project.findOne', 'api::project.project.create', 'api::project.project.update', 'api::project.project.delete', 'api::project.project.summary',
        'api::task.task.find', 'api::task.task.findOne', 'api::task.task.create', 'api::task.task.update', 'api::task.task.delete', 'api::task.task.timerStart', 'api::task.task.timerStop',
      ];

      const roleTypes = ['public', 'authenticated'];
      for (const type of roleTypes) {
        const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type } });
        if (!role) continue;
        for (const action of booksActions) {
          const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({ where: { action, role: role.id } });
          if (existing) continue;
          await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id, enabled: true } });
        }
      }
      console.log('✅ Books permissions granted');
    } catch (e) {
      console.warn('⚠️ Could not auto-grant Books permissions:', e?.message || e);
    }

    console.log('✅ Bootstrap complete!');
  },

  async destroy() {
    await redis.disconnect();
  },
};
