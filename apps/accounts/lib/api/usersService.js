import strapiClient from '../strapiClient'

class UsersService {
  async list(params = {}) {
    if (typeof window === 'undefined') return []

    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) return []

    return strapiClient.get(`/organizations/${orgId}/users`, {
      sort: params.sort || 'updatedAt:desc',
    })
  }

  async invite({
    email,
    roleId,
    roleCode = 'member',
    directAdd = false,
    directPassword,
    sendWelcomeEmail = true,
    departmentIds = [],
    primaryDepartmentId = null,
  }) {
    if (typeof window === 'undefined') throw new Error('Invite is only available in browser')

    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) throw new Error('No active organization selected')

    const rolePayload =
      roleId != null && String(roleId).trim() !== '' ? String(roleId).trim() : String(roleCode || 'member')

    return strapiClient.post(`/organizations/${orgId}/invite-users`, {
      emails: [email],
      role: rolePayload,
      permissions: {},
      directAdd,
      directPassword,
      sendWelcomeEmail,
      departmentIds,
      primaryDepartmentId,
    })
  }

  async updateMembership({
    membershipId,
    roleId,
    roleCode,
    status,
    email,
    username,
    departmentIds,
    primaryDepartmentId,
  }) {
    if (typeof window === 'undefined') throw new Error('Update is only available in browser')

    const orgId = localStorage.getItem('current-org-id')
    if (!orgId) throw new Error('No active organization selected')
    if (!membershipId) throw new Error('membershipId is required')

    const body = {}
    if (typeof status !== 'undefined') {
      body.status = status
    }
    if (roleId != null && String(roleId).trim() !== '') {
      const idNum = Number.parseInt(String(roleId), 10)
      body.roleId = Number.isFinite(idNum) ? idNum : roleId
    } else if (roleCode != null && String(roleCode).trim() !== '') {
      body.roleCode = String(roleCode).trim()
    }
    if (email != null && String(email).trim() !== '') {
      body.email = String(email).trim().toLowerCase()
    }
    if (username != null && String(username).trim() !== '') {
      body.username = String(username).trim()
    }
    if (departmentIds !== undefined) {
      body.departmentIds = departmentIds
    }
    if (primaryDepartmentId !== undefined && primaryDepartmentId !== null && primaryDepartmentId !== '') {
      body.primaryDepartmentId = primaryDepartmentId
    }

    return strapiClient.patch(`/organizations/${orgId}/users/${membershipId}`, body)
  }
}

const usersService = new UsersService()
export default usersService
