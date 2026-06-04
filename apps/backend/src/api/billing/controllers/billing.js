'use strict';

const { requireAppSettingsManage } = require('../../../utils/rbac');

module.exports = {
  async overview(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireAppSettingsManage(ctx);
    if (denied) return denied;

    const orgId = ctx.state.orgId;

    const org = await strapi.entityService.findOne('api::organization.organization', orgId, {
      fields: ['name', 'status', 'trialEndsAt'],
    });

    const subscriptions = await strapi.entityService.findMany('api::subscription.subscription', {
      filters: { organization: orgId },
      populate: ['app', 'selectedModules'],
      limit: 50,
    });

    const memberships = await strapi.entityService.findMany('api::organization-user.organization-user', {
      filters: { organization: orgId },
      fields: ['isActive'],
      limit: 500,
    });

    const totalUsers = memberships.length;
    const activeUsers = memberships.filter((m) => m.isActive !== false).length;

    let trialDaysRemaining = null;
    if (org?.trialEndsAt) {
      const diff = new Date(org.trialEndsAt).getTime() - Date.now();
      trialDaysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    const subscriptionRows = (subscriptions || []).map((sub) => ({
      id: sub.id,
      status: sub.status,
      billingCycle: sub.billingCycle,
      calculatedPrice: sub.calculatedPrice,
      totalUsers: sub.totalUsers,
      nextBillingDate: sub.nextBillingDate,
      autoRenew: sub.autoRenew,
      paymentMethod: sub.paymentMethod,
      app: sub.app
        ? {
            id: sub.app.id,
            name: sub.app.name || sub.app.displayName,
            slug: sub.app.slug,
          }
        : null,
      modules: Array.isArray(sub.selectedModules)
        ? sub.selectedModules.map((m) => ({ id: m.id, name: m.name, slug: m.slug }))
        : [],
    }));

    const monthlySpend = subscriptionRows.reduce(
      (sum, row) => sum + Number(row.calculatedPrice || 0),
      0
    );

    return {
      data: {
        organization: {
          id: org?.id,
          name: org?.name,
          status: org?.status,
          trialEndsAt: org?.trialEndsAt,
          trialDaysRemaining,
        },
        seatUtilization: {
          totalUsers,
          activeUsers,
          billedSeats: subscriptionRows.reduce((max, s) => Math.max(max, Number(s.totalUsers || 0)), 0),
        },
        monthlySpend,
        subscriptions: subscriptionRows,
      },
    };
  },
};
