/**
 * Username Normalization, Validation & Auto-Generation Utility
 */

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

/**
 * Normalizes a username string:
 * - Removes leading '@' if present
 * - Trims whitespace
 * - Replaces invalid characters with underscores
 * - Converts to lowercase
 * @param {string} username 
 * @returns {string}
 */
export function normalizeUsername(username) {
  if (!username) return '';
  let cleaned = String(username)
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_');
  
  if (cleaned.startsWith('_')) cleaned = cleaned.slice(1);
  if (cleaned.endsWith('_')) cleaned = cleaned.slice(0, -1);
  
  return cleaned.slice(0, 20);
}

/**
 * Validates whether a normalized username satisfies Tivora rules (3-20 chars, lowercase, numbers, _)
 * @param {string} username 
 * @returns {boolean}
 */
export function validateUsername(username) {
  const normalized = normalizeUsername(username);
  return USERNAME_REGEX.test(normalized);
}

/**
 * Auto-generates a base username candidate from display name or email (Facebook style)
 * @param {string} displayName 
 * @param {string} email 
 * @returns {string}
 */
export function buildBaseUsername(displayName, email) {
  let base = '';
  if (displayName) {
    base = normalizeUsername(displayName);
  }
  if ((!base || base.length < 3) && email) {
    const emailPrefix = email.split('@')[0];
    base = normalizeUsername(emailPrefix);
  }
  if (!base || base.length < 3) {
    base = `user_${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return base.slice(0, 16);
}

/**
 * Returns a human-readable validation error message, or null if valid
 * @param {string} username 
 * @returns {string|null}
 */
export function getUsernameError(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    return 'Username is required.';
  }
  if (normalized.length < 3) {
    return 'Username must be at least 3 characters long.';
  }
  if (normalized.length > 20) {
    return 'Username cannot exceed 20 characters.';
  }
  if (!USERNAME_REGEX.test(normalized)) {
    return 'Username can only contain lowercase letters, numbers, and underscores (_). No spaces or special characters.';
  }
  return null;
}
