'use strict';

/**
 * organization service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const { createOrganizationOwnerMembership } = require('../../../utils/organization-role');

module.exports = createCoreService('api::organization.organization', ({ strapi }) => ({
  async createWithOnboarding({ userId, organizationData, appId, moduleIds, userCount, invitedEmails }) {
    // Start transaction
    const result = await strapi.db.transaction(async () => {
      // 1. Create organization
      // Generate slug from name if not provided
      const slug = organizationData.slug || 
        organizationData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      
      const organization = await strapi.entityService.create('api::organization.organization', {
        data: {
          ...organizationData,
          slug,
          owner: userId,
          status: 'trial',
          onboardingCompleted: true,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          publishedAt: new Date()
        }
      });

      // 2. Add owner as Admin (Strapi 5 relation connect + post-create verify)
      await createOrganizationOwnerMembership(strapi, {
        userId,
        organizationId: organization.id,
      });

      // 3. Create subscription if app selected
      let subscription = null;
      if (appId) {
        const pricing = await strapi.service('api::subscription.subscription').calculatePricing(
          appId,
          moduleIds,
          userCount
        );

        subscription = await strapi.entityService.create('api::subscription.subscription', {
          data: {
            organization: organization.id,
            app: appId,
            selectedModules: moduleIds,
            basePrice: pricing.basePrice,
            pricePerUser: pricing.pricePerUser,
            totalUsers: userCount,
            calculatedPrice: pricing.totalMonthly,
            status: 'trial',
            startDate: new Date(),
            nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            publishedAt: new Date()
          }
        });
      }

      // 4. Send invitations
      let invitations = [];
      if (invitedEmails && invitedEmails.length > 0) {
        invitations = await strapi.service('api::invitation.invitation').createInvitations(
          organization.id,
          invitedEmails,
          userId,
          'Member'
        );
      }

      return {
        organization,
        subscription,
        invitations
      };
    });

    return result;
  },

  async checkUserAccess(organizationId, userId) {
    const orgUser = await strapi.entityService.findMany('api::organization-user.organization-user', {
      filters: {
        organization: organizationId,
        user: userId,
        isActive: true
      },
      limit: 1
    });

    return orgUser && orgUser.length > 0;
  },

  async addAppToOrganization({ organizationId, userId, appId, moduleIds, userCount, invitedEmails }) {
    // Start transaction
    const result = await strapi.db.transaction(async () => {
      // 1. Check if app already subscribed
      const existingSubscription = await strapi.entityService.findMany('api::subscription.subscription', {
        filters: {
          organization: organizationId,
          app: appId
        },
        limit: 1
      });

      if (existingSubscription && existingSubscription.length > 0) {
        throw new Error('This app is already added to the organization');
      }

      // 2. Calculate pricing
      const pricing = await strapi.service('api::subscription.subscription').calculatePricing(
        appId,
        moduleIds,
        userCount
      );

      // 3. Create subscription
      const subscription = await strapi.entityService.create('api::subscription.subscription', {
        data: {
          organization: organizationId,
          app: appId,
          selectedModules: moduleIds,
          basePrice: pricing.basePrice,
          pricePerUser: pricing.pricePerUser,
          totalUsers: userCount,
          calculatedPrice: pricing.totalMonthly,
          status: 'trial',
          startDate: new Date(),
          nextBillingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          publishedAt: new Date()
        }
      });

      // 4. Send invitations if provided
      let invitations = [];
      if (invitedEmails && invitedEmails.length > 0) {
        invitations = await strapi.service('api::invitation.invitation').createInvitations(
          organizationId,
          invitedEmails,
          userId,
          'Member'
        );
      }

      return {
        subscription,
        invitations
      };
    });

    return result;
  }
}));
