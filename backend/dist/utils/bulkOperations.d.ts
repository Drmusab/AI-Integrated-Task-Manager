/**
 * @fileoverview Bulk operations utility for tasks.
 * Provides efficient batch operations for multiple tasks.
 * @module utils/bulkOperations
 */
/**
 * Update multiple tasks at once
 * @param {Array<number>} taskIds - Array of task IDs to update
 * @param {Object} updates - Fields to update
 * @param {number} userId - ID of user performing the update
 * @returns {Promise<Object>} Result object with count of updated tasks
 */
declare function bulkUpdateTasks(taskIds: any, updates: any, userId?: any): Promise<{
    updated: any;
    taskIds: any;
    errors: any[];
} | {
    updated: number;
    errors: any[];
    taskIds?: undefined;
}>;
/**
 * Delete multiple tasks at once
 * @param {Array<number>} taskIds - Array of task IDs to delete
 * @param {number} userId - ID of user performing the deletion
 * @returns {Promise<Object>} Result object with count of deleted tasks
 */
declare function bulkDeleteTasks(taskIds: any, userId?: any): Promise<{
    deleted: any;
    taskIds: any;
    errors: any[];
} | {
    deleted: number;
    errors: any[];
    taskIds?: undefined;
}>;
/**
 * Move multiple tasks to a different column
 * @param {Array<number>} taskIds - Array of task IDs to move
 * @param {number} targetColumnId - ID of target column
 * @param {number} userId - ID of user performing the move
 * @returns {Promise<Object>} Result object
 */
declare function bulkMoveTasks(taskIds: any, targetColumnId: any, userId?: any): Promise<{
    updated: any;
    taskIds: any;
    errors: any[];
} | {
    updated: number;
    errors: any[];
    taskIds?: undefined;
}>;
/**
 * Assign multiple tasks to a user
 * @param {Array<number>} taskIds - Array of task IDs
 * @param {number} assigneeId - ID of user to assign to
 * @param {number} userId - ID of user performing the assignment
 * @returns {Promise<Object>} Result object
 */
declare function bulkAssignTasks(taskIds: any, assigneeId: any, userId?: any): Promise<{
    updated: any;
    taskIds: any;
    errors: any[];
} | {
    updated: number;
    errors: any[];
    taskIds?: undefined;
}>;
/**
 * Update priority for multiple tasks
 * @param {Array<number>} taskIds - Array of task IDs
 * @param {string} priority - Priority level (low, medium, high, critical)
 * @param {number} userId - ID of user performing the update
 * @returns {Promise<Object>} Result object
 */
declare function bulkSetPriority(taskIds: any, priority: any, userId?: any): Promise<{
    updated: any;
    taskIds: any;
    errors: any[];
} | {
    updated: number;
    errors: any[];
    taskIds?: undefined;
}>;
/**
 * Add tags to multiple tasks
 * @param {Array<number>} taskIds - Array of task IDs
 * @param {Array<number>} tagIds - Array of tag IDs to add
 * @returns {Promise<Object>} Result object
 */
declare function bulkAddTags(taskIds: any, tagIds: any): Promise<{
    added: number;
    errors: any[];
}>;
/**
 * Remove tags from multiple tasks
 * @param {Array<number>} taskIds - Array of task IDs
 * @param {Array<number>} tagIds - Array of tag IDs to remove
 * @returns {Promise<Object>} Result object
 */
declare function bulkRemoveTags(taskIds: any, tagIds: any): Promise<{
    removed: any;
    errors: any[];
} | {
    removed: number;
    errors: any[];
}>;
/**
 * Duplicate multiple tasks
 * @param {Array<number>} taskIds - Array of task IDs to duplicate
 * @param {number} userId - ID of user performing the duplication
 * @returns {Promise<Object>} Result object with new task IDs
 */
declare function bulkDuplicateTasks(taskIds: any, userId?: any): Promise<{
    created: any[];
    errors: any[];
}>;
declare const _default: {
    bulkUpdateTasks: typeof bulkUpdateTasks;
    bulkDeleteTasks: typeof bulkDeleteTasks;
    bulkMoveTasks: typeof bulkMoveTasks;
    bulkAssignTasks: typeof bulkAssignTasks;
    bulkSetPriority: typeof bulkSetPriority;
    bulkAddTags: typeof bulkAddTags;
    bulkRemoveTags: typeof bulkRemoveTags;
    bulkDuplicateTasks: typeof bulkDuplicateTasks;
};
export = _default;
//# sourceMappingURL=bulkOperations.d.ts.map