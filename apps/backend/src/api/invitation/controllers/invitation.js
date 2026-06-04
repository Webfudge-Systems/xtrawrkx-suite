'use strict';

/**
 * invitation controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::invitation.invitation', ({ strapi }) => ({
  // Accept invitation
  async accept(ctx) {
    const { token, password } = ctx.request.body;

    try {
      const result = await strapi.service('api::invitation.invitation').acceptInvitation(token, password);

      return ctx.send({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return ctx.badRequest(error.message);
    }
  },

  // Validate invitation
  async validate(ctx) {
    const { token } = ctx.params;

    try {
      const invitation = await strapi.entityService.findMany('api::invitation.invitation', {
        filters: { token, status: 'pending' },
        populate: {
          organization: true
        },
        limit: 1
      });

      if (!invitation || invitation.length === 0) {
        return ctx.send({
          success: false,
          valid: false,
          message: 'Invalid or expired invitation'
        });
      }

      const inv = invitation[0];
      const isExpired = new Date(inv.expiresAt) < new Date();

      if (isExpired) {
        return ctx.send({
          success: false,
          valid: false,
          message: 'Invitation has expired'
        });
      }

      return ctx.send({
        success: true,
        valid: true,
        data: {
          email: inv.email,
          organization: inv.organization,
          role: inv.role
        }
      });
    } catch (error) {
      console.error('Error validating invitation:', error);
      return ctx.badRequest(error.message);
    }
  }
}));
