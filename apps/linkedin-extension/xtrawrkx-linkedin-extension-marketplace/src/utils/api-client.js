/**
 * API Client for XtraWrkx LinkedIn Extension
 * Handles communication with the CRM backend
 */

// Note: Utilities (logger, config, error-handler) are loaded by the service worker via importScripts
// In other contexts (sidebar, options), they are loaded via script tags in HTML

class ExtensionApiClient {
    constructor() {
        this.baseURL = null;
        this.token = null;
        this.initialized = false;
        this.logger = typeof getLogger !== 'undefined' ? getLogger() : null;
        this.config = typeof getConfig !== 'undefined' ? getConfig() : null;
        this.errorHandler = typeof getErrorHandler !== 'undefined' ? getErrorHandler() : null;
    }

    async init() {
        if (this.initialized) return;

        try {
            const config = await chrome.storage.sync.get(['authToken']);
            this.token = config.authToken;

            // Get API URL from config (supports dev/prod environments)
            if (typeof getConfig !== 'undefined') {
                const configManager = getConfig();
                this.baseURL = await configManager.getApiUrl();
            } else {
                // Fallback if config is not available
                const stored = await chrome.storage.sync.get(['apiBaseUrl']);
                this.baseURL = stored.apiBaseUrl || 'https://xtrawrkxsuits-production.up.railway.app';
            }

            if (this.logger) {
                this.logger.log('API Client initialized with baseURL:', this.baseURL);
            }

            this.initialized = true;
        } catch (error) {
            if (this.logger) {
                this.logger.error('Failed to initialize API client:', error);
            }
            // Fallback to production URL
            this.baseURL = 'https://xtrawrkxsuits-production.up.railway.app';
            this.initialized = true;
        }
    }

