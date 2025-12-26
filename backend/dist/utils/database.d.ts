/**
 * @fileoverview Database utility module for SQLite database management.
 * Provides promise-based wrappers for SQLite operations and handles database initialization,
 * schema creation, and default data seeding for the Kanban task management application.
 * @module utils/database
 */
import sqlite3Module = require('sqlite3');
declare const _default: {
    db: sqlite3Module.Database;
    initDatabase: () => Promise<unknown>;
    runAsync: (sql: any, params?: any[]) => Promise<unknown>;
    getAsync: (sql: any, params?: any[]) => Promise<unknown>;
    allAsync: (sql: any, params?: any[]) => Promise<unknown>;
    clearDatabase: () => Promise<void>;
};
export = _default;
//# sourceMappingURL=database.d.ts.map