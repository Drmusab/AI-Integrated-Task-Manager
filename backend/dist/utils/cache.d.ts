/**
 * @fileoverview Simple in-memory cache utility for frequently accessed data.
 * Implements TTL (time-to-live) based caching with automatic cleanup.
 * @module utils/cache
 */
/**
 * Simple in-memory cache with TTL support
 */
declare class Cache {
    constructor(defaultTTL?: number);
    /**
     * Store a value in cache with optional TTL
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     * @param {number} ttl - Time to live in milliseconds (uses default if not specified)
     */
    set(key: any, value: any, ttl?: any): void;
    /**
     * Retrieve a value from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or null if not found or expired
     */
    get(key: any): any;
    /**
     * Check if a key exists in cache and is not expired
     * @param {string} key - Cache key
     * @returns {boolean} True if key exists and is valid
     */
    has(key: any): boolean;
    /**
     * Delete a value from cache
     * @param {string} key - Cache key
     */
    delete(key: any): void;
    /**
     * Clear all cached values
     */
    clear(): void;
    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats(): {
        size: any;
        keys: unknown[];
    };
    /**
     * Get or set cache value with a factory function
     * @param {string} key - Cache key
     * @param {Function} factory - Async function to generate value if not cached
     * @param {number} ttl - Time to live in milliseconds (uses default if not specified)
     * @returns {Promise<*>} Cached or generated value
     */
    getOrSet(key: any, factory: any, ttl?: any): Promise<any>;
}
declare const cache: Cache;
export = cache;
//# sourceMappingURL=cache.d.ts.map