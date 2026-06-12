const DEFAULT_API_BASE_URL =
  process.env.NODE_ENV === 'production' ? 'https://api.webfudge.in' : 'http://localhost:1338';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL;

class StrapiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('strapi_token', token);
    }
  }

  getToken() {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token =
        localStorage.getItem('strapi_token') ||
        localStorage.getItem('auth-token') ||
        localStorage.getItem('xtrawrkx-authToken');
    }
    return this.token;
  }

  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('strapi_token');
    }
  }

  getCurrentOrgId() {
    if (typeof window === 'undefined') return null;
    const id = localStorage.getItem('current-org-id');
    return id ? id : null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    const token = this.getToken();
    const orgId = this.getCurrentOrgId();
    const { headers: optionHeaders, body, ...rest } = options;

    const config = {
      method: 'GET',
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(orgId && { 'X-Organization-Id': orgId }),
        ...(optionHeaders && typeof optionHeaders === 'object' ? optionHeaders : {}),
      },
    };

    if (body !== undefined && body !== null) {
      const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
      const isUrlParams = typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
      if (typeof body === 'string' || isFormData || isUrlParams) {
        config.body = body;
      } else {
        config.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return response;
    } catch (error) {
      console.error(`Strapi API Error (${endpoint}):`, error);
      throw error;
    }
  }

  buildQueryString(params, prefix = '') {
    const parts = [];
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        const value = params[key];
        const paramKey = prefix ? `${prefix}[${key}]` : key;
        if (value === null || value === undefined) continue;
        else if (typeof value === 'object' && !Array.isArray(value)) {
          parts.push(this.buildQueryString(value, paramKey));
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object') {
              parts.push(this.buildQueryString(item, `${paramKey}[${index}]`));
            } else {
              parts.push(`${paramKey}[${index}]=${encodeURIComponent(item)}`);
            }
          });
        } else {
          parts.push(`${paramKey}=${encodeURIComponent(value)}`);
        }
      }
    }
    return parts.filter(Boolean).join('&');
  }

  async get(endpoint, params = {}) {
    const queryString = this.buildQueryString(params);
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, { method: 'POST', body: data });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, { method: 'PUT', body: data });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Flatten `GET /organizations/:id/users` into user rows (nested `user` or flat member).
   */
  static normalizeOrganizationUsersResponse(body) {
    const rows = body?.data;
    if (!Array.isArray(rows)) return [];
    return rows
      .map((row) => {
        const raw = row?.user ?? row?.attributes?.user ?? row;
        if (raw == null) return null;
        if (typeof raw === 'object' && raw.attributes) {
          return { id: raw.id, documentId: raw.documentId ?? raw.id, ...raw.attributes };
        }
        if (typeof raw === 'object' && raw.id != null) {
          return { ...raw };
        }
        return null;
      })
      .filter(Boolean);
  }

  /**
   * Users for assignee dropdowns: org roster when `current-org-id` is set, else GET /users.
   */
  async getXtrawrkxUsers(params = {}) {
    const queryParams = {
      'pagination[page]': params['pagination[page]'] ?? params.page ?? 1,
      'pagination[pageSize]': params['pagination[pageSize]'] ?? params.pageSize ?? 25,
      ...(params.populate && { populate: params.populate }),
    };

    const orgId = this.getCurrentOrgId();
    if (orgId) {
      try {
        const response = await this.get(`/organizations/${encodeURIComponent(orgId)}/users`);
        const users = StrapiClient.normalizeOrganizationUsersResponse(response);
        return {
          data: users,
          meta: response?.meta ?? {
            pagination: {
              page: 1,
              pageSize: users.length,
              pageCount: 1,
              total: users.length,
            },
          },
        };
      } catch (e) {
        console.warn(
          'strapiClient.getXtrawrkxUsers: organization users failed, trying /users',
          e?.message || e
        );
      }
    }

    return this.get('/users', queryParams);
  }
}

export default new StrapiClient();