    async request(endpoint, options = {}, retryCount = 0) {
        await this.init();

        const url = `${this.baseURL}/api${endpoint}`;
        const requestConfig = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        if (requestConfig.body && typeof requestConfig.body === 'object') {
            requestConfig.body = JSON.stringify(requestConfig.body);
        }

        try {
            if (this.logger) {
                this.logger.log('API Request:', url);
            }

            // Re-read token before every request so it's always fresh
            const freshConfig = await chrome.storage.sync.get(['authToken']);
            if (freshConfig.authToken && freshConfig.authToken !== this.token) {
                this.token = freshConfig.authToken;
                requestConfig.headers['Authorization'] = `Bearer ${this.token}`;
            }

            const response = await fetch(url, requestConfig);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                const error = new Error(errorMessage);
                error.status = response.status;
                error.code = response.status;

                if (this.logger) {
                    this.logger.error('API Error Response:', response.status, errorMessage);
                }

                // Clear authentication on 401 Unauthorized errors
                if (response.status === 401) {
                    if (this.logger) {
                        this.logger.warn('Received 401 Unauthorized - clearing authentication token');
                    }
                    await this.clearAuth();
                }

                throw error;
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (this.logger) {
                    this.logger.log('API Response received');
                }
                return data;
            }

            return response;
        } catch (error) {
            if (this.logger) {
                this.logger.error('API Request Failed:', error);
            }

            const isNetworkError =
                error.message.includes('Failed to fetch') ||
                error.message.includes('NetworkError') ||
                error.message.includes('ERR_CONNECTION') ||
                error.message.includes('ERR_CONN');

            // Wrap network errors with the target URL so users can diagnose config issues
            if (isNetworkError) {
                const friendly = new Error(
                    `Cannot reach server at ${this.baseURL}. ` +
                    `Check your internet connection or visit the extension options to verify the API URL.`
                );
                friendly.status = 0;
                friendly.isNetworkError = true;
                throw friendly;
            }

            // Retry once on 5xx errors
            if (retryCount < 1 && error.code >= 500) {
                if (this.logger) {
                    this.logger.warn(`Retrying request (attempt ${retryCount + 1}/1)...`);
                }
                await this.sleep(1000);
                return this.request(endpoint, options, retryCount + 1);
            }

            if (this.errorHandler) {
                const friendlyError = await this.errorHandler.handleApiError(error, { endpoint, url });
                error.userMessage = friendlyError;
            }

            throw error;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Authentication methods
    async authenticate(email, password) {
        try {
            if (this.logger) {
                this.logger.log('Authenticating with:', this.baseURL);
            }

            const response = await this.request('/auth/login', {
                method: 'POST',
                body: { identifier: email, password }
            });

            const token = response.jwt || response.token;
            if (token && response.user) {
                this.token = token;
                await chrome.storage.sync.set({
                    authToken: token,
                    userId: response.user.id,
                    userEmail: response.user.email,
                    userName: response.user.name || `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim()
                });
                if (this.logger) {
                    this.logger.log('Authentication successful, token stored');
                }
                return { success: true, user: response.user };
            }

            throw new Error('Invalid response from server');
        } catch (error) {
            if (this.logger) {
                this.logger.error('Authentication error:', error);
            }

            // Use error handler for user-friendly messages
            if (this.errorHandler) {
                const friendlyMessage = await this.errorHandler.handleApiError(error, { operation: 'authentication' });
                error.userMessage = friendlyMessage;
            }

            throw error;
        }
    }

    async verifyAuth() {
        await this.init();

        // Reload token from storage in case it was updated
        const config = await chrome.storage.sync.get(['authToken']);
        if (config.authToken) {
            this.token = config.authToken;
        }

        // If no token, user is not authenticated
        if (!this.token) {
            return false;
        }

        // Basic JWT format check (has 3 parts separated by dots)
        const tokenParts = this.token.split('.');
        if (tokenParts.length !== 3) {
            // Invalid token format, clear it
            await this.clearAuth();
            return false;
        }

        // Check if token is expired by decoding JWT payload
        try {
            const payload = JSON.parse(atob(tokenParts[1]));
            const currentTime = Date.now() / 1000;

            // If token has expiration and it's expired, clear it
            if (payload.exp && payload.exp < currentTime) {
                if (this.logger) {
                    this.logger.warn('Token expired - clearing authentication');
                }
                await this.clearAuth();
                return false;
            }
        } catch (error) {
            // If we can't decode the token, don't clear it immediately
            // The token might still be valid, just with a different format
            // Let the server validate it on the next API call
            if (this.logger) {
                this.logger.warn('Could not decode token for expiration check, will validate on next API call:', error.message);
            }
            // Don't clear auth here - let server-side validation handle it
            // Return true to allow the token to be used, server will reject if invalid
            return true;
        }

        // Token exists, has valid format, and is not expired
        // Actual server-side validation will happen on the next API call that requires auth
        return true;
    }

    // Lead Company methods
    async createLeadCompany(data) {
        return this.request('/lead-companies', {
            method: 'POST',
            body: { data }
        });
    }

    async checkDuplicateCompany(linkedInUrl) {
        const existing = await this.findLeadCompanyByLinkedIn(linkedInUrl);
        return Boolean(existing);
    }

    async findLeadCompanyByLinkedIn(linkedInUrl) {
        try {
            const normalized = this.normalizeCompanyLinkedInUrl(linkedInUrl);
            if (!normalized) return null;

            const slug = normalized.match(/\/company\/([^/?#]+)/i)?.[1]?.toLowerCase() || '';

            const queryParams = new URLSearchParams({
                'filters[linkedIn][$eq]': normalized,
                'pagination[pageSize]': '25',
                'populate[convertedAccount]': 'true',
            });

            const response = await this.request(`/lead-companies?${queryParams}`, {
                method: 'GET',
            });

            let rows = response.data || [];
            let match = rows.find(
                (row) => this.normalizeCompanyLinkedInUrl(row.linkedIn) === normalized,
            );
            if (match) return match;

            if (!slug) return null;

            const fallbackParams = new URLSearchParams({
                'pagination[pageSize]': '200',
                'populate[convertedAccount]': 'true',
            });
            const fallback = await this.request(`/lead-companies?${fallbackParams}`, {
                method: 'GET',
            });
            rows = fallback.data || [];

            return (
                rows.find((row) => {
                    const rowUrl = this.normalizeCompanyLinkedInUrl(row.linkedIn);
                    if (!rowUrl) return false;
                    if (rowUrl === normalized) return true;
                    return rowUrl.toLowerCase().includes(`/company/${slug}`);
                }) || null
            );
        } catch (error) {
            if (this.logger) {
                this.logger.error('Error finding lead company by LinkedIn URL:', error);
            }
            return null;
        }
    }

    normalizeCompanyLinkedInUrl(href) {
        if (!href || typeof href !== 'string') return '';

        const trimmed = href.trim();
        if (!trimmed) return '';

        if (/^https?:\/\//i.test(trimmed)) {
            try {
                const url = new URL(trimmed.split('?')[0]);
                if (url.pathname.includes('/company/')) {
                    return `${url.origin}${url.pathname.replace(/\/$/, '')}`;
                }
            } catch {
                return '';
            }
        }

        const slugMatch = trimmed.match(/\/company\/([^/?#]+)/i);
        if (slugMatch?.[1]) {
            return `https://www.linkedin.com/company/${slugMatch[1]}`;
        }

        return '';
    }

    normalizeCompanyName(name) {
        return String(name || '')
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
    }

    cleanCompanyName(name) {
        return String(name || '')
            .replace(/\u00a0/g, ' ')
            .replace(/\s+logo$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    pickExactCompanyNameMatch(rows, companyName) {
        if (!Array.isArray(rows) || !rows.length) return null;

        const target = this.normalizeCompanyName(this.cleanCompanyName(companyName));
        if (!target) return null;

        return rows.find((row) => this.normalizeCompanyName(row.companyName) === target) || null;
    }

    async findLeadCompanyByExactName(companyName) {
        try {
            const name = this.cleanCompanyName(companyName);
            if (!name) return null;

            const queryParams = new URLSearchParams({
                'filters[companyName][$eqi]': name,
                'pagination[pageSize]': '50',
                'populate[convertedAccount]': 'true',
            });

            const response = await this.request(`/lead-companies?${queryParams}`, {
                method: 'GET',
            });

            let match = this.pickExactCompanyNameMatch(response.data, name);
            if (match) return match;

            const fallbackParams = new URLSearchParams({
                'pagination[pageSize]': '200',
                'populate[convertedAccount]': 'true',
            });
            const fallback = await this.request(`/lead-companies?${fallbackParams}`, {
                method: 'GET',
            });

            return this.pickExactCompanyNameMatch(fallback.data, name);
        } catch (error) {
            if (this.logger) {
                this.logger.error('Error finding lead company by name:', error);
            }
            return null;
        }
    }

    async findClientAccountByExactName(companyName) {
        try {
            const name = this.cleanCompanyName(companyName);
            if (!name) return null;

            // Client-account list endpoint ignores REST filters — filter client-side.
            const queryParams = new URLSearchParams({
                'pagination[pageSize]': '200',
            });

            const response = await this.request(`/client-accounts?${queryParams}`, {
                method: 'GET',
            });

            return this.pickExactCompanyNameMatch(response.data, name);
        } catch (error) {
            if (this.logger) {
                this.logger.error('Error finding client account by name:', error);
            }
            return null;
        }
    }

    /**
     * Reuse an existing lead company / client account before creating a duplicate.
     * Profile imports always prefer lead companies; client accounts only when no lead exists.
     */
    async findExistingCompanyForImport({ companyName, companyLinkedInUrl } = {}) {
        const linkedInUrl = this.normalizeCompanyLinkedInUrl(companyLinkedInUrl);
        const trimmedName = this.cleanCompanyName(companyName);

        if (linkedInUrl) {
            const byUrl = await this.findLeadCompanyByLinkedIn(linkedInUrl);
            if (byUrl) {
                byUrl._companyType = 'lead';
                return { kind: 'leadCompany', record: byUrl };
            }
        }

        if (!trimmedName) return null;

        const lead = await this.findLeadCompanyByExactName(trimmedName);
        if (lead) {
            lead._companyType = 'lead';
            return { kind: 'leadCompany', record: lead };
        }

        const client = await this.findClientAccountByExactName(trimmedName);
        if (client) {
            client._companyType = 'client';
            return { kind: 'clientAccount', record: client };
        }

        return null;
    }

    // Contact methods
    async createContact(data) {
        return this.request('/contacts', {
            method: 'POST',
            body: { data }
        });
    }

    async checkDuplicateContact(email, linkedInUrl) {
        try {
            const filters = [];
            if (email) filters.push(`filters[$or][0][email][$eq]=${encodeURIComponent(email)}`);
            if (linkedInUrl) filters.push(`filters[$or][1][linkedIn][$eq]=${encodeURIComponent(linkedInUrl)}`);

            if (filters.length === 0) return false;

            const queryParams = filters.join('&') + '&pagination[pageSize]=1';
            const response = await this.request(`/contacts?${queryParams}`, {
                method: 'GET'
            });

            return response.data && response.data.length > 0;
        } catch (error) {
            if (this.logger) {
                this.logger.error('Error checking duplicate contact:', error);
            }
            return false;
        }
    }

    async findExistingContact(linkedInUrl) {
        try {
            if (!linkedInUrl) return null;

            if (this.logger) {
                this.logger.log('Finding existing contact for LinkedIn URL:', linkedInUrl);
            }

            const queryParams = new URLSearchParams({
                'filters[linkedIn][$eq]': linkedInUrl,
                'pagination[pageSize]': '1',
                'populate[leadCompany]': 'true',
                'populate[clientAccount]': 'true',
                'populate[account]': 'true',
                'populate[assignedTo]': 'true'
            });

            const response = await this.request(`/contacts?${queryParams}`, {
                method: 'GET'
            });

            if (response.data && response.data.length > 0) {
                const contact = response.data[0];
                if (this.logger) {
                    this.logger.log('Found existing contact');
                }
                return contact;
            }

            return null;
        } catch (error) {
            if (this.logger) {
                this.logger.error('Error finding existing contact:', error);
            }
            return null;
        }
    }

    async updateContact(contactId, data) {
        return this.request(`/contacts/${contactId}`, {
            method: 'PUT',
            body: { data },
        });
    }

    // Related data methods
    relationId(relation) {
        if (relation == null) return null;
        if (typeof relation === 'object') return relation.id ?? null;
        return relation;
    }

    mergeById(items) {
        const map = new Map();
        for (const item of items || []) {
            if (item?.id != null) map.set(item.id, item);
        }
        return [...map.values()];
    }

    matchesContactScope(record, scope) {
        const { contactId, leadCompanyId, clientAccountId } = scope;
        const recordContactId = this.relationId(record.contact);
        const recordLeadId = this.relationId(record.leadCompany);
        const recordClientId = this.relationId(record.clientAccount);

        if (contactId && recordContactId != null && String(recordContactId) === String(contactId)) {
            return true;
        }
        if (leadCompanyId && recordLeadId != null && String(recordLeadId) === String(leadCompanyId)) {
            return true;
        }
        if (clientAccountId && recordClientId != null && String(recordClientId) === String(clientAccountId)) {
            return true;
        }
        return false;
    }

    buildContactScope(contact) {
        return {
            contactId: contact?.id ?? null,
            leadCompanyId: this.relationId(contact?.leadCompany),
            clientAccountId: this.relationId(contact?.clientAccount),
        };
    }

    async fetchList(endpoint, filterPairs, options = {}) {
        const queryParams = new URLSearchParams({
            populate: options.populate || '*',
            sort: options.sort || 'createdAt:desc',
            'pagination[pageSize]': String(options.pageSize || 25),
        });

        for (const [key, value] of filterPairs) {
            if (value != null && value !== '') {
                queryParams.set(key, value);
            }
        }

        if (options.scope) {
            queryParams.set('scope', options.scope);
        }

        const response = await this.request(`${endpoint}?${queryParams}`, { method: 'GET' });
        return response.data || [];
    }

    async getContactRelatedData(contact) {
        try {
            const scope = typeof contact === 'object'
                ? this.buildContactScope(contact)
                : { contactId: contact, leadCompanyId: null, clientAccountId: null };

            const [dealsResponse, tasksResponse, filesResponse, activitiesResponse, chatsResponse] =
                await Promise.all([
                    this.getRelatedDeals(scope),
                    this.getRelatedTasks(scope),
                    this.getRelatedFiles(scope),
                    this.getRelatedMeetings(scope),
                    scope.contactId ? this.getContactChats(scope.contactId) : Promise.resolve([]),
                ]);

            return {
                deals: dealsResponse,
                tasks: tasksResponse,
                files: filesResponse,
                activities: activitiesResponse,
                chats: chatsResponse,
            };
        } catch (error) {
            if (this.logger) {
                this.logger.error('Error fetching contact related data:', error);
            }
            throw error;
        }
    }

    async getRelatedDeals(scope) {
        const { contactId, leadCompanyId, clientAccountId } = scope;
        const requests = [];

        if (contactId) {
            requests.push(this.fetchList('/deals', [['filters[contact][id][$eq]', contactId]]));
        }
        if (leadCompanyId) {
            requests.push(this.fetchList('/deals', [['filters[leadCompany][id][$eq]', leadCompanyId]]));
        }
        if (clientAccountId) {
            requests.push(this.fetchList('/deals', [['filters[clientAccount][id][$eq]', clientAccountId]]));
        }

        if (!requests.length) return [];

        const batches = await Promise.all(requests);
        const merged = this.mergeById(batches.flat());
        return merged
            .filter((deal) => this.matchesContactScope(deal, scope))
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 25);
    }

    async getRelatedTasks(scope) {
        const { leadCompanyId, clientAccountId } = scope;
        const requests = [];

        if (leadCompanyId) {
            requests.push(this.fetchList('/tasks', [['filters[leadCompany][id][$eq]', leadCompanyId]], {
                sort: 'scheduledDate:desc',
                pageSize: 50,
                scope: 'crm',
            }));
        }
        if (clientAccountId) {
            requests.push(this.fetchList('/tasks', [['filters[clientAccount][id][$eq]', clientAccountId]], {
                sort: 'scheduledDate:desc',
                pageSize: 50,
                scope: 'crm',
            }));
        }

        if (!requests.length) return [];

        const batches = await Promise.all(requests);
        return this.mergeById(batches.flat())
            .filter((task) => this.matchesContactScope(task, scope))
            .sort((a, b) => new Date(b.scheduledDate || b.createdAt || 0) - new Date(a.scheduledDate || a.createdAt || 0))
            .slice(0, 25);
    }

    async getRelatedFiles(scope) {
        const { leadCompanyId, clientAccountId } = scope;
        const requests = [];

        if (leadCompanyId) {
            requests.push(this.fetchList('/proposals', [['filters[leadCompany][id][$eq]', leadCompanyId]], {
                populate: 'proposalFile,leadCompany,clientAccount,deal',
                pageSize: 25,
            }));
        }
        if (clientAccountId) {
            requests.push(this.fetchList('/proposals', [['filters[clientAccount][id][$eq]', clientAccountId]], {
                populate: 'proposalFile,leadCompany,clientAccount,deal',
                pageSize: 25,
            }));
        }

        if (!requests.length) return [];

        const batches = await Promise.all(requests);
        return this.mergeById(batches.flat())
            .filter((proposal) => this.matchesContactScope(proposal, scope))
            .slice(0, 25);
    }

    async getRelatedMeetings(scope) {
        const { contactId, leadCompanyId, clientAccountId } = scope;
        const requests = [];

        if (contactId) {
            requests.push(this.fetchList('/meetings', [['filters[contact][id][$eq]', contactId]], {
                sort: 'startTime:desc',
                pageSize: 25,
            }));
        }
        if (leadCompanyId) {
            requests.push(this.fetchList('/meetings', [['filters[leadCompany][id][$eq]', leadCompanyId]], {
                sort: 'startTime:desc',
                pageSize: 25,
            }));
        }
        if (clientAccountId) {
            requests.push(this.fetchList('/meetings', [['filters[clientAccount][id][$eq]', clientAccountId]], {
                sort: 'startTime:desc',
                pageSize: 25,
            }));
        }

        if (!requests.length) return [];

        const batches = await Promise.all(requests);
        return this.mergeById(batches.flat())
            .filter((meeting) => this.matchesContactScope(meeting, scope))
            .sort((a, b) => new Date(b.startTime || b.createdAt || 0) - new Date(a.startTime || a.createdAt || 0))
            .slice(0, 25);
    }

    async getContactDeals(contactId) {
        return this.getRelatedDeals({ contactId, leadCompanyId: null, clientAccountId: null });
    }

    async getContactTasks(contactId) {
        return this.getRelatedTasks({ contactId, leadCompanyId: null, clientAccountId: null });
    }

    async getContactFiles(contactId) {
        return this.getRelatedFiles({ contactId, leadCompanyId: null, clientAccountId: null });
    }

    async getContactActivities(contactId) {
        return this.getRelatedMeetings({ contactId, leadCompanyId: null, clientAccountId: null });
    }

    async getContactChats(contactId) {
        try {
            const queryParams = new URLSearchParams({
                'filters[contact][id][$eq]': contactId,
                'populate': '*',
                'sort': 'createdAt:desc',
                'pagination[pageSize]': '20'
            });

            const response = await this.request(`/chat-messages?${queryParams}`, {
                method: 'GET'
            });

            return response.data || [];

        } catch (error) {
            if (this.logger) {
                this.logger.error('Error fetching contact chats:', error);
            }
            return [];
        }
    }

    async getCompanyData(companyId) {
        try {
            const queryParams = new URLSearchParams({
                'populate[contacts]': 'true',
                'populate[deals]': 'true',
                'populate[accountManager]': 'true',
                'populate[convertedFromLead]': 'true'
            });

            const response = await this.request(`/client-accounts/${companyId}?${queryParams}`, {
                method: 'GET'
            });

            if (response.data) {
                // Mark as client account
                response.data._companyType = 'client';
            }

            return response.data || null;

        } catch (error) {
            if (this.logger) {
                this.logger.error('Error fetching company data:', error);
            }
            return null;
        }
    }

    async getLeadCompanyData(leadCompanyId) {
        try {
            const queryParams = new URLSearchParams({
                'populate[contacts]': 'true',
                'populate[assignedTo]': 'true',
                'populate[convertedAccount]': 'true',
                'populate[deals]': 'true'
            });

            const response = await this.request(`/lead-companies/${leadCompanyId}?${queryParams}`, {
                method: 'GET'
            });

            if (response.data) {
                // Mark as lead company
                response.data._companyType = 'lead';
            }

            return response.data || null;

        } catch (error) {
            if (this.logger) {
                this.logger.error('Error fetching lead company data:', error);
            }
            return null;
        }
    }

    async searchCompanyByName(companyName) {
        try {
            const existing = await this.findExistingCompanyForImport({ companyName });
            if (existing?.record) {
                return existing.record;
            }
            return null;
        } catch (error) {
            console.error('❌ Error searching company by name:', error);
            if (this.logger) {
                this.logger.error('Error searching company by name:', error);
            }
            return null;
        }
    }

    // Lead methods
    async createLead(data) {
        return this.request('/leads', {
            method: 'POST',
            body: { data }
        });
    }

    // Utility methods
    async getUserId() {
        const { userId } = await chrome.storage.sync.get(['userId']);
        return userId;
    }

    async getStoredConfig() {
        return chrome.storage.sync.get(['apiBaseUrl', 'authToken', 'userId', 'userEmail', 'userName']);
    }

    async clearAuth() {
        if (this.logger) {
            this.logger.warn('Clearing authentication data');
        }
        this.token = null;
        try {
            await chrome.storage.sync.remove(['authToken', 'userId', 'userEmail', 'userName']);
        } catch (error) {
            if (this.logger) {
                this.logger.error('Error clearing auth from storage:', error);
            }
        }
    }
}

// Export as global for use in different contexts
if (typeof window !== 'undefined') {
    window.ExtensionApiClient = ExtensionApiClient;
}

// Also support module export for service worker
if (typeof self !== 'undefined') {
    self.ExtensionApiClient = ExtensionApiClient;
}

