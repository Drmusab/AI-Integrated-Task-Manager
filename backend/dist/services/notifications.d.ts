/**
 * @fileoverview Notification service for sending alerts to users and external systems.
 * Provides functions for sending task reminders, due date alerts, and routine notifications.
 * Integrates with n8n webhooks for external notification delivery.
 * @module services/notifications
 */
declare const _default: {
    sendNotification: (title: any, message: any, options?: {}) => Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    sendTaskReminder: (task: any) => Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    sendRoutineReminder: (task: any) => Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    sendTaskDueNotification: (task: any, minutesUntilDue: any) => Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
};
export = _default;
//# sourceMappingURL=notifications.d.ts.map