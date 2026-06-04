import strapiClient from '../strapiClient'

function normalizeList(response) {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response)) return response
  return []
}

class DepartmentsService {
  async list() {
    const response = await strapiClient.get('/departments', {
      'pagination[pageSize]': 100,
      sort: 'name:asc',
      'populate[lead][fields][0]': 'firstName',
      'populate[lead][fields][1]': 'lastName',
      'populate[lead][fields][2]': 'email',
      'populate[parent][fields][0]': 'name',
    })
    return normalizeList(response)
  }

  async create(data) {
    return strapiClient.post('/departments', { data })
  }

  async update(id, data) {
    return strapiClient.put(`/departments/${id}`, { data })
  }

  async delete(id) {
    return strapiClient.delete(`/departments/${id}`)
  }
}

const departmentsService = new DepartmentsService()
export default departmentsService
