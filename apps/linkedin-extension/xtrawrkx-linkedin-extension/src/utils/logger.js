/**
 * Production-safe Logger Utility
 * Replaces console.log with environment-aware logging
 */
class Logger {
    constructor() {
        this.debugMode = false;
        this.init();
    }

    async init() {
        try {
            const config = await chrome.storage.sync.get(['debugMode']);
            this.debugMode = config.debugMode || false;
            
            // Enable debug mode in development versions
            const manifest = chrome.runtime.getManifest();
            if (manifest.version.includes('dev') || manifest.version.includes('beta')) {
                this.debugMode = true;
            }
        } catch (error) {
            // Fail silently, default to production mode
            this.debugMode = false;
        }
    }

    log(...args) {
        if (this.debugMode) {
        }
    }

    error(...args) {
        // Always log errors, but sanitize sensitive data
        const sanitized = args.map(arg => this.sanitize(arg));
        console.error(...sanitized);
        
        // In production, send to error tracking service
        if (!this.debugMode) {
            this.reportError(sanitized);
        }
    }

    warn(...args) {
        if (this.debugMode) {
            console.warn(...args);
        }
    }

    info(...args) {
        if (this.debugMode) {
        }
    }

    sanitize(data) {
        if (typeof data === 'string') {
            // Remove passwords, tokens, and sensitive data
            return data
                .replace(/password["']?\s*[:=]\s*["']?([^"',}\s]+)/gi, 'password: ***')
                .replace(/token["']?\s*[:=]\s*["']?([^"',}\s]+)/gi, 'token: ***')
                .replace(/authToken["']?\s*[:=]\s*["']?([^"',}\s]+)/gi, 'authToken: ***')
                .replace(/Bearer\s+[\w\-\.]+/gi, 'Bearer ***');
        }
        if (typeof data === 'object' && data !== null) {
            const sanitized = { ...data };
            ['password', 'token', 'authToken', 'authorization'].forEach(key => {
                if (sanitized[key]) {
                    sanitized[key] = '***';
                }
            });
            return sanitized;
        }
        return data;
    }

    reportError(errorData) {
        // TODO: Integrate with error tracking service (Sentry, etc.)
        // For now, just log to console
        try {
            // Example: Send to error tracking service
            // fetch('https://error-tracking-service.com/api/errors', {
            //     method: 'POST',
            //     body: JSON.stringify(errorData)
            // });
        } catch (err) {
            // Fail silently
        }
    }
}

// Create singleton instance
let loggerInstance = null;

function getLogger() {
    if (!loggerInstance) {
        loggerInstance = new Logger();
    }
    return loggerInstance;
}

// Export for different contexts
if (typeof window !== 'undefined') {
    window.Logger = Logger;
    window.getLogger = getLogger;
}

if (typeof self !== 'undefined') {
    self.Logger = Logger;
    self.getLogger = getLogger;
}

// Support module exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Logger, getLogger };
}

