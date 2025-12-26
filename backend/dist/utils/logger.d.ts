/**
 * @fileoverview Logging utility with different log levels and environment-aware filtering.
 * Provides structured logging with timestamps, log levels, and metadata support.
 * Automatically adjusts logging verbosity based on NODE_ENV.
 * @module utils/logger
 */
/**
 * Log metadata object
 */
interface LogMetadata {
    [key: string]: any;
}
/**
 * Logger interface
 */
interface Logger {
    error: (message: string, meta?: LogMetadata) => void;
    warn: (message: string, meta?: LogMetadata) => void;
    info: (message: string, meta?: LogMetadata) => void;
    debug: (message: string, meta?: LogMetadata) => void;
}
/**
 * Logger object with methods for different log levels.
 * All methods respect the shouldLog filter based on environment.
 */
declare const logger: Logger;
export = logger;
//# sourceMappingURL=logger.d.ts.map