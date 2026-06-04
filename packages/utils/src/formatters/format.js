/**
 * Centralized formatting utilities to ensure consistent formatting
 * across server and client rendering
 */

/**
 * Format currency with consistent locale settings
 * @param {number} amount - The amount to format
 * @param {object|string} options - Options object or currency code (for backward compatibility)
 * @param {string} locale - The locale to use (default: 'en-IN')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, options = {}, locale = 'en-IN') {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }

  // Handle backward compatibility - if options is a string, treat it as currency
  let formatOptions = {};
  if (typeof options === 'string') {
    formatOptions = {
      style: 'currency',
      currency: options,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };
  } else {
    formatOptions = {
      style: 'currency',
      currency: options.currency || 'INR',
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
      maximumFractionDigits: options.maximumFractionDigits ?? 0,
      notation: options.notation,
      compactDisplay: options.compactDisplay,
      ...options
    };
  }

  return new Intl.NumberFormat(locale, formatOptions).format(amount);
}

/**
 * Format number with consistent locale settings
 * @param {number} number - The number to format
 * @param {string} locale - The locale to use (default: 'en-IN')
 * @returns {string} Formatted number string
 */
export function formatNumber(number, locale = 'en-IN') {
  if (typeof number !== 'number' || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat(locale).format(number);
}

/**
 * Format percentage with consistent locale settings
 * @param {number} value - The percentage value (0-100)
 * @param {string} locale - The locale to use (default: 'en-IN')
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, locale = 'en-IN') {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Format date with consistent locale settings
 * @param {string|Date} date - The date to format
 * @param {string} locale - The locale to use (default: 'en-IN')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, locale = 'en-IN', options = {}) {
  if (!date) return '';

  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  const formatOptions = { ...defaultOptions, ...options };

  return new Intl.DateTimeFormat(locale, formatOptions).format(new Date(date));
}

/**
 * Format date with time
 * @param {string|Date} date - The date to format
 * @param {string} locale - The locale to use (default: 'en-IN')
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date, locale = 'en-IN') {
  if (!date) return '';

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - The date to format
 * @param {string} locale - The locale to use (default: 'en-IN')
 * @returns {string} Formatted relative time string
 */
export function formatRelativeTime(date, locale = 'en-IN') {
  if (!date) return '';

  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now - targetDate) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

/**
 * Format file size
 * @param {number} bytes - The file size in bytes
 * @param {string} locale - The locale to use (default: 'en-IN')
 * @returns {string} Formatted file size string
 */
export function formatFileSize(bytes, locale = 'en-IN') {
  if (typeof bytes !== 'number' || isNaN(bytes)) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  }).format(size)} ${units[unitIndex]}`;
}

/**
 * Format duration in hours
 * @param {number} hours - The duration in hours
 * @param {string} locale - The locale to use (default: 'en-IN')
 * @returns {string} Formatted duration string
 */
export function formatDuration(hours, locale = 'en-IN') {
  if (typeof hours !== 'number' || isNaN(hours)) {
    return '0h';
  }

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes}m`;
  } else if (hours < 24) {
    return `${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(hours)}h`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days}d`;
    } else {
      return `${days}d ${new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(remainingHours)}h`;
    }
  }
}

/**
 * Format currency with Indian numbering system (Cr, Lakh, Thousand)
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @param {number} options.decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string with compact notation
 */
export function formatCurrencyCompact(amount, options = {}) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }

  const decimals = options.decimals ?? 2;
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  // 1 Crore = 1,00,00,000
  if (absAmount >= 10000000) {
    const crores = absAmount / 10000000;
    return `${sign}₹${crores.toFixed(decimals)} Cr`;
  }
  // 1 Lakh = 1,00,000
  else if (absAmount >= 100000) {
    const lakhs = absAmount / 100000;
    return `${sign}₹${lakhs.toFixed(decimals)} Lakh`;
  }
  // 1 Thousand = 1,000
  else if (absAmount >= 1000) {
    const thousands = absAmount / 1000;
    return `${sign}₹${thousands.toFixed(decimals)} Thousand`;
  }
  // Less than 1000, show full number
  else {
    return `${sign}₹${absAmount.toFixed(0)}`;
  }
}
