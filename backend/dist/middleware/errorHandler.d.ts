/**
 * @fileoverview Centralized error handling middleware for the Express application.
 * Provides custom error class, error sanitization, and consistent error responses.
 * @module middleware/errorHandler
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';
/**
 * Custom application error class with additional properties for HTTP status and details.
 */
declare class AppError extends Error {
    statusCode: number;
    details: any;
    isOperational: boolean;
    constructor(message: string, statusCode?: number, details?: any);
}
declare const _default: {
    AppError: typeof AppError;
    errorHandler: (err: any, req: Request, res: Response, _next: NextFunction) => void;
    asyncHandler: (fn: RequestHandler) => RequestHandler;
};
export = _default;
//# sourceMappingURL=errorHandler.d.ts.map