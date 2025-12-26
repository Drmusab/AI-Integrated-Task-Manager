/**
 * @fileoverview API key authentication middleware for securing webhook and automation endpoints.
 * Implements multiple extraction methods and constant-time comparison for security.
 * @module middleware/apiKeyAuth
 */
/**
 * Middleware enforcing API key authentication for automation/webhook endpoints.
 * If N8N_API_KEY environment variable is not defined, the middleware is a no-op,
 * allowing the API to be used during development without extra configuration.
 *
 * Supports API key extraction from:
 * - x-api-key header
 * - Authorization: Bearer <token> header
 * - api_key query parameter
 *
 * @function apiKeyAuth
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void|Object} Calls next() if authenticated, or returns 401 JSON response
 * @example
 * app.use('/api/webhooks', apiKeyAuth, webhookRoutes);
 */
declare const _default: (req: any, res: any, next: any) => any;
export = _default;
//# sourceMappingURL=apiKeyAuth.d.ts.map