'use strict';

/**
 * Generates an org-scoped, monotonically-incrementing sequence number.
 * Uses a DB transaction to ensure atomicity — no gaps, no duplicates.
 *
 * @param {number} organizationId
 * @param {string} sequenceField  — field name on organization (e.g. 'invoiceSequence')
 * @param {string} prefix         — e.g. 'INV', 'BILL'
 * @returns {string}              — e.g. 'INV-0001'
 */
async function generateSequence(organizationId, sequenceField, prefix) {
  let newValue;

  await strapi.db.transaction(async () => {
    const org = await strapi.db.query('api::organization.organization').findOne({
      where: { id: organizationId },
      select: [sequenceField],
    });

    if (!org) throw new Error(`Organization ${organizationId} not found`);

    newValue = (org[sequenceField] || 0) + 1;

    await strapi.db.query('api::organization.organization').update({
      where: { id: organizationId },
      data: { [sequenceField]: newValue },
    });
  });

  return `${prefix}-${String(newValue).padStart(4, '0')}`;
}

module.exports = { generateSequence };
