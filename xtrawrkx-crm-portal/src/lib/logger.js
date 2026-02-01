/**
 * Production-safe logging utility
 * Only logs in development or when debug mode is enabled
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugMode = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

class Logger {
    constructor() {
        this.enabled = isDevelopment || isDebugMode;
    }

    log(...args) {
        if (this.enabled) {
        }
    }

    info(...args) {
        if (this.enabled) {
        }
    }

    warn(...args) {
        // Always log warnings
        console.warn(...args);
    }

    error(...args) {
        // Always log errors
        console.error(...args);
    }

    debug(...args) {
        if (this.enabled) {
        }
    }

    table(data) {
        if (this.enabled && console.table) {
            console.table(data);
        }
    }

    group(label) {
        if (this.enabled && console.group) {
            console.group(label);
        }
    }

    groupEnd() {
        if (this.enabled && console.groupEnd) {
            console.groupEnd();
        }
    }
}

// Export singleton instance
const logger = new Logger();
export default logger;

