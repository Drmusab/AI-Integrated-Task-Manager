/**
 * @fileoverview Automation service for triggering rule-based actions.
 * Handles event-driven automation rules with webhook, notification, and task actions.
 * @module services/automation
 */
declare const _default: {
    triggerAutomation: (eventType: any, eventData: any) => Promise<void>;
    checkTriggerConditions: (triggerConfig: any, eventData: any) => boolean;
    executeAutomationAction: (actionType: any, actionConfig: any, eventData: any) => Promise<{
        success: boolean;
        status: any;
        response: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        status?: undefined;
        response?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        taskId: any;
    }>;
};
export = _default;
//# sourceMappingURL=automation.d.ts.map