// Use env override first; otherwise use production or local default by environment.
import { flattenUser } from '../utils/userProfile';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api.webfudge.in'
    : 'http://localhost:1338');

const ACCESS_RANK = { none: 0, read: 1, write: 2, manage: 3 };

class AuthService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User data and token
   */
  async login(email, password) {
    try {
      let response;
      try {
        // Backend expects 'identifier' (can be email or username) and 'password'
        response = await fetch(`${this.baseURL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ identifier: email, password }),
        });
      } catch (fetchError) {
        // Network error (CORS, connection failure, etc.)
        console.error('Fetch error:', fetchError);
        if (fetchError.message?.includes('Failed to fetch') || fetchError.name === 'TypeError') {
          throw new Error('Network error: Cannot connect to the server. Please ensure the backend API is running at ' + this.baseURL + ' and CORS is configured correctly.');
        }
        throw fetchError;
      }

      // Parse response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON, use status text
        const statusText = response.statusText || 'Unknown error';
        throw new Error(`Server error (${response.status}): ${statusText}`);
      }

      if (!response.ok) {
        // Extract error message from various possible structures
        let errorMessage = 'Login failed. Please try again.';

        console.log('Login failed - Response status:', response.status);
        console.log('Login failed - Response data:', JSON.stringify(data, null, 2));

        // Strapi v4 error structure is typically: { error: { status: 400, message: "..." } }
        // But can also be: { error: "..." } or { message: "..." }
        if (data) {
          // Try data.error.message first (most common Strapi format)
          if (data.error?.message) {
            errorMessage = data.error.message;
          }
          // Try data.error if it's a string
          else if (typeof data.error === 'string') {
            errorMessage = data.error;
          }
          // Try data.message
          else if (data.message) {
            errorMessage = data.message;
          }
        }

        console.log('Extracted error message:', errorMessage);
        throw new Error(errorMessage);
      }

      // Store token in localStorage and cookies
      // Backend returns 'jwt' (not 'token')
      const token = data.jwt || data.token;
      if (token) {
        localStorage.setItem('auth-token', token);
        localStorage.setItem('strapi_token', token);
        localStorage.setItem('auth-user', JSON.stringify(data.user));
        localStorage.setItem('user-role', data.user.role || data.user.primaryRole?.name || 'User');

        // Persist organizations returned by login
        const orgs = data.organizations || [];
        localStorage.setItem('auth-organizations', JSON.stringify(orgs));

        // Auto-select the first org as current if none set yet
        const existingOrgId = localStorage.getItem('current-org-id');
        if (!existingOrgId && orgs.length > 0) {
          localStorage.setItem('current-org-id', String(orgs[0].id));
        }

        // Also store in cookies for middleware access
        document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }

      // Return consistent format (with 'token' key for compatibility)
      return {
        ...data,
        token: data.jwt || data.token,
        user: data.user,
        organizations: data.organizations || [],
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Signup with email, password, firstName, and lastName
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} firstName - User first name
   * @param {string} lastName - User last name
   * @returns {Promise<Object>} - User data and token
   */
  async signup(email, password, firstName, lastName) {
    try {
      let response;
      try {
        response = await fetch(`${this.baseURL}/api/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, firstName, lastName }),
        });
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        if (fetchError.message?.includes('Failed to fetch') || fetchError.name === 'TypeError') {
          throw new Error('Network error: Cannot connect to the server. Please ensure the backend API is running at ' + this.baseURL + ' and CORS is configured correctly.');
        }
        throw fetchError;
      }

      // Parse response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const statusText = response.statusText || 'Unknown error';
        throw new Error(`Server error (${response.status}): ${statusText}`);
      }

      if (!response.ok) {
        let errorMessage = 'Signup failed. Please try again.';

        console.log('Signup failed - Response status:', response.status);
        console.log('Signup failed - Response data:', JSON.stringify(data, null, 2));

        if (data) {
          if (data.error?.message) {
            errorMessage = data.error.message;
          } else if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.message) {
            errorMessage = data.message;
          }
        }

        console.log('Extracted error message:', errorMessage);
        throw new Error(errorMessage);
      }

      // Store token in localStorage and cookies
      // Backend returns 'jwt' (not 'token')
      const token = data.jwt || data.token;
      if (token) {
        localStorage.setItem('auth-token', token);
        localStorage.setItem('strapi_token', token);
        localStorage.setItem('auth-user', JSON.stringify(data.user));
        localStorage.setItem('user-role', data.user.role || data.user.primaryRole?.name || 'User');

        // Persist organizations returned by signup
        const orgs = data.organizations || [];
        localStorage.setItem('auth-organizations', JSON.stringify(orgs));

        // Auto-select the first org as current if none set yet
        const existingOrgId = localStorage.getItem('current-org-id');
        if (!existingOrgId && orgs.length > 0) {
          localStorage.setItem('current-org-id', String(orgs[0].id));
        }

        // Also store in cookies for middleware access
        document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }

      // Return consistent format (with 'token' key for compatibility)
      return {
        ...data,
        token: data.jwt || data.token,
        user: data.user,
        organizations: data.organizations || [],
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Get current user data
   * @returns {Promise<Object|null>} - Current user data
   */
  async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) return null;

      const mergeStored = (authUser) => {
        const prev = this.getStoredUser() || {};
        return {
          ...prev,
          ...authUser,
          id: authUser.id ?? prev.id,
          documentId: authUser.documentId ?? prev.documentId,
          email: authUser.email ?? prev.email,
          username: authUser.username ?? prev.username,
          firstName: authUser.firstName ?? prev.firstName,
          lastName: authUser.lastName ?? prev.lastName,
        };
      };

      // Prefer custom /api/auth/me — returns firstName/lastName from DB (same as login)
      try {
        const authRes = await fetch(`${this.baseURL}/api/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (authRes.ok) {
          const data = await authRes.json();
          const authUser = flattenUser(data.user);
          const organizations = data.organizations || [];
          if (authUser) {
            const merged = mergeStored(authUser);
            localStorage.setItem('auth-user', JSON.stringify(merged));
            if (organizations.length > 0) {
              localStorage.setItem('auth-organizations', JSON.stringify(organizations));
            }
            return merged;
          }
        } else if (authRes.status === 401) {
          console.warn('Token expired or invalid (auth/me)');
          return null;
        }
      } catch (e) {
        console.warn('auth/me request failed:', e);
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('strapi_token');
    localStorage.removeItem('auth-user');
    localStorage.removeItem('user-role');
    localStorage.removeItem('auth-organizations');
    localStorage.removeItem('current-org-id');

    if (typeof document !== 'undefined') {
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  /**
   * Get stored token
   * @returns {string|null} - Stored token
   */
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth-token');
  }

  /**
   * Get stored user data
   * @returns {Object|null} - Stored user data
   */
  getStoredUser() {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('auth-user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Get stored user role
   * @returns {string|null} - Stored user role
   */
  getStoredUserRole() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('user-role') || 'User';
  }

  /**
   * Get all organizations the user belongs to.
   * @returns {Array} - Array of org objects
   */
  getStoredOrganizations() {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('auth-organizations') || '[]');
    } catch (_) {
      return [];
    }
  }

  /**
   * Get the currently active organization id.
   * @returns {number|null}
   */
  getCurrentOrgId() {
    if (typeof window === 'undefined') return null;
    const id = localStorage.getItem('current-org-id');
    return id ? parseInt(id, 10) : null;
  }

  /**
   * Get the currently active organization object.
   * @returns {Object|null}
   */
  getCurrentOrg() {
    const id = this.getCurrentOrgId();
    if (!id) return null;
    return this.getStoredOrganizations().find((o) => o.id === id) || null;
  }

  getCurrentOrgPermissions() {
    return this.getCurrentOrg()?.permissions || {};
  }

  getCurrentOrgRole() {
    const org = this.getCurrentOrg();
    return {
      name: org?.role || 'Member',
      code: org?.roleCode || 'member',
      accessLevel: org?.accessLevel || null,
    };
  }

  getModuleAccess(appKey, moduleKey) {
    const app = String(appKey || '').toLowerCase();
    const module = String(moduleKey || '');
    return this.getCurrentOrgPermissions()?.[app]?.modules?.[module]?.access || 'none';
  }

  canAccessAppModule(appKey, moduleKey, minimumAccess = 'read') {
    const role = this.getCurrentOrgRole();
    const roleCode = String(role.code || role.name || '').toLowerCase();
    if (roleCode === 'admin' || roleCode.endsWith('-admin') || String(role.name || '').toLowerCase() === 'admin') {
      return true;
    }
    const have = ACCESS_RANK[this.getModuleAccess(appKey, moduleKey)] ?? 0;
    const need = ACCESS_RANK[String(minimumAccess || 'read').toLowerCase()] ?? ACCESS_RANK.read;
    return have >= need;
  }

  canRead(appKey, moduleKey) {
    return this.canAccessAppModule(appKey, moduleKey, 'read');
  }

  canWrite(appKey, moduleKey) {
    return this.canAccessAppModule(appKey, moduleKey, 'write');
  }

  canManage(appKey, moduleKey) {
    return this.canAccessAppModule(appKey, moduleKey, 'manage');
  }

  /**
   * Switch to a different org (must be one the user belongs to).
   * @param {number} orgId
   * @returns {boolean} - true if switched, false if org not found
   */
  setCurrentOrg(orgId) {
    if (typeof window === 'undefined') return false;
    const orgs = this.getStoredOrganizations();
    const found = orgs.find((o) => o.id === orgId || o.id === parseInt(orgId, 10));
    if (!found) return false;
    localStorage.setItem('current-org-id', String(found.id));
    return true;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Check if token is valid by testing it
   * @returns {Promise<boolean>} - Token validity
   */
  async isTokenValid() {
    try {
      const token = this.getToken();
      if (!token) return false;

      const response = await fetch(`${this.baseURL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Check if user has specific permission
   * @param {string} module - Module name (e.g., 'leads', 'accounts')
   * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete')
   * @returns {boolean} - Permission status
   */
  hasPermission(module, action) {
    const user = this.getStoredUser();
    if (module && String(module).includes('.')) {
      const [appKey, moduleKey] = String(module).split('.');
      const actionAccess = action === 'delete' || action === 'manage' ? 'manage' : action === 'create' || action === 'update' || action === 'write' ? 'write' : 'read';
      return this.canAccessAppModule(appKey, moduleKey, actionAccess);
    }
    if (!user || !user.permissions) return false;

    return user.permissions[module] && user.permissions[module][action] === true;
  }

  /**
   * Check if user has specific role
   * @param {string} roleName - Role name to check
   * @returns {boolean} - Role status
   */
  hasRole(roleName) {
    const user = this.getStoredUser();
    if (!user) return false;

    return user.primaryRole?.name === roleName ||
      user.userRoles?.some(role => role.name === roleName);
  }

  /**
   * Check if user is admin level or higher
   * @returns {boolean} - Admin status
   */
  isAdmin() {
    const user = this.getStoredUser();
    if (!user) return false;

    const adminRoles = ['Super Admin', 'Admin', 'Manager'];
    return adminRoles.includes(user.primaryRole?.name) ||
      user.userRoles?.some(role => adminRoles.includes(role.name));
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} - Response data
   */
  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/request-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }

      return data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} - Response data
   */
  async resetPassword(token, password) {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      return data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }
}

const authService = new AuthService();

export default authService;
