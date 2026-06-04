'use strict';

module.exports = {
  async profitLoss(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const { from, to, basis = 'accrual' } = ctx.query || {};

    const invoices = await strapi.entityService.findMany('api::invoice.invoice', {
      filters: { organization: orgId, status: { $notIn: ['draft', 'void'] }, ...(from ? { invoiceDate: { $gte: from } } : {}), ...(to ? { invoiceDate: { $lte: to } } : {}) },
      limit: 50000,
    }).catch(() => []);

    const expenses = await strapi.entityService.findMany('api::expense.expense', {
      filters: { organization: orgId, ...(from ? { expenseDate: { $gte: from } } : {}), ...(to ? { expenseDate: { $lte: to } } : {}) },
      limit: 50000,
    }).catch(() => []);

    const payments = await strapi.entityService.findMany('api::payment-made.payment-made', {
      filters: { organization: orgId, ...(from ? { paymentDate: { $gte: from } } : {}), ...(to ? { paymentDate: { $lte: to } } : {}) },
      limit: 50000,
    }).catch(() => []);

    const totalIncome = invoices.reduce((s, i) => s + (basis === 'cash' ? (i.paidAmount || 0) : (i.total || 0)), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0) + payments.reduce((s, p) => s + (p.amount || 0), 0);

    return ctx.send({
      data: {
        totalIncome,
        totalExpenses,
        grossProfit: totalIncome - totalExpenses,
        netProfit: totalIncome - totalExpenses,
        incomeBreakdown: [{ label: 'Service Revenue', amount: totalIncome }],
        expenseBreakdown: [],
      },
    });
  },

  async balanceSheet(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;

    const accounts = await strapi.entityService.findMany('api::chart-of-account.chart-of-account', {
      filters: { organization: orgId, isActive: true },
      limit: 500,
      sort: { accountCode: 'ASC' },
    }).catch(() => []);

    const assets = accounts.filter(a => a.accountType === 'asset');
    const liabilities = accounts.filter(a => a.accountType === 'liability');
    const equity = accounts.filter(a => a.accountType === 'equity');

    const sumBalance = (arr) => arr.reduce((s, a) => s + (a.currentBalance || 0), 0);

    return ctx.send({
      data: {
        assets: { accounts: assets, total: sumBalance(assets) },
        liabilities: { accounts: liabilities, total: sumBalance(liabilities) },
        equity: { accounts: equity, total: sumBalance(equity) },
        totalLiabilitiesAndEquity: sumBalance(liabilities) + sumBalance(equity),
      },
    });
  },

  async cashFlow(ctx) {
    // Delegated to books.cashFlow in books controller
    return strapi.controller('api::books.books').cashFlow(ctx);
  },

  async salesByCustomer(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const { from, to } = ctx.query || {};

    const invoices = await strapi.entityService.findMany('api::invoice.invoice', {
      filters: { organization: orgId, status: { $notIn: ['draft', 'void'] }, ...(from ? { invoiceDate: { $gte: from } } : {}), ...(to ? { invoiceDate: { $lte: to } } : {}) },
      populate: ['customer'],
      limit: 50000,
    }).catch(() => []);

    const byCustomer = {};
    for (const inv of invoices) {
      const custId = inv.customer?.id || 'unknown';
      const custName = inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}` : 'Unknown';
      if (!byCustomer[custId]) byCustomer[custId] = { customerId: custId, customerName: custName, invoiceCount: 0, total: 0, paid: 0 };
      byCustomer[custId].invoiceCount++;
      byCustomer[custId].total += inv.total || 0;
      byCustomer[custId].paid += inv.paidAmount || 0;
    }

    return ctx.send({ data: Object.values(byCustomer).sort((a, b) => b.total - a.total) });
  },

  async expensesByCategory(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const { from, to } = ctx.query || {};

    const expenses = await strapi.entityService.findMany('api::expense.expense', {
      filters: { organization: orgId, ...(from ? { expenseDate: { $gte: from } } : {}), ...(to ? { expenseDate: { $lte: to } } : {}) },
      limit: 50000,
    }).catch(() => []);

    const byCategory = {};
    let grand = 0;
    for (const e of expenses) {
      const cat = e.category || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
      grand += e.amount || 0;
    }

    return ctx.send({
      data: Object.entries(byCategory).map(([category, total]) => ({
        category, total, percentage: grand === 0 ? 0 : Math.round((total / grand) * 100),
      })).sort((a, b) => b.total - a.total),
    });
  },

  async receivablesAging(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const today = new Date();

    const invoices = await strapi.entityService.findMany('api::invoice.invoice', {
      filters: { organization: orgId, status: { $in: ['sent', 'viewed', 'partial', 'overdue'] } },
      populate: ['customer'],
      limit: 10000,
    }).catch(() => []);

    const buckets = [
      { label: '0-30 days', count: 0, amount: 0 },
      { label: '31-60 days', count: 0, amount: 0 },
      { label: '61-90 days', count: 0, amount: 0 },
      { label: '90+ days', count: 0, amount: 0 },
    ];
    let total = 0;

    for (const inv of invoices) {
      if (!inv.dueDate || !inv.balanceDue) continue;
      const daysOverdue = Math.floor((today - new Date(inv.dueDate)) / 86400000);
      total += inv.balanceDue;
      if (daysOverdue <= 30) { buckets[0].count++; buckets[0].amount += inv.balanceDue; }
      else if (daysOverdue <= 60) { buckets[1].count++; buckets[1].amount += inv.balanceDue; }
      else if (daysOverdue <= 90) { buckets[2].count++; buckets[2].amount += inv.balanceDue; }
      else { buckets[3].count++; buckets[3].amount += inv.balanceDue; }
    }

    return ctx.send({ data: { total, buckets } });
  },

  async payablesAging(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const today = new Date();

    const bills = await strapi.entityService.findMany('api::bill.bill', {
      filters: { organization: orgId, status: { $in: ['approved', 'partial', 'overdue'] } },
      limit: 10000,
    }).catch(() => []);

    const buckets = [
      { label: '0-30 days', count: 0, amount: 0 },
      { label: '31-60 days', count: 0, amount: 0 },
      { label: '61-90 days', count: 0, amount: 0 },
      { label: '90+ days', count: 0, amount: 0 },
    ];
    let total = 0;

    for (const bill of bills) {
      if (!bill.dueDate || !bill.balanceDue) continue;
      const days = Math.floor((today - new Date(bill.dueDate)) / 86400000);
      total += bill.balanceDue;
      if (days <= 30) { buckets[0].count++; buckets[0].amount += bill.balanceDue; }
      else if (days <= 60) { buckets[1].count++; buckets[1].amount += bill.balanceDue; }
      else if (days <= 90) { buckets[2].count++; buckets[2].amount += bill.balanceDue; }
      else { buckets[3].count++; buckets[3].amount += bill.balanceDue; }
    }

    return ctx.send({ data: { total, buckets } });
  },

  async utilization(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const { from, to } = ctx.query || {};

    const tasks = await strapi.entityService.findMany('api::task.task', {
      filters: { organization: orgId, ...(from ? { logDate: { $gte: from } } : {}), ...(to ? { logDate: { $lte: to } } : {}) },
      populate: ['assignee'],
      limit: 50000,
    }).catch(() => []);

    const totalHours = tasks.reduce((s, t) => s + (parseFloat(t.hoursLogged) || 0), 0);
    const billableHours = tasks.filter(t => t.billable).reduce((s, t) => s + (parseFloat(t.hoursLogged) || 0), 0);

    const byUser = {};
    for (const t of tasks) {
      const uid = t.assignee?.id || 'unassigned';
      const uname = t.assignee ? `${t.assignee.firstname || ''} ${t.assignee.lastname || ''}`.trim() : 'Unassigned';
      if (!byUser[uid]) byUser[uid] = { userId: uid, userName: uname, totalHours: 0, billableHours: 0 };
      byUser[uid].totalHours += parseFloat(t.hoursLogged) || 0;
      if (t.billable) byUser[uid].billableHours += parseFloat(t.hoursLogged) || 0;
    }

    return ctx.send({
      data: {
        totalHours: Math.round(totalHours * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
        utilizationRate: totalHours === 0 ? 0 : Math.round((billableHours / totalHours) * 100),
        byUser: Object.values(byUser).map(u => ({
          ...u,
          totalHours: Math.round(u.totalHours * 100) / 100,
          billableHours: Math.round(u.billableHours * 100) / 100,
          utilizationRate: u.totalHours === 0 ? 0 : Math.round((u.billableHours / u.totalHours) * 100),
        })),
      },
    });
  },
};
