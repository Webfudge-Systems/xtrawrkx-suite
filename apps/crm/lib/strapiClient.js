// Use env override first; otherwise use production or local default by environment.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.webfudge.in'
    : 'http://localhost:1338');

class StrapiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
      localStorage.setItem('strapi_token', token);
    }
  }

  /**
   * Get authentication token.
   * Prefers auth-token (@webfudge/auth) and always re-reads localStorage so login
   * updates are not masked by a stale in-memory or legacy strapi_token value.
   */
  getToken() {
    if (typeof window !== 'undefined') {
      this.token =
        localStorage.getItem('auth-token') ||
        localStorage.getItem('strapi_token');
    }
    return this.token;
  }

  /**
   * Remove authentication token
   */
  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('strapi_token');
    }
  }

  /**
   * Get the currently active organization id (set by @webfudge/auth after login).
   */
  getCurrentOrgId() {
    if (typeof window === 'undefined') return null;
    const id = localStorage.getItem('current-org-id');
    return id ? id : null;
  }

  /**
   * Make authenticated request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    const token = this.getToken();
    const orgId = this.getCurrentOrgId();
    const { headers: optionHeaders, body, ...rest } = options;

    const isFormData =
      body !== undefined &&
      body !== null &&
      typeof FormData !== 'undefined' &&
      body instanceof FormData;

    const config = {
      method: 'GET',
      ...rest,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(orgId && { 'X-Organization-Id': orgId }),
        ...(optionHeaders && typeof optionHeaders === 'object' ? optionHeaders : {}),
      },
    };

    if (body !== undefined && body !== null) {
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
        console.error(`API Error ${response.status} for ${url}:`, errorData);
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

  /**
   * Helper function to build Strapi query string from nested objects
   */
  buildQueryString(params, prefix = '') {
    const parts = [];

    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        const value = params[key];
        const paramKey = prefix ? `${prefix}[${key}]` : key;

        if (value === null || value === undefined) {
          continue;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // Recursively build nested objects
          parts.push(this.buildQueryString(value, paramKey));
        } else if (Array.isArray(value)) {
          // Handle arrays
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

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = this.buildQueryString(params);
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  /**
   * DELETE request
   */
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
        const roleRaw = row?.role ?? row?.attributes?.role;
        const orgRoleName =
          typeof roleRaw === 'string'
            ? roleRaw
            : roleRaw?.name ?? roleRaw?.attributes?.name ?? row?.roleName ?? null;
        const orgRoleCode =
          row?.roleCode ??
          (typeof roleRaw === 'object' ? roleRaw?.code ?? roleRaw?.attributes?.code : null);
        let user = null;
        if (typeof raw === 'object' && raw.attributes) {
          user = { id: raw.id, documentId: raw.documentId ?? raw.id, ...raw.attributes };
        } else if (typeof raw === 'object' && raw.id != null) {
          user = { ...raw };
        }
        if (!user) return null;
        return {
          ...user,
          orgRoleName: orgRoleName || undefined,
          orgRoleCode: orgRoleCode || undefined,
        };
      })
      .filter(Boolean);
  }

  /**
   * Fetch users in the active organization (assignment dropdowns).
   * Prefers `GET /organizations/:orgId/users` (backend custom route). Falls back to `/users` if no org id.
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
        const response = await this.get(
          `/organizations/${encodeURIComponent(orgId)}/users`
        );
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

const strapiClient = new StrapiClient();

export default strapiClient;
