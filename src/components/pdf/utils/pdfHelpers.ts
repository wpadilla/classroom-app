// PDF Helper Utilities
import _ from 'lodash';

// Local IMedia interface (stub for PDF system)
interface IMedia {
  url: string;
  content?: string;
  name?: string;
  type?: string;
}

/**
 * Get nested value from object using lodash get
 */
export const getNestedValue = (obj: any, path: string): any => {
  return _.get(obj, path);
};

/**
 * Format currency value
 */
export const formatCurrency = (
  amount: number,
  currency: string = '$',
  locale: string = 'en-US'
): string => {
  return `${currency}${amount.toLocaleString(locale)}`;
};

/**
 * Format date to localized string
 */
export const formatDate = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj?.toLocaleString?.();
};

/**
 * Extract image source from IMedia or string
 */
export const getImageSource = (media: IMedia | string | undefined): string | undefined => {
  if (!media) return undefined;
  if (typeof media === 'string') return media;
  return media.content || media.url;
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Calculate column width for grid layouts
 */
export const calculateColumnWidth = (
  totalWidth: number,
  columns: number,
  gap: number = 0
): number => {
  return (totalWidth - gap * (columns - 1)) / columns;
};

/**
 * Convert color name to hex value
 */
export const colorNameToHex = (color: string): string => {
  const colorMap: Record<string, string> = {
    white: '#ffffff',
    black: '#000000',
    red: '#ef4444',
    green: '#22c55e',
    blue: '#3b82f6',
    yellow: '#eab308',
    orange: '#f97316',
    purple: '#a855f7',
    pink: '#ec4899',
    gray: '#6b7280',
  };
  return colorMap[color.toLowerCase()] || color;
};

/**
 * Safely parse number from string or number
 */
export const parseNumber = (value: any, defaultValue: number = 0): number => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Generate unique ID for PDF elements
 */
export const generateId = (prefix: string = 'pdf'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Merge PDF styles (similar to clsx for className)
 */
export const mergeStyles = (...styles: any[]): any => {
  return Object.assign({}, ...styles.filter(Boolean));
};

/**
 * Calculate responsive font size based on container width
 */
export const getResponsiveFontSize = (
  baseSize: number,
  containerWidth: number,
  breakpoint: number = 600
): number => {
  if (containerWidth < breakpoint) {
    return baseSize * 0.8;
  }
  return baseSize;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Get file extension from URL or filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if URL is an image
 */
export const isImageUrl = (url: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const extension = getFileExtension(url);
  return imageExtensions.includes(extension);
};

/**
 * Convert rem/em to pixels (assuming 16px base)
 */
export const convertToPixels = (value: string | number, baseSize: number = 16): number => {
  if (typeof value === 'number') return value;

  if (value.endsWith('rem')) {
    return parseFloat(value) * baseSize;
  }
  if (value.endsWith('em')) {
    return parseFloat(value) * baseSize;
  }
  if (value.endsWith('px')) {
    return parseFloat(value);
  }

  return parseFloat(value) || 0;
};

/**
 * Chunk array into smaller arrays
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  return _.chunk(array, size);
};

/**
 * Sort array by nested property
 */
export const sortByProperty = <T>(
  array: T[],
  property: string,
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  return _.orderBy(array, [property], [order]);
};

