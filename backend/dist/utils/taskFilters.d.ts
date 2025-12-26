/**
 * @fileoverview Advanced search and filter utilities for tasks.
 * Provides flexible filtering, sorting, and search capabilities.
 * @module utils/taskFilters
 */
/**
 * Build SQL WHERE clause from filter options
 * @param {Object} filters - Filter options
 * @returns {Object} Object with SQL where clause and parameters
 */
declare function buildWhereClause(filters: any): {
    whereClause: string;
    params: any[];
};
/**
 * Build ORDER BY clause from sort options
 * @param {Object} sort - Sort options
 * @returns {string} SQL ORDER BY clause
 */
declare function buildOrderByClause(sort?: {}): string;
/**
 * Search and filter tasks with advanced options
 * @param {Object} options - Filter and search options
 * @returns {Promise<Array>} Filtered tasks
 */
declare function searchTasks(options?: {}): Promise<unknown>;
/**
 * Get count of tasks matching filters
 * @param {Object} filters - Filter options
 * @returns {Promise<number>} Count of matching tasks
 */
declare function countTasks(filters?: {}): Promise<any>;
declare const _default: {
    searchTasks: typeof searchTasks;
    countTasks: typeof countTasks;
    buildWhereClause: typeof buildWhereClause;
    buildOrderByClause: typeof buildOrderByClause;
};
export = _default;
//# sourceMappingURL=taskFilters.d.ts.map