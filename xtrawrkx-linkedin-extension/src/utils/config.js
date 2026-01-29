/**
 * Configuration Manager
 * Handles environment-based configuration and validation
 */
class Config {
    constructor() {
        this.allowedDomains = [
            'xtrawrkxsuits-production.up.railway.app',
            'xtrawrkx.com',
            'localhost',
            '127.0.0.1'
        ];
        this.defaultProductionUrl = 'https://xtrawrkxsuits-production.up.railway.app';
        this.defaultDevUrl = 'http://localhost:1337';
    }

    /**
     * Get API URL based on environment and stored configuration
     * Priority: Stored URL > Environment detection > Default
     */
    async getApiUrl() {
        try {
            // First, check if user has manually set an API URL
            const stored = await chrome.storage.sync.get(['apiBaseUrl', 'environment']);
            
            if (stored.apiBaseUrl) {
                // User has manually configured URL
                return stored.apiBaseUrl;
            }

            // Check if environment is explicitly set
            if (stored.environment === 'development') {
                return this.defaultDevUrl;
            }
            if (stored.environment === 'production') {
                return this.defaultProductionUrl;
            }

            // Auto-detect based on manifest or default to production
            const isDev = this.isDevelopment();
            return isDev ? this.defaultDevUrl : this.defaultProductionUrl;
        } catch (error) {
            console.error('Error getting API URL:', error);
            // Fallback to production
            return this.defaultProductionUrl;
        }
    }

    /**
     * Set API URL and optionally environment
     */
    async setApiUrl(url, environment = null) {
        this.validateApiUrl(url, true); // Allow localhost when setting
        
        const dataToStore = { apiBaseUrl: url };
        if (environment) {
            dataToStore.environment = environment;
        }
        
        await chrome.storage.sync.set(dataToStore);
    }

    /**
     * Set environment (development or production)
     */
    async setEnvironment(environment) {
        if (environment !== 'development' && environment !== 'production') {
            throw new Error('Environment must be "development" or "production"');
        }
        
        await chrome.storage.sync.set({ environment });
        
        // If no custom URL is set, update to default for that environment
        const stored = await chrome.storage.sync.get(['apiBaseUrl']);
        if (!stored.apiBaseUrl) {
            const defaultUrl = environment === 'development' ? this.defaultDevUrl : this.defaultProductionUrl;
            await chrome.storage.sync.set({ apiBaseUrl: defaultUrl });
        }
    }

    /**
     * Get current environment
     */
    async getEnvironment() {
        try {
            const stored = await chrome.storage.sync.get(['environment']);
            if (stored.environment) {
                return stored.environment;
            }
            // Auto-detect
            return this.isDevelopment() ? 'development' : 'production';
        } catch (error) {
            return 'production'; // Default fallback
        }
    }

    validateApiUrl(url, allowLocalhost = false) {
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid API URL: URL must be a string');
        }

        try {
            const urlObj = new URL(url);

            // Allow localhost in development
            if (allowLocalhost && (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
                return true;
            }

            // Check if domain is in allowed list
            const isAllowed = this.allowedDomains.some(domain =>
                urlObj.hostname.includes(domain) || domain.includes(urlObj.hostname)
            );

            if (!isAllowed) {
                throw new Error(`Invalid API URL: Domain ${urlObj.hostname} is not allowed`);
            }

            // Ensure HTTPS in production
            if (!allowLocalhost && urlObj.protocol !== 'https:') {
                throw new Error('Invalid API URL: Production URLs must use HTTPS');
            }

            return true;
        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error('Invalid API URL: URL format is invalid');
            }
            throw error;
        }
    }

    async setApiUrl(url) {
        this.validateApiUrl(url, true); // Allow localhost when setting
        await chrome.storage.sync.set({ apiBaseUrl: url });
    }

    isProduction() {
        const manifest = chrome.runtime.getManifest();
        return !manifest.version.includes('dev') && !manifest.version.includes('beta');
    }

    isDevelopment() {
        return !this.isProduction();
    }
}

// Create singleton instance
let configInstance = null;

function getConfig() {
    if (!configInstance) {
        configInstance = new Config();
    }
    return configInstance;
}

// Export for different contexts
if (typeof window !== 'undefined') {
    window.Config = Config;
    window.getConfig = getConfig;
}

if (typeof self !== 'undefined') {
    self.Config = Config;
    self.getConfig = getConfig;
}

// Support module exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Config, getConfig };
}

