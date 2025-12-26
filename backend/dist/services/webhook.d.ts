/**
 * @fileoverview Webhook service for triggering external HTTP endpoints (primarily n8n).
 * Handles webhook execution with timeout handling, authentication, and error handling.
 * @module services/webhook
 */
declare const _default: {
    triggerWebhook: (webhookId: any, payload: any) => Promise<{
        success: boolean;
        status: any;
        response: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        status?: undefined;
        response?: undefined;
    }>;
};
export = _default;
//# sourceMappingURL=webhook.d.ts.map