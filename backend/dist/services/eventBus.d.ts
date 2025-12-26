/**
 * @fileoverview Event bus service for real-time event streaming and synchronization across clients.
 * Implements an in-memory event buffer with Server-Sent Events (SSE) support for live updates.
 * @module services/eventBus
 */
import { EventEmitter } from 'events';
declare const _default: {
    emitEvent: (resource: any, action: any, payload: any) => {
        id: string;
        resource: any;
        action: any;
        timestamp: string;
        data: any;
    };
    subscribe: (listener: any) => () => EventEmitter<any>;
    getEventsSince: ({ since, lastEventId, limit }?: {}) => any[];
    toNumericBoolean: (value: any) => 0 | 1;
    resetEvents: () => void;
};
export = _default;
//# sourceMappingURL=eventBus.d.ts.map