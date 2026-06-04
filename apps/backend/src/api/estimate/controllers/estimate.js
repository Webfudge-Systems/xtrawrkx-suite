'use strict';

const { makeBooksCrudController, relId } = require('../../../utils/books-crud');
const { generateSequence } = require('../../../utils/sequence');

const UID = 'api::estimate.estimate';
const LI_UID = 'api::estimate-line-item.estimate-line-item';

const base = makeBooksCrudController(UID, { defaultPopulate: ['customer', 'project', 'invoice'] });

module.exports = (params) => {
  const core = base(params);

  return {
    ...core,

    async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const { lineItems: liData = [], ...data } = payload;

    const estimateNumber = await generateSequence(ctx.state.orgId, 'estimateSequence', 'EST');
    const subtotal = liData.reduce((s, li) => s + Math.round(parseFloat(li.quantity || 1) * parseInt(li.rate || 0, 10)), 0);
    const taxAmount = liData.reduce((s, li) => {
      const amt = Math.round(parseFloat(li.quantity || 1) * parseInt(li.rate || 0, 10));
      return s + Math.round(amt * parseFloat(li.taxRate || 0) / 100);
    }, 0);
    let discountAmount = 0;
    if (data.discountType === 'percentage') discountAmount = Math.round(subtotal * parseFloat(data.discountValue || 0) / 100);
    else discountAmount = parseInt(data.discountValue || 0, 10);
    const total = subtotal - discountAmount + taxAmount;

    const estimate = await strapi.entityService.create(UID, {
      data: { ...data, estimateNumber, status: 'draft', subtotal, discountAmount, taxAmount, total,
        organization: ctx.state.orgId, createdByUser: ctx.state.user.id },
    });

    for (let i = 0; i < liData.length; i++) {
      const li = liData[i];
      const qty = parseFloat(li.quantity || 1);
      const rate = parseInt(li.rate || 0, 10);
      const amount = Math.round(qty * rate);
      const taxAmt = Math.round(amount * parseFloat(li.taxRate || 0) / 100);
      await strapi.entityService.create(LI_UID, {
        data: { description: li.description, quantity: qty, rate, amount, discountPercent: li.discountPercent || 0,
          taxRate: li.taxRate || 0, taxAmount: taxAmt, total: amount + taxAmt, sortOrder: i,
          estimate: estimate.id, item: li.item || null, organization: ctx.state.orgId },
      });
    }
    return { data: estimate };
    },

    async updateStatus(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const estimate = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization'] });
    if (!estimate) return ctx.notFound();
    if (relId(estimate.organization) !== ctx.state.orgId) return ctx.forbidden();

    const body = ctx.request?.body || {};
    const { status } = body.data || body;
    const now = new Date().toISOString();
    const updateData = { status };
    if (status === 'sent') updateData.sentAt = now;
    if (status === 'accepted') updateData.acceptedAt = now;
    if (status === 'declined') updateData.declinedAt = now;

    const entry = await strapi.entityService.update(UID, ctx.params.id, { data: updateData });
    return { data: entry };
    },

    async convertToInvoice(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const estimate = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization', 'customer', 'project'] });
    if (!estimate) return ctx.notFound();
    if (relId(estimate.organization) !== ctx.state.orgId) return ctx.forbidden();
    if (estimate.convertedToInvoice) return ctx.badRequest('Already converted to invoice');

    const lineItems = await strapi.entityService.findMany(LI_UID, {
      filters: { estimate: ctx.params.id },
      sort: { sortOrder: 'asc' },
    });

    const invoiceNumber = await generateSequence(ctx.state.orgId, 'invoiceSequence', 'INV');
    const today = new Date().toISOString().split('T')[0];

    const invoice = await strapi.entityService.create('api::invoice.invoice', {
      data: {
        invoiceNumber,
        status: 'draft',
        invoiceDate: today,
        currency: estimate.currency,
        subtotal: estimate.subtotal,
        discountType: estimate.discountType,
        discountValue: estimate.discountValue,
        discountAmount: estimate.discountAmount,
        taxAmount: estimate.taxAmount,
        total: estimate.total,
        balanceDue: estimate.total,
        paidAmount: 0,
        customer: relId(estimate.customer),
        project: relId(estimate.project),
        estimate: estimate.id,
        notes: estimate.notes,
        organization: ctx.state.orgId,
        createdByUser: ctx.state.user.id,
      },
    });

    for (const li of lineItems) {
      await strapi.entityService.create('api::invoice-line-item.invoice-line-item', {
        data: { description: li.description, quantity: li.quantity, rate: li.rate,
          amount: li.amount, discountPercent: li.discountPercent, taxRate: li.taxRate,
          taxAmount: li.taxAmount, total: li.total, sortOrder: li.sortOrder,
          invoice: invoice.id, item: relId(li.item), organization: ctx.state.orgId },
      });
    }

    await strapi.entityService.update(UID, ctx.params.id, {
      data: { convertedToInvoice: true, status: 'invoiced', invoice: invoice.id },
    });

    return { data: invoice };
    },
  };
};
