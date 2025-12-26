/**
 * @fileoverview Reporting service for generating analytics and sending reports to webhooks.
 * Provides weekly reports, custom date range reports, and productivity analytics.
 * @module services/reporting
 */
declare const _default: {
    generateWeeklyReport: () => Promise<{
        period: {
            start: string;
            end: string;
            days: number;
        };
        summary: {
            tasksCreated: any;
            tasksCompleted: any;
            tasksOverdue: any;
            completionRate: string;
            avgCompletionTimeHours: string;
        };
        tasksByColumn: unknown;
        tasksByPriority: unknown;
        activeBoards: unknown;
    }>;
    generateCustomReport: (startDate: any, endDate: any) => Promise<{
        period: {
            start: string;
            end: string;
            days: number;
        };
        summary: {
            tasksCreated: any;
            tasksCompleted: any;
            completionRate: string;
        };
        tasksByColumn: unknown;
    }>;
    sendReportToN8n: (report: any) => Promise<{
        success: boolean;
        message: string;
        results?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        results: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
        results?: undefined;
    }>;
    generateProductivityAnalytics: (days?: number) => Promise<{
        period: {
            days: number;
            start: string;
            end: string;
        };
        dailyCompletions: unknown;
        userProductivity: unknown;
        velocity: unknown;
    }>;
};
export = _default;
//# sourceMappingURL=reporting.d.ts.map