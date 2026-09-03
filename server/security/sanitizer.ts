import path from 'path';

/**
 * Sanitizes a string input by stripping dangerous HTML tags, null bytes,
 * and dangerous protocols to prevent Stored & Reflected Cross-Site Scripting (XSS).
 */
export function sanitizeString(input: unknown, maxLength: number = 500): string {
  if (input === null || input === undefined) return '';
  let str = String(input);

  // Strip null bytes
  str = str.replace(/\0/g, '');

  // Strip dangerous HTML/script tags and event handlers
  str = str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '')
    .replace(/javascript:\s*/gi, '')
    .replace(/vbscript:\s*/gi, '')
    .replace(/data:\s*text\/html/gi, '');

  // Trim and cap length
  return str.trim().slice(0, maxLength);
}

/**
 * Deep sanitizes all string fields within an object or array recursively.
 */
export function sanitizeObject<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeString(input, 2000) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeObject(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      // Don't sanitize password fields as they might contain special characters
      if (key.toLowerCase().includes('password')) {
        result[key] = value;
      } else {
        result[key] = sanitizeObject(value);
      }
    }
    return result as T;
  }

  return input;
}

/**
 * Validates that a filename contains only safe characters and no directory traversal tokens.
 * Matches: alphanumeric, underscores, hyphens, and a .json extension.
 */
export function isSafeBackupFilename(filename: string): boolean {
  if (!filename || typeof filename !== 'string') return false;
  // Must not contain path separators, dots other than .json, or traversal patterns
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    return false;
  }
  return /^[a-zA-Z0-9_-]+\.json$/.test(filename);
}

/**
 * Ensures that a resolved file path is strictly within the allowed directory.
 */
export function isPathInsideDirectory(baseDir: string, targetPath: string): boolean {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(baseDir, targetPath);
  return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
}

/**
 * Validates and converts an amount to a safe, positive, finite float.
 */
export function parseSafeAmount(val: unknown, defaultValue: number = 0, maxVal: number = 100_000_000): number {
  if (val === undefined || val === null || val === '') return defaultValue;
  const num = Number(val);
  if (!Number.isFinite(num) || Number.isNaN(num)) return defaultValue;
  if (num < 0) return 0;
  return Math.min(num, maxVal);
}

/**
 * Validates standard ISO / YYYY-MM-DD date strings.
 */
export function isValidDateString(dateStr: unknown): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return false;
  const timestamp = Date.parse(dateStr);
  return !Number.isNaN(timestamp);
}

/**
 * Validates basic email format.
 */
export function isValidEmail(email: unknown): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 150;
}

/**
 * Validates username format (alphanumeric, underscores, hyphens, 3-30 chars).
 */
export function isValidUsername(username: unknown): boolean {
  if (!username || typeof username !== 'string') return false;
  return /^[a-zA-Z0-9_.-]{3,30}$/.test(username.trim());
}

/**
 * Password strength validator.
 * Requirements: minimum 6 characters for user passwords.
 */
export function isStrongPassword(password: unknown): { valid: boolean; message?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required.' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password cannot exceed 128 characters.' };
  }
  return { valid: true };
}
