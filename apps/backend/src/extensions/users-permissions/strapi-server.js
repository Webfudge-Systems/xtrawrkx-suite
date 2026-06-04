'use strict';

/**
 * Add profile fields to users-permissions user.
 * Do not use schema.json here: Strapi shallow-merges extension schemas and would
 * replace the entire `attributes` object, dropping email/username/password.
 */
module.exports = (plugin) => {
  const user = plugin.contentTypes?.user;
  if (!user?.schema?.attributes) return plugin;

  user.schema.attributes = {
    ...user.schema.attributes,
    firstName: { type: 'string', maxLength: 80 },
    lastName: { type: 'string', maxLength: 80 },
    isPlatformAdmin: { type: 'boolean', default: false },
  };

  return plugin;
};
