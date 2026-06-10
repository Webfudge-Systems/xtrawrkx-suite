const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://xtrawrkxsuits-production.up.railway.app'
    : 'http://localhost:1337')

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        const errorPayload = data.error || data
        const message = errorPayload?.message || data.message || 'Request failed'
        const err = new Error(message)
        const field = errorPayload?.details?.field ?? errorPayload?.field
        if (field != null) err.field = field
        throw err
      }

      return data
    } catch (error) {
      console.error('API Request Error:', error)
      throw error
    }
  }

  async getMe() {
    return this.request('/api/auth/me')
  }

  async updateProfile(userData) {
    return this.request('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async getOrganization(id) {
    return this.request(`/api/organizations/${id}`)
  }

  async createOrganization(data) {
    return this.request('/api/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}

const apiService = new ApiService()
export default apiService
