'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Initialize default user roles
    try {
      console.log('Initializing default user roles...');
      await strapi.service('api::user-role.user-role').createDefaultRoles();
      console.log('✓ User roles initialized successfully');
    } catch (error) {
      console.error('Error initializing default roles:', error);
    }
  },
};
