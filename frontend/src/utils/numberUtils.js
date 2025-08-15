/**
 * Utility functions for safe floating point operations
 */

/**
 * Safely parse a float value with controlled precision
 * @param {string|number} value - Value to parse
 * @param {number} precision - Number of decimal places (default: 6)
 * @returns {number} - Parsed float value
 */
export const safeParseFloat = (value, precision = 6) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  try {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return 0;
    }
    // Round to specified precision to avoid floating point errors
    return Math.round(parsed * Math.pow(10, precision)) / Math.pow(10, precision);
  } catch (error) {
    return 0;
  }
};

/**
 * Safely add two numbers with controlled precision
 * @param {number} a - First number
 * @param {number} b - Second number
 * @param {number} precision - Number of decimal places (default: 6)
 * @returns {number} - Sum with controlled precision
 */
export const safeAdd = (a, b, precision = 6) => {
  const safeA = safeParseFloat(a, precision);
  const safeB = safeParseFloat(b, precision);
  const result = safeA + safeB;
  return Math.round(result * Math.pow(10, precision)) / Math.pow(10, precision);
};

/**
 * Safely subtract two numbers with controlled precision
 * @param {number} a - First number
 * @param {number} b - Second number
 * @param {number} precision - Number of decimal places (default: 6)
 * @returns {number} - Difference with controlled precision
 */
export const safeSubtract = (a, b, precision = 6) => {
  const safeA = safeParseFloat(a, precision);
  const safeB = safeParseFloat(b, precision);
  const result = safeA - safeB;
  return Math.round(result * Math.pow(10, precision)) / Math.pow(10, precision);
};

/**
 * Safely multiply two numbers with controlled precision
 * @param {number} a - First number
 * @param {number} b - Second number
 * @param {number} precision - Number of decimal places (default: 6)
 * @returns {number} - Product with controlled precision
 */
export const safeMultiply = (a, b, precision = 6) => {
  const safeA = safeParseFloat(a, precision);
  const safeB = safeParseFloat(b, precision);
  const result = safeA * safeB;
  return Math.round(result * Math.pow(10, precision)) / Math.pow(10, precision);
};

/**
 * Safely divide two numbers with controlled precision
 * @param {number} a - First number
 * @param {number} b - Second number
 * @param {number} precision - Number of decimal places (default: 6)
 * @returns {number} - Quotient with controlled precision
 */
export const safeDivide = (a, b, precision = 6) => {
  const safeA = safeParseFloat(a, precision);
  const safeB = safeParseFloat(b, precision);
  
  if (safeB === 0) {
    return 0;
  }
  
  const result = safeA / safeB;
  return Math.round(result * Math.pow(10, precision)) / Math.pow(10, precision);
};

/**
 * Format a number for display with controlled precision
 * @param {number} value - Value to format
 * @param {number} precision - Number of decimal places to show (default: 3)
 * @returns {string} - Formatted number string
 */
export const formatNumber = (value, precision = 3) => {
  const safeValue = safeParseFloat(value, precision);
  return safeValue.toFixed(precision).replace(/\.?0+$/, '');
};

/**
 * Check if a value is positive
 * @param {string|number} value - Value to check
 * @returns {boolean} - True if positive, false otherwise
 */
export const isPositive = (value) => {
  return safeParseFloat(value) > 0;
};

/**
 * Check if a value is non-negative
 * @param {string|number} value - Value to check
 * @returns {boolean} - True if non-negative, false otherwise
 */
export const isNonNegative = (value) => {
  return safeParseFloat(value) >= 0;
};
