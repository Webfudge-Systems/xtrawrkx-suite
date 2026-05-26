// Utility functions for handling dates and Firestore timestamps

/**
 * Safely converts various date formats to a JavaScript Date object
 * @param {Date|Object|string|number} timestamp - The timestamp to convert
 * @returns {Date|null} - JavaScript Date object or null if invalid
 */
export const convertToDate = (timestamp) => {
    if (!timestamp) {
        return null;
    }

    // If it's already a Date object, return it
    if (timestamp instanceof Date) {
        return timestamp;
    }

    // If it's a Firestore Timestamp with toDate method
    if (timestamp && typeof timestamp.toDate === 'function') {
        try {
            return timestamp.toDate();
        } catch (error) {
            return null;
        }
    }

    // If it's a Firestore-like object with seconds and nanoseconds
    if (timestamp && typeof timestamp === 'object' && timestamp.seconds !== undefined) {
        try {
            return new Date(timestamp.seconds * 1000);
        } catch (error) {
            return null;
        }
    }

    // If it's a string, try to parse it as a date
    if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date;
    }

    // If it's a number (Unix timestamp), convert it
    if (typeof timestamp === 'number') {
        return new Date(timestamp);
    }

    return null;
};

/**
 * Formats a timestamp to a localized date string
 * @param {Date|Object|string|number} timestamp - The timestamp to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatDate = (timestamp, options = {}) => {
    const date = convertToDate(timestamp);
    if (!date) {
        return '';
    }

    try {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...options
        });
    } catch (error) {
        return '';
    }
};

/**
 * Formats a timestamp to a relative time string (e.g., "2 days ago")
 * @param {Date|Object|string|number} timestamp - The timestamp to format
 * @returns {string} - Relative time string
 */
export const formatRelativeTime = (timestamp) => {
    const date = convertToDate(timestamp);
    if (!date) {
        return '';
    }

    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
        return 'Today';
    } else if (diffInDays === 1) {
        return 'Yesterday';
    } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
        const months = Math.floor(diffInDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
        const years = Math.floor(diffInDays / 365);
        return years === 1 ? '1 year ago' : `${years} years ago`;
    }
};

/**
 * Formats a timestamp for input fields (YYYY-MM-DD format)
 * @param {Date|Object|string|number} timestamp - The timestamp to format
 * @returns {string} - Date string in YYYY-MM-DD format
 */
export const formatDateForInput = (timestamp) => {
    const date = convertToDate(timestamp);
    if (!date) {
        return '';
    }

    try {
        return date.toISOString().split('T')[0];
    } catch (error) {
        return '';
    }
};

/**
 * Formats a timestamp to match the event display format (e.g., "24th Jan 2025")
 * @param {Date|Object|string|number} timestamp - The timestamp to format
 * @returns {string} - Formatted date string in event display format
 */
export const formatEventDate = (timestamp) => {
    const date = convertToDate(timestamp);
    if (!date) {
        return '';
    }

    try {
        const day = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();

        // Add ordinal suffix to day
        const getOrdinalSuffix = (num) => {
            const j = num % 10;
            const k = num % 100;
            if (j === 1 && k !== 11) return 'st';
            if (j === 2 && k !== 12) return 'nd';
            if (j === 3 && k !== 13) return 'rd';
            return 'th';
        };

        return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
    } catch (error) {
        return '';
    }
};

// Helper function to safely convert Firestore timestamps to Date objects
export const convertFirestoreTimestampToDate = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp;
    if (timestamp.toDate) return timestamp.toDate();
    if (typeof timestamp === 'string') return new Date(timestamp);
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return null;
}; 
