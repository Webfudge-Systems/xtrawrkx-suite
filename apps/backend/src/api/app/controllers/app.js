'use strict';

/**
 * app controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::app.app', ({ strapi }) => ({
  // Get all apps with modules
  async find(ctx) {
    const { category } = ctx.query;

    try {
      const filters = { isActive: true };
      if (category) {
        filters.category = category;
      }

      const apps = await strapi.entityService.findMany('api::app.app', {
        filters,
        populate: {
          modules: true,
        },
        sort: { order: 'asc' },
      });

      return ctx.send({
        success: true,
        data: apps,
      });
    } catch (error) {
      console.error('Error fetching apps:', error);
      return ctx.badRequest(error.message);
    }
  },

  // Get modules for specific app
  async getModules(ctx) {
    const { slug } = ctx.params;

    try {
      const app = await strapi.entityService.findMany('api::app.app', {
        filters: { slug, isActive: true },
        populate: {
          modules: true,
        },
        limit: 1,
      });

      if (!app || app.length === 0) {
        return ctx.notFound('App not found');
      }

      return ctx.send({
        success: true,
        data: app[0].modules,
      });
    } catch (error) {
      console.error('Error fetching modules:', error);
      return ctx.badRequest(error.message);
    }
  },

  // Calculate pricing
  async calculatePricing(ctx) {
    const { appId, moduleIds, userCount } = ctx.request.body;

    try {
      const pricing = await strapi.service('api::subscription.subscription').calculatePricing(
        appId,
        moduleIds,
        userCount
      );

      return ctx.send({
        success: true,
        data: pricing
      });
    } catch (error) {
      console.error('Error calculating pricing:', error);
      return ctx.badRequest(error.message);
    }
  }
}));
