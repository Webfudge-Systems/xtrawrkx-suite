import strapiClient from '../strapiClient'
import { buildOrganizationSettingsPayload } from '../organizationSettings'

class OrganizationService {
  async getCurrent() {
    return strapiClient.get('/organizations/current')
  }

  /** @param {Record<string, unknown>} formValues */
  async updateSettings(formValues) {
    if (typeof window === 'undefined') throw new Error('Organization API is browser-only')
    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) throw new Error('No active organization selected')
    const payload = buildOrganizationSettingsPayload(formValues)
    return strapiClient.patch(`/organizations/${orgId}/settings`, payload)
  }

  async getAppAccess() {
    if (typeof window === 'undefined') return null
    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) return null
    return strapiClient.get(`/organizations/${orgId}/app-access`)
  }

  async addApp(payload) {
    if (typeof window === 'undefined') throw new Error('Organization API is browser-only')
    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) throw new Error('No active organization selected')
    return strapiClient.post(`/organizations/${orgId}/add-app`, payload)
  }

  async getSecuritySettings() {
    if (typeof window === 'undefined') return null
    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) return null
    const response = await strapiClient.get(`/organizations/${orgId}/security-settings`)
    return response?.data || response
  }

  async updateSecuritySettings(securitySettings) {
    if (typeof window === 'undefined') throw new Error('Organization API is browser-only')
    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) throw new Error('No active organization selected')
    return strapiClient.patch(`/organizations/${orgId}/security-settings`, { securitySettings })
  }
}

const organizationService = new OrganizationService()
export default organizationService
