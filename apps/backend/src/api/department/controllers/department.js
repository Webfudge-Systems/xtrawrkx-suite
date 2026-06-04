'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { createOrgAdminController } = require('../../../utils/org-admin-resource');
const { syncDepartmentLeadToMembership } = require('../../../utils/department-context');

const UID = 'api::department.department';

module.exports = createCoreController(UID, ({ strapi }) => {
  const base = createOrgAdminController(strapi, UID, {
    populate: ['lead', 'parent', 'organization'],
  });

  async function afterSave(entry) {
    if (!entry) return entry;
    try {
      const full = await strapi.entityService.findOne(UID, entry.id, {
        populate: ['lead', 'organization'],
      });
      await syncDepartmentLeadToMembership(strapi, full || entry);
    } catch (err) {
      strapi.log.warn(
        `syncDepartmentLeadToMembership failed for department ${entry.id}: ${err.message}`
      );
    }
    return entry;
  }

  return {
    ...base,
    async create(ctx) {
      const result = await base.create(ctx);
      if (result?.data) await afterSave(result.data);
      return result;
    },
    async update(ctx) {
      const result = await base.update(ctx);
      if (result?.data) await afterSave(result.data);
      return result;
    },
  };
});
