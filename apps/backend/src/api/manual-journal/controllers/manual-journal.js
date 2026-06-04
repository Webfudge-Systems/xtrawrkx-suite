'use strict';

const { makeBooksCrudController, relId } = require('../../../utils/books-crud');
const { generateSequence } = require('../../../utils/sequence');

const UID = 'api::manual-journal.manual-journal';
const COA_UID = 'api::chart-of-account.chart-of-account';

const base = makeBooksCrudController(UID);

async function updateCOABalances(orgId, lines, multiplier = 1) {
  const drIncreases = ['asset', 'expense', 'cost_of_goods_sold', 'other_expense'];
  for (const line of lines) {
    try {
      const accounts = await strapi.entityService.findMany(COA_UID, {
        filters: { accountCode: line.accountCode, organization: orgId },
        limit: 1,
      });
      if (!accounts.length) continue;
      const account = accounts[0];
      const isDrIncrease = drIncreases.includes(account.accountType);
      const delta = isDrIncrease
        ? (line.debit || 0) - (line.credit || 0)
        : (line.credit || 0) - (line.debit || 0);
      await strapi.entityService.update(COA_UID, account.id, {
        data: { currentBalance: (account.currentBalance || 0) + delta * multiplier },
      });
    } catch (err) {
      console.warn('[manual-journal] COA update failed for', line.accountCode, err.message);
    }
  }
}

module.exports = (params) => {
  const core = base(params);

  return {
    ...core,

    async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const q = ctx.query || {};
    const page = parseInt(q.page || '1', 10);
    const limit = Math.min(parseInt(q.limit || '20', 10), 200);
    const filters = { organization: ctx.state.orgId };
    if (q.status && q.status !== 'all') filters.status = q.status;
    if (q.from) filters.journalDate = { ...filters.journalDate, $gte: q.from };
    if (q.to) filters.journalDate = { ...filters.journalDate, $lte: q.to };
    if (q.search) filters.$or = [{ journalNumber: { $containsi: q.search } }, { notes: { $containsi: q.search } }];

    const [results, total] = await Promise.all([
      strapi.entityService.findMany(UID, { filters, start: (page - 1) * limit, limit, sort: { journalDate: 'desc' } }),
      strapi.db.query(UID).count({ where: filters }),
    ]);
    return { data: results, meta: { pagination: { page, limit, total, pageCount: Math.ceil(total / limit) } } };
    },

    async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const { lines = [] } = payload;

    const totalDebit = lines.reduce((s, l) => s + (parseInt(l.debit || 0, 10)), 0);
    const totalCredit = lines.reduce((s, l) => s + (parseInt(l.credit || 0, 10)), 0);
    const journalNumber = await generateSequence(ctx.state.orgId, 'journalSequence', 'JRN');

    const entry = await strapi.entityService.create(UID, {
      data: {
        ...payload, journalNumber, status: 'draft',
        totalDebit, totalCredit, isBalanced: totalDebit === totalCredit,
        organization: ctx.state.orgId, createdByUser: ctx.state.user.id,
      },
    });
    return { data: entry };
    },

    async update(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const existing = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization'] });
    if (!existing) return ctx.notFound();
    if (relId(existing.organization) !== ctx.state.orgId) return ctx.forbidden();
    if (existing.status === 'published') return ctx.forbidden('Published journals cannot be edited');

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const { lines = payload.lines || existing.lines || [] } = payload;
    const totalDebit = lines.reduce((s, l) => s + parseInt(l.debit || 0, 10), 0);
    const totalCredit = lines.reduce((s, l) => s + parseInt(l.credit || 0, 10), 0);
    delete payload.organization;
    const entry = await strapi.entityService.update(UID, ctx.params.id, {
      data: { ...payload, totalDebit, totalCredit, isBalanced: totalDebit === totalCredit },
    });
    return { data: entry };
    },

    async delete(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const existing = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization'] });
    if (!existing) return ctx.notFound();
    if (relId(existing.organization) !== ctx.state.orgId) return ctx.forbidden();
    if (existing.status === 'published') return ctx.forbidden('Published journals cannot be deleted');
    const entry = await strapi.entityService.delete(UID, ctx.params.id);
    return { data: entry };
    },

    async publish(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    if (!['Owner', 'Admin'].includes(ctx.state.orgRole)) return ctx.forbidden('Only Owner/Admin can publish journals');

    const journal = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization'] });
    if (!journal) return ctx.notFound();
    if (relId(journal.organization) !== ctx.state.orgId) return ctx.forbidden();
    if (journal.status === 'published') return ctx.badRequest('Already published');

    const lines = journal.lines || [];
    const totalDebit = lines.reduce((s, l) => s + parseInt(l.debit || 0, 10), 0);
    const totalCredit = lines.reduce((s, l) => s + parseInt(l.credit || 0, 10), 0);
    if (totalDebit !== totalCredit) {
      return ctx.badRequest(`Journal is not balanced: debit=${totalDebit}, credit=${totalCredit}`);
    }

    const entry = await strapi.entityService.update(UID, ctx.params.id, {
      data: { status: 'published', isBalanced: true, totalDebit, totalCredit },
    });

    await updateCOABalances(ctx.state.orgId, lines, 1);

    return { data: entry };
    },

    async reverse(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const journal = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization'] });
    if (!journal) return ctx.notFound();
    if (relId(journal.organization) !== ctx.state.orgId) return ctx.forbidden();
    if (journal.status !== 'published') return ctx.badRequest('Only published journals can be reversed');

    const reversedLines = (journal.lines || []).map((l) => ({
      ...l,
      debit: l.credit || 0,
      credit: l.debit || 0,
      description: `Reversal: ${l.description || ''}`,
    }));

    const reversalNumber = await generateSequence(ctx.state.orgId, 'journalSequence', 'JRN');
    const today = new Date().toISOString().split('T')[0];

    const reversal = await strapi.entityService.create(UID, {
      data: {
        journalNumber: reversalNumber,
        status: 'published',
        journalDate: today,
        notes: `Reversal of ${journal.journalNumber}`,
        source: 'manual',
        reversalOf: journal.journalNumber,
        lines: reversedLines,
        totalDebit: journal.totalCredit,
        totalCredit: journal.totalDebit,
        isBalanced: true,
        organization: ctx.state.orgId,
        createdByUser: ctx.state.user.id,
      },
    });

    await updateCOABalances(ctx.state.orgId, reversedLines, 1);

    return { data: reversal };
    },
  };
};
