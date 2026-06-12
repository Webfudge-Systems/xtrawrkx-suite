'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { createOrgAdminController } = require('../../../utils/org-admin-resource');

const UID = 'api::department.department';

module.exports = createCoreController(UID, ({ strapi }) =>
  createOrgAdminController(strapi, UID, {
    populate: ['lead', 'parent', 'organization'],
  })
);
