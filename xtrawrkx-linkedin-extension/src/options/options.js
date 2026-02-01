/**
 * XtraWrkx LinkedIn Extension Options Page
 * Configuration and authentication interface
 */

class OptionsController {
    constructor() {
        this.apiClient = null;
        this.init();
    }

    async init() {
        // Initialize API client
        this.apiClient = new ExtensionApiClient();
        await this.apiClient.init();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load saved configuration
        await this.loadConfiguration();
        
        // Check connection status
        await this.checkConnectionStatus();
        
        // Check authentication status
        await this.checkAuthStatus();
    }

    setupEventListeners() {
        // Authentication form
        document.getElementById('auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.authenticate();
        });

        // Logout button
        document.getElementById('logout').addEventListener('click', () => {
            this.logout();
        });

        // Help links
        document.getElementById('open-crm').addEventListener('click', (e) => {
            e.preventDefault();
            this.openCRM();
        });

        // Import settings
        document.getElementById('auto-assign').addEventListener('change', this.saveImportSettings.bind(this));
        document.getElementById('check-duplicates').addEventListener('change', this.saveImportSettings.bind(this));
        document.getElementById('show-notifications').addEventListener('change', this.saveImportSettings.bind(this));

        // API Configuration
        document.getElementById('save-api-config').addEventListener('click', () => {
            this.saveApiConfig();
        });
        document.getElementById('test-connection').addEventListener('click', () => {
            this.testConnection();
        });
        document.getElementById('environment').addEventListener('change', () => {
            this.onEnvironmentChange();
        });
    }

    async loadConfiguration() {
        try {
            const config = await chrome.storage.sync.get([
                'autoAssign',
                'checkDuplicates',
                'showNotifications',
                'environment',
                'apiBaseUrl'
            ]);

            // Load import settings
            document.getElementById('auto-assign').checked = config.autoAssign !== false;
            document.getElementById('check-duplicates').checked = config.checkDuplicates !== false;
            document.getElementById('show-notifications').checked = config.showNotifications !== false;

            // Load API configuration
            if (config.environment) {
                document.getElementById('environment').value = config.environment;
            } else {
                // Auto-detect environment
                const isDev = typeof getConfig !== 'undefined' && getConfig().isDevelopment();
                document.getElementById('environment').value = isDev ? 'development' : 'production';
            }

            if (config.apiBaseUrl) {
                document.getElementById('api-url').value = config.apiBaseUrl;
            } else {
                // Set default based on environment
                const env = document.getElementById('environment').value;
                const defaultUrl = env === 'development' 
                    ? 'http://localhost:1337' 
                    : 'https://xtrawrkxsuits-production.up.railway.app';
                document.getElementById('api-url').value = defaultUrl;
            }

        } catch (error) {
            console.error('Failed to load configuration:', error);
        }
    }

    async onEnvironmentChange() {
        const environment = document.getElementById('environment').value;
        const apiUrlInput = document.getElementById('api-url');
        
        // If no custom URL is set, update to default for selected environment
        const stored = await chrome.storage.sync.get(['apiBaseUrl']);
        if (!stored.apiBaseUrl) {
            const defaultUrl = environment === 'development' 
                ? 'http://localhost:1337' 
                : 'https://xtrawrkxsuits-production.up.railway.app';
            apiUrlInput.value = defaultUrl;
        }
    }

    async saveApiConfig() {
        try {
            const environment = document.getElementById('environment').value;
            const apiUrl = document.getElementById('api-url').value.trim();

            if (!apiUrl) {
                this.showStatus('error', 'Invalid Configuration', 'Please enter an API URL');
                return;
            }

            // Validate URL
            if (typeof getConfig !== 'undefined') {
                const configManager = getConfig();
                try {
                    configManager.validateApiUrl(apiUrl, environment === 'development');
                } catch (error) {
                    this.showStatus('error', 'Invalid URL', error.message);
                    return;
                }
            }

            // Save configuration
            await chrome.storage.sync.set({
                environment: environment,
                apiBaseUrl: apiUrl
            });

            // Reinitialize API client with new URL
            if (this.apiClient) {
                this.apiClient.initialized = false;
                await this.apiClient.init();
            }

            this.showStatus('success', 'Configuration Saved', 'API configuration has been updated');
            
            // Update connection status
            await this.checkConnectionStatus();

        } catch (error) {
            console.error('Failed to save API configuration:', error);
            this.showStatus('error', 'Save Failed', error.message || 'Failed to save configuration');
        }
    }

    async testConnection() {
        try {
            const apiUrl = document.getElementById('api-url').value.trim() || 
                          (document.getElementById('environment').value === 'development' 
                            ? 'http://localhost:1337' 
                            : 'https://xtrawrkxsuits-production.up.railway.app');

            this.updateConnectionStatus('checking', 'Testing...', 'Testing connection to API server...');
            
            // Test basic connectivity
            const response = await fetch(`${apiUrl}/api/auth/me`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            // 401 is OK (means server is reachable, just not authenticated)
            if (response.ok || response.status === 401 || response.status === 404) {
                this.updateConnectionStatus('connected', 'Connected', `Successfully connected to ${apiUrl}`);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.error('Connection test failed:', error);
            const apiUrl = document.getElementById('api-url').value.trim() || 'Unknown';
            this.updateConnectionStatus('error', 'Connection Failed', `Unable to reach ${apiUrl}. ${error.message}`);
        }
    }

    async checkConnectionStatus() {
        try {
            // Get configured API URL
            let baseURL;
            if (typeof getConfig !== 'undefined') {
                const configManager = getConfig();
                baseURL = await configManager.getApiUrl();
            } else {
                const stored = await chrome.storage.sync.get(['apiBaseUrl', 'environment']);
                if (stored.apiBaseUrl) {
                    baseURL = stored.apiBaseUrl;
                } else {
                    baseURL = stored.environment === 'development' 
                        ? 'http://localhost:1337' 
                        : 'https://xtrawrkxsuits-production.up.railway.app';
                }
            }

            // Update connection info display
            const connectionUrl = document.getElementById('connection-url');
            const connectionMessage = document.getElementById('connection-message');
            if (connectionUrl) connectionUrl.textContent = baseURL;
            if (connectionMessage) connectionMessage.textContent = `Connecting to ${baseURL}...`;

            // Test basic connectivity
            const response = await fetch(`${baseURL}/api/auth/me`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            // 401 is OK (means server is reachable, just not authenticated)
            if (response.ok || response.status === 401 || response.status === 404) {
                this.updateConnectionStatus('connected', 'Connected', `Successfully connected to API server`);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.error('Connection check failed:', error);
            this.updateConnectionStatus('error', 'Connection Error', 'Unable to reach API server');
        }
    }

    updateConnectionStatus(type, status, message) {
        const statusBadge = document.getElementById('connection-status');
        const connectionInfo = document.getElementById('connection-info');
        const connectionMessage = document.getElementById('connection-message');
        
        statusBadge.className = `status-badge ${type}`;
        statusBadge.querySelector('span').textContent = status;
        
        connectionInfo.className = `connection-info ${type}`;
        if (connectionMessage) {
            connectionMessage.textContent = message;
        }
    }

    async authenticate() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const submitButton = document.querySelector('#auth-form button[type="submit"]');
        
        if (!email || !password) {
            this.showStatus('error', 'Missing Credentials', 'Please enter both email and password');
            return;
        }

        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span>Signing In...</span>';

        try {
            const result = await this.apiClient.authenticate(email, password);
            
            if (result.success) {
                this.showStatus('success', 'Authentication Successful', `Welcome back, ${result.user.name || result.user.email}!`);
                await this.checkAuthStatus();
                
                // Clear password field
                document.getElementById('password').value = '';
            } else {
                throw new Error('Authentication failed');
            }
            
        } catch (error) {
            console.error('Authentication failed:', error);
            this.showStatus('error', 'Authentication Failed', error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }

    async logout() {
        try {
            await this.apiClient.clearAuth();
            this.showStatus('info', 'Signed Out', 'You have been signed out successfully');
            await this.checkAuthStatus();
        } catch (error) {
            console.error('Logout failed:', error);
            this.showStatus('error', 'Logout Failed', error.message);
        }
    }

    async checkAuthStatus() {
        try {
            const config = await this.apiClient.getStoredConfig();
            const authStatus = document.getElementById('auth-status');
            const authForm = document.getElementById('auth-form');
            const logoutButton = document.getElementById('logout');
            
            if (config.authToken && config.userEmail) {
                // User is authenticated
                authStatus.className = 'status-badge connected';
                authStatus.querySelector('span').textContent = `Signed in as ${config.userName || config.userEmail}`;
                
                // Hide form fields, show logout
                authForm.querySelector('.form-group:nth-child(1)').style.display = 'none';
                authForm.querySelector('.form-group:nth-child(2)').style.display = 'none';
                authForm.querySelector('button[type="submit"]').style.display = 'none';
                logoutButton.style.display = 'flex';
                
                // Verify token is still valid
                const isValid = await this.apiClient.verifyAuth();
                if (!isValid) {
                    authStatus.className = 'status-badge warning';
                    authStatus.querySelector('span').textContent = 'Token expired - please sign in again';
                }
                
            } else {
                // User is not authenticated
                authStatus.className = 'status-badge error';
                authStatus.querySelector('span').textContent = 'Not authenticated';
                
                // Show form fields, hide logout
                authForm.querySelector('.form-group:nth-child(1)').style.display = 'block';
                authForm.querySelector('.form-group:nth-child(2)').style.display = 'block';
                authForm.querySelector('button[type="submit"]').style.display = 'flex';
                logoutButton.style.display = 'none';
            }
            
        } catch (error) {
            console.error('Auth status check failed:', error);
            const authStatus = document.getElementById('auth-status');
            authStatus.className = 'status-badge error';
            authStatus.querySelector('span').textContent = 'Authentication error';
        }
    }

    async saveImportSettings() {
        try {
            const settings = {
                autoAssign: document.getElementById('auto-assign').checked,
                checkDuplicates: document.getElementById('check-duplicates').checked,
                showNotifications: document.getElementById('show-notifications').checked
            };
            
            await chrome.storage.sync.set(settings);
            
            // Show brief success message
            this.showStatus('success', 'Settings Saved', 'Import settings have been updated', 2000);
            
        } catch (error) {
            console.error('Failed to save import settings:', error);
            this.showStatus('error', 'Save Failed', 'Could not save import settings');
        }
    }

    async openCRM() {
        try {
            // Use hardcoded production URL
            const crmUrl = 'https://xtrawrkxsuits-production.up.railway.app';
            chrome.tabs.create({ url: crmUrl });
        } catch (error) {
            console.error('Failed to open CRM:', error);
            chrome.tabs.create({ url: 'https://xtrawrkxsuits-production.up.railway.app' });
        }
    }

    showStatus(type, title, message, duration = 5000) {
        const statusElement = document.getElementById('status-message');
        const statusIcon = statusElement.querySelector('.status-icon');
        const statusTitle = statusElement.querySelector('.status-text h4');
        const statusMessage = statusElement.querySelector('.status-text p');
        
        // Update content
        statusIcon.className = `status-icon ${type}`;
        statusTitle.textContent = title;
        statusMessage.textContent = message;
        
        // Update icon
        switch (type) {
            case 'success':
                statusIcon.textContent = '✓';
                break;
            case 'error':
                statusIcon.textContent = '✗';
                break;
            case 'warning':
                statusIcon.textContent = '⚠';
                break;
            case 'info':
                statusIcon.textContent = 'ℹ';
                break;
        }
        
        // Show status
        statusElement.style.display = 'block';
        
        // Auto-hide after duration
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, duration);
    }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OptionsController();
});




