import strapiClient from '../strapiClient'

class AuditService {
  normalizeListResponse(response) {
    const rows = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.results)
          ? response.results
          : []

    const pagination = response?.meta?.pagination || {}
    const total =
      Number(response?.meta?.total) ||
      Number(pagination.total) ||
      rows.length

    return {
      rows,
      total: Number.isFinite(total) ? total : rows.length,
      page: Number(pagination.page) || 1,
      pageSize: Number(pagination.pageSize) || rows.length || 25,
    }
  }

  async list(params = {}) {
    // Source audit view from the real CRM activity database feed.
    // This endpoint is org-scoped on backend and includes PM/CRM activity rows.
    const start = Math.max(0, ((params.page || 1) - 1) * (params.pageSize || 25))
    const feedResponse = await strapiClient.get('/crm-activities/feed', {
      limit: params.pageSize || 25,
      start,
      ...(params.type ? { type: params.type } : {}), // e.g. comment
      ...(params.subjectTypes ? { subjectTypes: params.subjectTypes } : {}),
    })

    const feedRows = Array.isArray(feedResponse?.data) ? feedResponse.data : []
    const total =
      Number(feedResponse?.meta?.total) ||
      Number(feedResponse?.meta?.pagination?.total) ||
      feedRows.length

    return {
      rows: feedRows,
      total: Number.isFinite(total) ? total : feedRows.length,
      page: Number(params.page) || 1,
      pageSize: Number(params.pageSize) || feedRows.length || 25,
    }
  }

  /**
   * Entity-scoped activity (GET /crm-activities/timeline).
   * Pass exactly one of: contactId, leadCompanyId, dealId, clientAccountId, meetingId, taskId, projectId.
   * @param {Record<string, string|number>} query
   * @returns {Promise<{ data: object[], total: number }>}
   */
  async entityTimeline(query = {}) {
    const response = await strapiClient.get('/crm-activities/timeline', query)
    const data = Array.isArray(response?.data) ? response.data : []
    const total = typeof response?.meta?.total === 'number' ? response.meta.total : data.length
    return { data, total }
  }
}

const auditService = new AuditService()
export default auditService
