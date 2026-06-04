/**
 * Dashboard metrics from Strapi (lead companies + deals). Org scoping uses strapiClient headers.
 */
import leadCompanyService from './leadCompanyService';
import dealService from './dealService';

const LIST_PAGE_SIZE = 100;

function iso(d) {
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
}

function calendarMonthBounds(anchor = new Date()) {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  const startCurrent = new Date(y, m, 1, 0, 0, 0, 0);
  const endCurrent = new Date(y, m + 1, 0, 23, 59, 59, 999);
  const startPrev = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const endPrev = new Date(y, m, 0, 23, 59, 59, 999);
  return { startCurrent, endCurrent, startPrev, endPrev };
}

function normStage(stage) {
  return (stage == null ? '' : String(stage)).trim().toLowerCase();
}

function isClosedDealStage(stage) {
  const s = normStage(stage);
  return s === 'won' || s === 'lost' || s === 'closed_won' || s === 'closed_lost';
}

function isWonStage(stage) {
  const s = normStage(stage);
  return s === 'won' || s === 'closed_won';
}

function isLostStage(stage) {
  const s = normStage(stage);
  return s === 'lost' || s === 'closed_lost';
}

function pctChangeRounded(prev, curr) {
  if (prev <= 0) return curr <= 0 ? 0 : 100;
  return Math.round(((curr - prev) / prev) * 100);
}

/** @param {Date} start @param {Date} end */
async function countLeadCompaniesCreatedBetween(start, end) {
  const res = await leadCompanyService.getAll({
    'pagination[pageSize]': 1,
    filters: {
      createdAt: { $gte: iso(start), $lte: iso(end) },
    },
  });
  return res?.meta?.pagination?.total ?? 0;
}

async function tryCountLeadCompaniesCreatedBetween(start, end) {
  try {
    return await countLeadCompaniesCreatedBetween(start, end);
  } catch (e) {
    console.warn('dashboardService: monthly lead count failed', e?.message ?? e);
    return 0;
  }
}

async function fetchAllDeals() {
  let page = 1;
  const all = [];
  let pageCount = 1;
  do {
    const res = await dealService.getAll({
      'pagination[page]': page,
      'pagination[pageSize]': LIST_PAGE_SIZE,
      sort: 'updatedAt:desc',
    });
    const batch = Array.isArray(res.data) ? res.data : [];
    all.push(...batch);
    pageCount = res?.meta?.pagination?.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);
  return all;
}

function inInclusiveRange(dateStr, start, end) {
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return false;
  return t >= start.getTime() && t <= end.getTime();
}

function sumDealValue(deals) {
  return deals.reduce((sum, d) => sum + (Number.isFinite(Number(d.value)) ? Number(d.value) : 0), 0);
}

export default {
  async getStats() {
    const empty = {
      totalLeads: 0,
      pipelineValue: 0,
      conversionRate: 0,
      activeDeals: 0,
      changes: {
        leadsChange: 0,
        pipelineValueChange: 0,
        conversionRateChange: 0,
        dealsChange: 0,
      },
    };

    try {
      const bounds = calendarMonthBounds();
      const [leadsHead, allDeals, leadsThisMonth, leadsPrevMonth] = await Promise.all([
        leadCompanyService.getAll({ 'pagination[pageSize]': 1 }),
        fetchAllDeals(),
        tryCountLeadCompaniesCreatedBetween(bounds.startCurrent, bounds.endCurrent),
        tryCountLeadCompaniesCreatedBetween(bounds.startPrev, bounds.endPrev),
      ]);

      const totalLeads = leadsHead?.meta?.pagination?.total ?? 0;

      const openDeals = allDeals.filter((d) => !isClosedDealStage(d.stage));
      const activeDeals = openDeals.length;
      const pipelineValue = sumDealValue(openDeals);

      const wonDeals = allDeals.filter((d) => isWonStage(d.stage)).length;
      const totalDeals = allDeals.length;
      const conversionRate =
        totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 1000) / 10 : 0;

      const dealsCreatedThisMonth = allDeals.filter((d) =>
        inInclusiveRange(d.createdAt, bounds.startCurrent, bounds.endCurrent)
      );
      const dealsCreatedPrevMonth = allDeals.filter((d) =>
        inInclusiveRange(d.createdAt, bounds.startPrev, bounds.endPrev)
      );

      const openCreatedThisMonth = dealsCreatedThisMonth.filter((d) => !isClosedDealStage(d.stage));
      const openCreatedPrevMonth = dealsCreatedPrevMonth.filter((d) => !isClosedDealStage(d.stage));

      const pipelineNewOpenThisMonth = sumDealValue(openCreatedThisMonth);
      const pipelineNewOpenPrevMonth = sumDealValue(openCreatedPrevMonth);

      const closedThisMonth = allDeals.filter(
        (d) =>
          isClosedDealStage(d.stage) &&
          inInclusiveRange(d.updatedAt, bounds.startCurrent, bounds.endCurrent)
      );
      const closedPrevMonth = allDeals.filter(
        (d) =>
          isClosedDealStage(d.stage) &&
          inInclusiveRange(d.updatedAt, bounds.startPrev, bounds.endPrev)
      );

      const winRateThisMonth = (() => {
        const w = closedThisMonth.filter((d) => isWonStage(d.stage)).length;
        const l = closedThisMonth.filter((d) => isLostStage(d.stage)).length;
        const d = w + l;
        return d > 0 ? (w / d) * 100 : 0;
      })();
      const winRatePrevMonth = (() => {
        const w = closedPrevMonth.filter((d) => isWonStage(d.stage)).length;
        const l = closedPrevMonth.filter((d) => isLostStage(d.stage)).length;
        const d = w + l;
        return d > 0 ? (w / d) * 100 : 0;
      })();

      const conversionRateDelta =
        closedThisMonth.length === 0 && closedPrevMonth.length === 0
          ? 0
          : Math.round((winRateThisMonth - winRatePrevMonth) * 10) / 10;

      return {
        data: {
          totalLeads,
          pipelineValue,
          conversionRate,
          activeDeals,
          changes: {
            leadsChange: pctChangeRounded(leadsPrevMonth, leadsThisMonth),
            pipelineValueChange: pctChangeRounded(pipelineNewOpenPrevMonth, pipelineNewOpenThisMonth),
            conversionRateChange: conversionRateDelta,
            dealsChange: pctChangeRounded(openCreatedPrevMonth.length, openCreatedThisMonth.length),
          },
        },
      };
    } catch (e) {
      console.error('dashboardService.getStats:', e);
      return { data: empty };
    }
  },

  async getWeeklyLeadsData() {
    return [];
  },

  async getPipelineStages() {
    return { leads: [], qualified: [], proposal: [], negotiation: [] };
  },

  async getUpcomingTasks() {
    return [];
  },
};
