/**
 * @fileoverview Input sanitization utilities for security.
 * Provides functions to sanitize and validate user input to prevent XSS and injection attacks.
 * @module utils/sanitizer
 */
/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} input - User input containing potential HTML
 * @returns {string} Sanitized string
 */
declare function sanitizeHTML(input: any): string;
/**
 * Sanitize string for safe SQL-like queries (additional layer beyond parameterized queries)
 * Note: This is a supplementary check. Always use parameterized queries as the primary defense.
 * @param {string} input - User input
 * @returns {string} Sanitized string
 */
declare function sanitizeSQL(input: any): string;
/**
 * Validate and sanitize email addresses
 * @param {string} email - Email address to validate
 * @returns {string|null} Sanitized email or null if invalid
 */
declare function sanitizeEmail(email: any): string;
/**
 * Sanitize URLs to prevent javascript: and data: protocol attacks
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if invalid
 */
declare function sanitizeURL(url: any): string;
/**
 * Sanitize file names to prevent directory traversal attacks
 * @param {string} filename - File name to sanitize
 * @returns {string} Sanitized file name
 */
declare function sanitizeFilename(filename: any): string;
/**
 * Sanitize markdown content to allow safe formatting while preventing XSS
 *
 * IMPORTANT: This is a basic sanitization function. For production use with
 * untrusted user input, strongly recommend using a dedicated library like:
 * - DOMPurify (https://github.com/cure53/DOMPurify)
 * - js-xss (https://github.com/leizongmin/js-xss)
 *
 * This function provides a basic layer of protection but may not catch all edge cases.
 * It should be used in combination with other security measures like Content Security Policy.
 *
 * @param {string} markdown - Markdown content
 * @returns {string} Sanitized markdown
 */
declare function sanitizeMarkdown(markdown: any): string;
/**
 * Sanitize JSON input
 * @param {*} input - Input to sanitize
 * @param {number} maxDepth - Maximum depth of nested objects (default: 10)
 * @returns {*} Sanitized object
 */
declare function sanitizeJSON(input: any, maxDepth?: number): any;
/**
 * Validate and sanitize numeric input
 * @param {*} input - Input to validate
 * @param {Object} options - Validation options {min, max, integer}
 * @returns {number|null} Sanitized number or null if invalid
 */
declare function sanitizeNumber(input: any, options?: {}): any;
/**
 * Remove null bytes from string
 * @param {string} input - Input string
 * @returns {string} String without null bytes
 */
declare function removeNullBytes(input: any): string;
declare const _default: {
    sanitizeHTML: typeof sanitizeHTML;
    sanitizeSQL: typeof sanitizeSQL;
    sanitizeEmail: typeof sanitizeEmail;
    sanitizeURL: typeof sanitizeURL;
    sanitizeFilename: typeof sanitizeFilename;
    sanitizeMarkdown: typeof sanitizeMarkdown;
    sanitizeJSON: typeof sanitizeJSON;
    sanitizeNumber: typeof sanitizeNumber;
    removeNullBytes: typeof removeNullBytes;
};
export = _default;
//# sourceMappingURL=sanitizer.d.ts.map