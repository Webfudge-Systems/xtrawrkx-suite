'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::notification.notification', ({ strapi }) => ({
  /**
   * Create a notification and fan it out to one or multiple users within an org.
   * @param {object} options
   * @param {number|number[]} options.userIds - Single user id or array of user ids
   * @param {number} options.organizationId
   * @param {string} options.type
   * @param {string} options.title
   * @param {string} [options.message]
   * @param {object} [options.data]
   */
  async notify({ userIds, organizationId, type, title, message = '', data = {} }) {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    const created = [];
    for (const userId of ids) {
      try {
        const entry = await strapi.entityService.create('api::notification.notification', {
          data: {
            type,
            title,
            message,
            data,
            isRead: false,
            user: userId,
            organization: organizationId,
          },
        });
        created.push(entry);
      } catch (err) {
        console.error(`Failed to create notification for user ${userId}:`, err);
      }
    }
    return created;
  },
}));
