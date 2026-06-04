const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.xtrawrkx.com' : 'http://localhost:1337')

class StrapiClient {
  getToken() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth-token')
  }

  async request(endpoint, options = {}) {
    const token = this.getToken()
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const message =
        errorData?.error?.message ||
        errorData?.message ||
        (typeof errorData?.error === 'string' ? errorData.error : null) ||
        `HTTP ${response.status}`
      throw new Error(message)
    }
    return response.json()
  }

  get(endpoint) {
    return this.request(endpoint)
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body })
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body })
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }
}

const strapiClient = new StrapiClient()
export default strapiClient
