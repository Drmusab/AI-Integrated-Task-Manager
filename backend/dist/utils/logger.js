"use strict";
/**
 * @fileoverview Logging utility with different log levels and environment-aware filtering.
 * Provides structured logging with timestamps, log levels, and metadata support.
 * Automatically adjusts logging verbosity based on NODE_ENV.
 * @module utils/logger
 */
/**
 * Available log levels for the application.
 */
const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};
/**
 * Determines whether a log message should be output based on environment and log level.
 * In test environment: logs are suppressed unless ENABLE_TEST_LOGGING is set.
 * In production environment: only ERROR and WARN levels are logged.
 * In development environment: all log levels are logged.
 */
const shouldLog = (level) => {
    const env = process.env.NODE_ENV;
    // Don't log in test environment unless explicitly enabled
    if (env === 'test' && !process.env.ENABLE_TEST_LOGGING) {
        return false;
    }
    // In production, only log ERROR and WARN
    if (env === 'production') {
        return level === LOG_LEVELS.ERROR || level === LOG_LEVELS.WARN;
    }
    // In development, log everything
    return true;
};
/**
 * Formats a log message with timestamp, level, message, and optional metadata.
 */
const formatMessage = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level}] ${message} ${metaString}`;
};
/**
 * Logger object with methods for different log levels.
 * All methods respect the shouldLog filter based on environment.
 */
const logger = {
    /**
     * Logs an error message with optional metadata.
     * Always logged in production and development (but not in tests unless enabled).
     */
    error: (message, meta = {}) => {
        if (shouldLog(LOG_LEVELS.ERROR)) {
            console.error(formatMessage(LOG_LEVELS.ERROR, message, meta));
        }
    },
    /**
     * Logs a warning message with optional metadata.
     * Logged in production and development (but not in tests unless enabled).
     */
    warn: (message, meta = {}) => {
        if (shouldLog(LOG_LEVELS.WARN)) {
            console.warn(formatMessage(LOG_LEVELS.WARN, message, meta));
        }
    },
    /**
     * Logs an informational message with optional metadata.
     * Only logged in development (suppressed in production and tests).
     */
    info: (message, meta = {}) => {
        if (shouldLog(LOG_LEVELS.INFO)) {
            console.log(formatMessage(LOG_LEVELS.INFO, message, meta));
        }
    },
    /**
     * Logs a debug message with optional metadata.
     * Only logged in development (suppressed in production and tests).
     * Use for detailed diagnostic information.
     */
    debug: (message, meta = {}) => {
        if (shouldLog(LOG_LEVELS.DEBUG)) {
            console.log(formatMessage(LOG_LEVELS.DEBUG, message, meta));
        }
    }
};
module.exports = logger;
//# sourceMappingURL=logger.js.map