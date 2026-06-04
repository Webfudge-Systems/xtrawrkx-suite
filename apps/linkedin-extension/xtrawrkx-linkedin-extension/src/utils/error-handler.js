/**
 * Error Handler Utility
 * Provides consistent error handling and user-friendly messages
 */
class ErrorHandler {
    constructor() {
        this.logger = null;
    }

    async init() {
        if (typeof getLogger !== 'undefined') {
            this.logger = getLogger();
        }
    }

    async handleApiError(error, context = {}) {
        await this.init();
        
        const errorMessage = error.message || 'Unknown error';
        const errorCode = error.code || error.status;

        // Log error with context
        if (this.logger) {
            this.logger.error('API Error:', {
                message: errorMessage,
                code: errorCode,
                context,
                stack: error.stack
            });
        }

        // Report to error tracking service
        this.reportError(error, context);

        // Return user-friendly message
        return this.getUserFriendlyMessage(errorMessage, errorCode);
    }

    getUserFriendlyMessage(errorMessage, errorCode) {
        // Network errors
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('CORS')) {
            return 'Connection failed. Please check your internet connection and ensure the API server is running.';
        }

        // Authentication errors
        if (errorCode === 401 || 
            errorMessage.includes('Unauthorized') ||
            errorMessage.includes('Invalid credentials') ||
            errorMessage.includes('token')) {
            return 'Your session has expired. Please sign in again.';
        }

        // Authorization errors
        if (errorCode === 403 || errorMessage.includes('Forbidden')) {
            return 'You do not have permission to perform this action.';
        }

        // Not found errors
        if (errorCode === 404 || errorMessage.includes('Not found')) {
            return 'The requested resource was not found.';
        }

        // Validation errors
        if (errorCode === 400 || errorMessage.includes('Validation')) {
            return 'Invalid data provided. Please check your input and try again.';
        }

        // Server errors
        if (errorCode === 500 || errorCode === 502 || errorCode === 503) {
            return 'Server error. Please try again later or contact support if the problem persists.';
        }

        // Rate limiting
        if (errorCode === 429 || errorMessage.includes('rate limit')) {
            return 'Too many requests. Please wait a moment and try again.';
        }

        // Generic error
        return 'An error occurred. Please try again. If the problem persists, contact support.';
    }

    reportError(error, context = {}) {
        // Only report in production
        if (typeof getConfig !== 'undefined') {
            const config = getConfig();
            if (config.isDevelopment()) {
                return; // Don't report errors in development
            }
        }

        try {
            // TODO: Integrate with error tracking service (Sentry, Rollbar, etc.)
            // Example:
            // if (window.Sentry) {
            //     window.Sentry.captureException(error, {
            //         contexts: { custom: context }
            //     });
            // }
        } catch (err) {
            // Fail silently - don't let error reporting break the app
        }
    }

    async handleRetry(error, retryFn, maxRetries = 3, delay = 1000) {
        await this.init();

        if (maxRetries <= 0) {
            throw error;
        }

        // Don't retry on certain errors
        const errorMessage = error.message || '';
        if (errorMessage.includes('401') || 
            errorMessage.includes('403') || 
            errorMessage.includes('404') ||
            errorMessage.includes('Validation')) {
            throw error;
        }

        // Wait before retrying
        await this.sleep(delay);

        try {
            return await retryFn();
        } catch (retryError) {
            if (this.logger) {
                this.logger.warn(`Retry attempt failed. ${maxRetries - 1} retries remaining.`);
            }
            return this.handleRetry(retryError, retryFn, maxRetries - 1, delay * 2);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create singleton instance
let errorHandlerInstance = null;

function getErrorHandler() {
    if (!errorHandlerInstance) {
        errorHandlerInstance = new ErrorHandler();
    }
    return errorHandlerInstance;
}

// Export for different contexts
if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
    window.getErrorHandler = getErrorHandler;
}

if (typeof self !== 'undefined') {
    self.ErrorHandler = ErrorHandler;
    self.getErrorHandler = getErrorHandler;
}

// Support module exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, getErrorHandler };
}

