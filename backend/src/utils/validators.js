export function isPlainString(val, minLen = 1, maxLen = 500) {
  return typeof val === 'string' && val.trim().length >= minLen && val.trim().length <= maxLen;
}

export function sanitizeString(val, maxLen = 1000) {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 160;
}

export function isSafeMediaUrl(url, allowEmpty = true) {
  if (url === undefined || url === null || url === '') return allowEmpty;
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) {
    return !trimmed.startsWith('//');
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function hasNoSqlOperators(obj) {
  if (!obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) return true;
    if (typeof obj[key] === 'object' && hasNoSqlOperators(obj[key])) return true;
  }
  return false;
}

export function sanitizeArrayOfStrings(arr, maxItems = 25, maxLen = 80) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim().slice(0, maxLen))
    .slice(0, maxItems);
}
