'use strict';

/**
 * subscription service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::subscription.subscription', ({ strapi }) => ({
  async calculatePricing(appId, moduleIds, userCount = 1) {
    // Get app
    const app = await strapi.entityService.findOne('api::app.app', appId, {
      populate: {
        modules: true
      }
    });

    if (!app) {
      throw new Error('App not found');
    }

    // Get selected modules
    const selectedModules = app.modules.filter(m => moduleIds.includes(m.id));

    // Calculate pricing
    const basePrice = parseFloat(app.basePrice) || 0;
    const modulesTotal = selectedModules.reduce((sum, module) => {
      return sum + (parseFloat(module.pricePerUser) * userCount);
    }, 0);

    const pricePerUser = modulesTotal / userCount;
    const totalMonthly = basePrice + modulesTotal;
    const totalAnnual = totalMonthly * 12 * 0.85; // 15% discount

    const breakdown = selectedModules.map(module => ({
      moduleId: module.id,
      moduleName: module.name,
      pricePerUser: parseFloat(module.pricePerUser),
      totalUsers: userCount,
      total: parseFloat(module.pricePerUser) * userCount
    }));

    return {
      basePrice,
      pricePerUser,
      modulesTotal,
      totalMonthly,
      totalAnnual,
      userCount,
      breakdown
    };
  }
}));
