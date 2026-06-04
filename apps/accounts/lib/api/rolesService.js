import strapiClient from '../strapiClient'

class RolesService {
  async listForOrg() {
    if (typeof window === 'undefined') return []

    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) return []

    const response = await strapiClient.get(`/organizations/${orgId}/roles`)
    if (Array.isArray(response?.data)) {
      return response.data
    }
    return []
  }

  /** @deprecated Prefer listForOrg — core /organization-roles is not organization-scoped. */
  async list() {
    return this.listForOrg()
  }

  async create(payload) {
    if (typeof window === 'undefined') throw new Error('Roles API is browser-only')

    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) throw new Error('No active organization selected')

    return strapiClient.post(`/organizations/${orgId}/roles`, payload)
  }

  async update(roleId, payload) {
    if (typeof window === 'undefined') throw new Error('Roles API is browser-only')

    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) throw new Error('No active organization selected')

    return strapiClient.patch(`/organizations/${orgId}/roles/${roleId}`, payload)
  }

  async delete(roleId) {
    if (typeof window === 'undefined') throw new Error('Roles API is browser-only')

    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) throw new Error('No active organization selected')

    return strapiClient.delete(`/organizations/${orgId}/roles/${roleId}`)
  }
}

const rolesService = new RolesService()
export default rolesService
