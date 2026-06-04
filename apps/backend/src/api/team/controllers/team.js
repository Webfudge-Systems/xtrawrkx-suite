'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { createOrgAdminController } = require('../../../utils/org-admin-resource');

const UID = 'api::team.team';

module.exports = createCoreController(UID, ({ strapi }) =>
  createOrgAdminController(strapi, UID, {
    populate: ['leader', 'department', 'members', 'organization'],
  })
);
