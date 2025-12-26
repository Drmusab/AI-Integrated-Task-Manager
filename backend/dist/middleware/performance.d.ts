/**
 * @fileoverview Performance monitoring middleware and utilities for tracking request timing and database queries.
 * Provides request timing, execution measurement, and slow query detection.
 * @module middleware/performance
 */
/**
 * Database query performance tracking class.
 * Tracks query execution times, identifies slow queries, and provides statistics.
 * Can be enabled/disabled via ENABLE_QUERY_TRACKING environment variable.
 *
 * @class QueryPerformanceTracker
 */
declare class QueryPerformanceTracker {
    /**
     * Creates a QueryPerformanceTracker instance.
     * Tracking is enabled in development or when ENABLE_QUERY_TRACKING=true.
     *
     * @constructor
     */
    constructor();
    /**
     * Records a database query execution for performance analysis.
     * Logs warnings for slow queries (>100ms) and maintains a circular buffer of recent queries.
     *
     * @method track
     * @param {string} query - The SQL query that was executed
     * @param {Array} params - Query parameters used
     * @param {number} duration - Execution time in milliseconds
     * @returns {void}
     * @example
     * queryTracker.track('SELECT * FROM tasks WHERE id = ?', [123], 45);
     */
    track(query: any, params: any, duration: any): void;
    /**
     * Calculates and returns statistical information about tracked queries.
     * Provides average, min, max durations and slow query count.
     *
     * @method getStats
     * @returns {Object} Statistics object with query performance metrics
     * @property {number} count - Total number of tracked queries
     * @property {string} avgDuration - Average query duration with 'ms' suffix
     * @property {string} maxDuration - Maximum query duration with 'ms' suffix
     * @property {string} minDuration - Minimum query duration with 'ms' suffix
     * @property {number} slowQueries - Count of queries exceeding 100ms
     * @example
     * const stats = queryTracker.getStats();
     * console.log(`Average: ${stats.avgDuration}, Slow queries: ${stats.slowQueries}`);
     */
    getStats(): {
        message: string;
        count?: undefined;
        avgDuration?: undefined;
        maxDuration?: undefined;
        minDuration?: undefined;
        slowQueries?: undefined;
    } | {
        count: any;
        avgDuration: string;
        maxDuration: string;
        minDuration: string;
        slowQueries: any;
        message?: undefined;
    };
    /**
     * Clears all tracked query data.
     * Useful for resetting statistics between test runs or monitoring periods.
     *
     * @method reset
     * @returns {void}
     * @example
     * queryTracker.reset(); // Clear all tracked queries
     */
    reset(): void;
}
declare const _default: {
    requestTimer: (req: any, res: any, next: any) => void;
    measureTime: (name: any, fn: any) => Promise<any>;
    queryTracker: QueryPerformanceTracker;
};
export = _default;
//# sourceMappingURL=performance.d.ts.map