/**
 * @fileoverview Chronos Time Intelligence Service
 * Provides business logic for time blocking, analytics, AI optimization, and smart scheduling
 * @module services/chronos
 */
/**
 * Check for time block conflicts
 * @param {number} userId - User ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @param {number} excludeBlockId - Block ID to exclude from conflict check (for updates)
 * @returns {Promise<Array>} Array of conflicting blocks
 */
declare function checkConflicts(userId: any, date: any, startTime: any, endTime: any, excludeBlockId?: any): Promise<unknown>;
/**
 * Calculate optimal time for a task based on historical data
 * @param {number} userId - User ID
 * @param {string} category - Task category
 * @param {string} energyRequired - Energy level required
 * @returns {Promise<Object>} Suggested time slot
 */
declare function suggestOptimalTime(userId: any, category: any, energyRequired?: string): Promise<any>;
/**
 * Calculate buffer time based on category and user settings
 * @param {number} userId - User ID
 * @param {string} category - Task category
 * @returns {Promise<Object>} Buffer time in minutes
 */
declare function calculateBufferTime(userId: any, category: any): Promise<{
    before: number;
    after: number;
}>;
/**
 * Find available time slots for a given date
 * @param {number} userId - User ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {number} duration - Required duration in minutes
 * @returns {Promise<Array>} Available time slots
 */
declare function findAvailableSlots(userId: any, date: any, duration: any): Promise<any[]>;
/**
 * Auto-schedule a task into available time slots
 * @param {number} userId - User ID
 * @param {Object} taskDetails - Task details including duration, category, priority
 * @param {string} preferredDate - Preferred date (optional)
 * @returns {Promise<Object>} Suggested time block
 */
declare function autoScheduleTask(userId: any, taskDetails: any, preferredDate?: any): Promise<{
    date: any;
    start_time: any;
    end_time: any;
    title: any;
    category: any;
    energy_required: any;
    suggested_reason: any;
}>;
/**
 * Generate daily time intelligence insights
 * @param {number} userId - User ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Object>} Daily insights
 */
declare function generateDailyInsights(userId: any, date: any): Promise<{
    date: any;
    plannedBlocks: any;
    completedSessions: any;
    totalPlannedMinutes: any;
    totalActualMinutes: any;
    completionRate: number;
    avgFocus: string;
    avgProductivity: string;
    timeVariance: number;
    insights: any[];
}>;
/**
 * Utility: Calculate minutes difference between two time strings
 */
declare function getMinutesDifference(startTime: any, endTime: any): number;
/**
 * Utility: Add minutes to a time string
 */
declare function addMinutes(timeStr: any, minutes: any): string;
/**
 * Utility: Add days to a date string
 */
declare function addDays(dateStr: any, days: any): string;
declare const _default: {
    checkConflicts: typeof checkConflicts;
    suggestOptimalTime: typeof suggestOptimalTime;
    calculateBufferTime: typeof calculateBufferTime;
    findAvailableSlots: typeof findAvailableSlots;
    autoScheduleTask: typeof autoScheduleTask;
    generateDailyInsights: typeof generateDailyInsights;
    getMinutesDifference: typeof getMinutesDifference;
    addMinutes: typeof addMinutes;
    addDays: typeof addDays;
};
export = _default;
//# sourceMappingURL=chronos.d.ts.map