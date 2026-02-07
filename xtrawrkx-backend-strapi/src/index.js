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
    // Initialize default user roles and fix duplicate ranks
    try {
      console.log('Initializing default user roles...');
      await strapi.service('api::user-role.user-role').createDefaultRoles();
      
      console.log('Fixing any duplicate ranks...');
      const result = await strapi.service('api::user-role.user-role').updateRolesToUniqueRanks();
      
      if (result.success) {
        console.log('✓ User roles initialized successfully with unique ranks');
      } else {
        console.warn('⚠ Warning: Issue updating role ranks:', result.error);
      }
    } catch (error) {
      console.error('Error initializing default roles:', error);
    }
  },
};
