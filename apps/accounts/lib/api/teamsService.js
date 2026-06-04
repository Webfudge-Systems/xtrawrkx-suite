import strapiClient from '../strapiClient'

function normalizeList(response) {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response)) return response
  return []
}

function normalizeMembers(members) {
  if (members == null) return undefined
  const ids = (Array.isArray(members) ? members : [])
    .map((m) => (typeof m === 'object' ? m.id : m))
    .filter((id) => id != null)
  return { set: ids }
}

class TeamsService {
  async list() {
    const response = await strapiClient.get('/teams', {
      'pagination[pageSize]': 100,
      sort: 'name:asc',
      'populate[leader][fields][0]': 'firstName',
      'populate[leader][fields][1]': 'lastName',
      'populate[leader][fields][2]': 'email',
      'populate[department][fields][0]': 'name',
      'populate[members][fields][0]': 'firstName',
      'populate[members][fields][1]': 'lastName',
      'populate[members][fields][2]': 'email',
    })
    return normalizeList(response)
  }

  async create(data) {
    const payload = { ...data }
    if (payload.members != null) payload.members = normalizeMembers(payload.members)
    return strapiClient.post('/teams', { data: payload })
  }

  async update(id, data) {
    const payload = { ...data }
    if (payload.members != null) payload.members = normalizeMembers(payload.members)
    return strapiClient.put(`/teams/${id}`, { data: payload })
  }

  async delete(id) {
    return strapiClient.delete(`/teams/${id}`)
  }
}

const teamsService = new TeamsService()
export default teamsService
