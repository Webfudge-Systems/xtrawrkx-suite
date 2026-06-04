import strapiClient from './strapiClient'

class PlatformService {
  async getStats() {
    const res = await strapiClient.get('/platform/stats')
    return res?.data || res
  }

  async listOrganizations(params = {}) {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params.search) qs.set('search', params.search)
    const query = qs.toString()
    const res = await strapiClient.get(`/platform/organizations${query ? `?${query}` : ''}`)
    return { data: res?.data || [], meta: res?.meta }
  }

  async getOrganization(id) {
    const res = await strapiClient.get(`/platform/organizations/${id}`)
    return res?.data || res
  }

  async getOrganizationActivities(id, params = {}) {
    const qs = new URLSearchParams()
    if (params.limit) qs.set('limit', String(params.limit))
    const query = qs.toString()
    const res = await strapiClient.get(
      `/platform/organizations/${id}/activities${query ? `?${query}` : ''}`
    )
    return res?.data || []
  }

  async createOrganization(payload) {
    const res = await strapiClient.post('/platform/organizations', payload)
    return res?.data || res
  }

  async updateOrganization(id, payload) {
    const res = await strapiClient.patch(`/platform/organizations/${id}`, payload)
    return res?.data || res
  }

  async deleteOrganization(id) {
    const res = await strapiClient.delete(`/platform/organizations/${id}`)
    return res?.data || res
  }
}

export default new PlatformService()
