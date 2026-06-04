'use strict';

const { bootstrapBooksOrg } = require('../services/bootstrap');

module.exports = {
  async activate(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    if (!['Owner', 'Admin'].includes(ctx.state.orgRole)) {
      return ctx.forbidden('Only Owner or Admin can activate Books');
    }
    try {
      const result = await bootstrapBooksOrg(ctx.state.orgId);
      return ctx.send({ data: result });
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

  async dashboard(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const [invoices, bills, bankAccounts, tasks, expenses] = await Promise.all([
      strapi.entityService.findMany('api::invoice.invoice', {
        filters: { organization: orgId },
        limit: 5000,
      }),
      strapi.entityService.findMany('api::bill.bill', {
        filters: { organization: orgId },
        limit: 5000,
      }),
      strapi.entityService.findMany('api::bank-account.bank-account', {
        filters: { organization: orgId, isActive: true },
        limit: 100,
      }),
      strapi.entityService.findMany('api::task.task', {
        filters: { organization: orgId, billable: true, invoiced: false },
        limit: 5000,
      }),
      strapi.entityService.findMany('api::expense.expense', {
        filters: { organization: orgId, billable: true, invoiced: false },
        limit: 5000,
      }),
    ]);

    const activeInvStatuses = ['sent', 'viewed', 'partial', 'overdue'];
    const totalReceivables = invoices
      .filter((i) => activeInvStatuses.includes(i.status))
      .reduce((s, i) => s + (i.balanceDue || 0), 0);

    const activeBillStatuses = ['approved', 'partial', 'overdue'];
    const totalPayables = bills
      .filter((b) => activeBillStatuses.includes(b.status))
      .reduce((s, b) => s + (b.balanceDue || 0), 0);

    const thisMonthBilling = invoices
      .filter((i) => i.invoiceDate && i.invoiceDate >= monthStart)
      .reduce((s, i) => s + (i.total || 0), 0);

    const overdueInvoices = invoices.filter((i) => i.status === 'overdue').length;
    const overdueBills = bills.filter((b) => b.status === 'overdue').length;

    const unbilledHours = tasks.reduce((s, t) => s + (parseFloat(t.hoursLogged) || 0), 0);
    const unbilledExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

    // Bank balance: sum openingBalance + all bank transactions
    let totalBalance = 0;
    for (const acct of bankAccounts) {
      totalBalance += acct.openingBalance || 0;
    }
    try {
      const txns = await strapi.entityService.findMany('api::bank-transaction.bank-transaction', {
        filters: { organization: orgId },
        limit: 50000,
      });
      totalBalance += txns.reduce((s, t) => s + (t.amount || 0), 0);
    } catch (_) {}

    // Month revenue comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    const thisMonthRevenue = invoices
      .filter((i) => i.status === 'paid' && i.invoiceDate >= monthStart)
      .reduce((s, i) => s + (i.total || 0), 0);
    const lastMonthRevenue = invoices
      .filter((i) => i.status === 'paid' && i.invoiceDate >= lastMonthStart && i.invoiceDate <= lastMonthEnd)
      .reduce((s, i) => s + (i.total || 0), 0);
    const revenueTrend = lastMonthRevenue === 0 ? 0 : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

    return ctx.send({
      data: {
        totalBalance,
        totalReceivables,
        totalPayables,
        netPosition: totalReceivables - totalPayables,
        thisMonthBilling,
        thisMonthRevenue,
        lastMonthRevenue,
        revenueTrend,
        unbilledHours: Math.round(unbilledHours * 100) / 100,
        unbilledExpenses,
        overdueInvoices,
        overdueBills,
      },
    });
  },

  async profitLoss(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const now = new Date();
    const org = await strapi.entityService.findOne('api::organization.organization', orgId);
    const fyStart = org?.fiscalYearStart || 4;

    // Build 12 months for current FY
    let fyStartDate = new Date(now.getFullYear(), fyStart - 1, 1);
    if (fyStartDate > now) fyStartDate = new Date(now.getFullYear() - 1, fyStart - 1, 1);

    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(fyStartDate.getFullYear(), fyStartDate.getMonth() + i, 1);
      months.push({
        label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        start: d.toISOString().split('T')[0],
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0],
      });
    }

    const invoices = await strapi.entityService.findMany('api::invoice.invoice', {
      filters: { organization: orgId, status: { $in: ['paid', 'partial'] } },
      limit: 50000,
    });
    let expenses = [];
    try {
      expenses = await strapi.entityService.findMany('api::expense.expense', {
        filters: { organization: orgId },
        limit: 50000,
      });
    } catch (_) {}
    let payments = [];
    try {
      payments = await strapi.entityService.findMany('api::payment-made.payment-made', {
        filters: { organization: orgId },
        limit: 50000,
      });
    } catch (_) {}

    const result = months.map((m) => {
      const income = invoices
        .filter((i) => i.invoiceDate >= m.start && i.invoiceDate <= m.end)
        .reduce((s, i) => s + (i.paidAmount || 0), 0);
      const expense = [
        ...expenses.filter((e) => e.expenseDate >= m.start && e.expenseDate <= m.end).map((e) => e.amount || 0),
        ...payments.filter((p) => p.paymentDate >= m.start && p.paymentDate <= m.end).map((p) => p.amount || 0),
      ].reduce((s, v) => s + v, 0);
      return { month: m.label, income, expense, profit: income - expense };
    });

    return ctx.send({ data: result });
  },

  async cashFlow(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const now = new Date();
    const org = await strapi.entityService.findOne('api::organization.organization', orgId);
    const fyStart = org?.fiscalYearStart || 4;
    let fyStartDate = new Date(now.getFullYear(), fyStart - 1, 1);
    if (fyStartDate > now) fyStartDate = new Date(now.getFullYear() - 1, fyStart - 1, 1);

    const months = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(fyStartDate.getFullYear(), fyStartDate.getMonth() + i, 1);
      months.push({
        label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        start: d.toISOString().split('T')[0],
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0],
      });
    }

    let receipts = [];
    let payments = [];
    try {
      receipts = await strapi.entityService.findMany('api::payment-received.payment-received', {
        filters: { organization: orgId },
        limit: 50000,
      });
    } catch (_) {}
    try {
      payments = await strapi.entityService.findMany('api::payment-made.payment-made', {
        filters: { organization: orgId },
        limit: 50000,
      });
    } catch (_) {}

    let runningBalance = 0;
    const result = months.map((m) => {
      const incoming = receipts
        .filter((r) => r.paymentDate >= m.start && r.paymentDate <= m.end)
        .reduce((s, r) => s + (r.amount || 0), 0);
      const outgoing = payments
        .filter((p) => p.paymentDate >= m.start && p.paymentDate <= m.end)
        .reduce((s, p) => s + (p.amount || 0), 0);
      const net = incoming - outgoing;
      runningBalance += net;
      return { month: m.label, incoming, outgoing, net, runningBalance };
    });

    return ctx.send({ data: result });
  },

  async recentActivities(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const limit = parseInt(ctx.query?.limit || '20', 10);

    const [invoices, bills, expenses] = await Promise.all([
      strapi.entityService.findMany('api::invoice.invoice', {
        filters: { organization: orgId },
        sort: { createdAt: 'DESC' },
        limit: limit,
        populate: ['customer'],
      }).catch(() => []),
      strapi.entityService.findMany('api::bill.bill', {
        filters: { organization: orgId },
        sort: { createdAt: 'DESC' },
        limit: limit,
        populate: ['vendor'],
      }).catch(() => []),
      strapi.entityService.findMany('api::expense.expense', {
        filters: { organization: orgId },
        sort: { createdAt: 'DESC' },
        limit: limit,
      }).catch(() => []),
    ]);

    const feed = [
      ...invoices.map((i) => ({
        id: i.id, type: 'invoice', number: i.invoiceNumber,
        description: `Invoice to ${i.customer?.firstName || 'Customer'}`,
        amount: i.total, status: i.status, date: i.createdAt,
      })),
      ...bills.map((b) => ({
        id: b.id, type: 'bill', number: b.billNumber,
        description: `Bill from ${b.vendor?.displayName || 'Vendor'}`,
        amount: b.total, status: b.status, date: b.createdAt,
      })),
      ...expenses.map((e) => ({
        id: e.id, type: 'expense', number: e.expenseNumber,
        description: e.description || e.category,
        amount: e.amount, status: e.status, date: e.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    return ctx.send({ data: feed });
  },

  async topExpenses(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;

    const expenses = await strapi.entityService.findMany('api::expense.expense', {
      filters: { organization: orgId },
      limit: 50000,
    }).catch(() => []);

    const byCategory = {};
    let grandTotal = 0;
    for (const e of expenses) {
      const cat = e.category || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + (e.amount || 0);
      grandTotal += e.amount || 0;
    }

    const result = Object.entries(byCategory)
      .map(([category, total]) => ({
        category,
        total,
        percentage: grandTotal === 0 ? 0 : Math.round((total / grandTotal) * 100),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return ctx.send({ data: result });
  },

  async bankingOverview(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;

    const accounts = await strapi.entityService.findMany('api::bank-account.bank-account', {
      filters: { organization: orgId },
      limit: 100,
      sort: { createdAt: 'ASC' },
    }).catch(() => []);

    let uncategorizedCount = 0;
    try {
      uncategorizedCount = await strapi.db.query('api::bank-transaction.bank-transaction').count({
        where: { organization: orgId, status: 'uncategorized' },
      });
    } catch (_) {}

    const accountsWithBalance = await Promise.all(
      accounts.map(async (acct) => {
        let txnSum = 0;
        try {
          const txns = await strapi.entityService.findMany('api::bank-transaction.bank-transaction', {
            filters: { bankAccount: acct.id },
            limit: 50000,
          });
          txnSum = txns.reduce((s, t) => s + (t.amount || 0), 0);
        } catch (_) {}
        return {
          id: acct.id,
          accountName: acct.accountName,
          accountType: acct.accountType,
          bankName: acct.bankName,
          balance: (acct.openingBalance || 0) + txnSum,
          status: acct.connectionStatus,
          lastSyncAt: acct.lastSyncAt,
          isPrimary: acct.isPrimary,
        };
      })
    );

    const totalBalance = accountsWithBalance.reduce((s, a) => s + a.balance, 0);
    const cashAndManual = accountsWithBalance
      .filter((a) => a.accountType === 'cash' || a.status === 'manual')
      .reduce((s, a) => s + a.balance, 0);

    return ctx.send({
      data: {
        totalBalance,
        bankAccountsCount: accounts.length,
        uncategorizedCount,
        cashAndManual,
        accounts: accountsWithBalance,
      },
    });
  },

  async postingTrend(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
        start: d.toISOString().split('T')[0],
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0],
      });
    }

    const journals = await strapi.entityService.findMany('api::manual-journal.manual-journal', {
      filters: { organization: orgId, status: 'published' },
      limit: 50000,
    }).catch(() => []);

    const result = months.map((m) => {
      const monthJournals = journals.filter((j) => j.journalDate >= m.start && j.journalDate <= m.end);
      return {
        month: m.label,
        journalCount: monthJournals.length,
        totalAmount: monthJournals.reduce((s, j) => s + (j.totalDebit || 0), 0),
      };
    });

    return ctx.send({ data: result });
  },

  async weeklyTimesheet(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const orgId = ctx.state.orgId;
    const weekStart = ctx.query?.weekStart || new Date().toISOString().split('T')[0];
    const userId = ctx.query?.userId ? parseInt(ctx.query.userId, 10) : ctx.state.user.id;

    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const weekEnd = endDate.toISOString().split('T')[0];

    const tasks = await strapi.entityService.findMany('api::task.task', {
      filters: {
        organization: orgId,
        assignee: userId,
        logDate: { $gte: weekStart, $lte: weekEnd },
      },
      limit: 500,
      populate: ['timeProject'],
    }).catch(() => []);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTasks = tasks.filter((t) => t.logDate === dateStr);
      days.push({
        date: dateStr,
        entries: dayTasks.map((t) => ({
          id: t.id, task: t.name, hours: t.hoursLogged, billable: t.billable,
          project: t.timeProject?.name, invoiced: t.invoiced,
        })),
        totalHours: dayTasks.reduce((s, t) => s + (parseFloat(t.hoursLogged) || 0), 0),
      });
    }

    const totalHours = days.reduce((s, d) => s + d.totalHours, 0);
    const billableHours = tasks
      .filter((t) => t.billable)
      .reduce((s, t) => s + (parseFloat(t.hoursLogged) || 0), 0);

    return ctx.send({
      data: {
        weekStart,
        weekEnd,
        days,
        totalHours: Math.round(totalHours * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
      },
    });
  },
};
