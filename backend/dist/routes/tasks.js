"use strict";
/**
 * @fileoverview Task management API routes.
 * Provides CRUD operations for tasks with validation, history tracking,
 * automation triggers, and real-time event emission.
 * @module routes/tasks
 */
const express = require("express");
const router = express.Router();
const express_validator_1 = require("express-validator");
const database_1 = require("../utils/database");
const history_1 = require("../utils/history");
const automation_1 = require("../services/automation");
const apiKeyAuth = require("../middleware/apiKeyAuth");
const eventBus_1 = require("../services/eventBus");
const taskFilters_1 = require("../utils/taskFilters");
/**
 * Validation rules for creating a new task.
 * @constant {Array}
 */
const createTaskValidations = [
    (0, express_validator_1.body)('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 500 }).withMessage('Title must be less than 500 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 10000 }).withMessage('Description must be less than 10000 characters'),
    (0, express_validator_1.body)('column_id').custom((value, { req }) => {
        const incoming = value ?? req.body.columnId;
        if (incoming === undefined || incoming === null || incoming === '') {
            throw new Error('Column ID must be an integer');
        }
        const parsed = Number(incoming);
        if (!Number.isInteger(parsed) || parsed < 1) {
            throw new Error('Column ID must be a positive integer');
        }
        req.body.column_id = parsed;
        return true;
    }),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical']).withMessage('Priority must be low, medium, high, or critical'),
    (0, express_validator_1.body)('due_date')
        .optional({ nullable: true })
        .isISO8601().withMessage('Due date must be a valid ISO 8601 date'),
];
/**
 * Validation rules for updating a task.
 * @constant {Array}
 */
const updateTaskValidations = [
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .notEmpty().withMessage('Title cannot be empty')
        .isLength({ max: 500 }).withMessage('Title must be less than 500 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isLength({ max: 10000 }).withMessage('Description must be less than 10000 characters'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical']).withMessage('Priority must be low, medium, high, or critical'),
    (0, express_validator_1.body)('due_date')
        .optional({ nullable: true })
        .isISO8601().withMessage('Due date must be a valid ISO 8601 date'),
];
/**
 * Validation rules for webhook task updates.
 * @constant {Array}
 */
const webhookUpdateValidations = [
    (0, express_validator_1.body)('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
    ...updateTaskValidations,
];
/**
 * Validation rules for webhook task deletion.
 * @constant {Array}
 */
const webhookDeleteValidations = [
    (0, express_validator_1.body)('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
];
/**
 * Validation rules for query parameters when listing tasks.
 * @constant {Array}
 */
const listTasksValidations = [
    (0, express_validator_1.query)('boardId').optional().isInt({ min: 1 }).withMessage('Board ID must be a positive integer'),
    (0, express_validator_1.query)('columnId').optional().isInt({ min: 1 }).withMessage('Column ID must be a positive integer'),
    (0, express_validator_1.query)('swimlaneId').optional().isInt({ min: 1 }).withMessage('Swimlane ID must be a positive integer'),
    (0, express_validator_1.query)('assignedTo').optional().isInt({ min: 1 }).withMessage('Assigned To must be a positive integer'),
    (0, express_validator_1.query)('dueBefore').optional().isISO8601().withMessage('dueBefore must be a valid ISO 8601 date'),
    (0, express_validator_1.query)('dueAfter').optional().isISO8601().withMessage('dueAfter must be a valid ISO 8601 date'),
    (0, express_validator_1.query)('tags').optional().custom((value) => {
        const tagIds = value.split(',').map(id => Number(id));
        if (tagIds.length === 0) {
            throw new Error('Tags must be a comma-separated list of integers');
        }
        if (tagIds.some(id => !Number.isInteger(id) || id < 1)) {
            throw new Error('Tag IDs must be positive integers');
        }
        return true;
    })
];
/**
 * GET /api/tasks
 * Retrieves all tasks with optional filtering by board, column, swimlane, assignee, and due date.
 * @route GET /api/tasks
 * @query {number} [boardId] - Filter by board ID
 * @query {number} [columnId] - Filter by column ID
 * @query {number} [swimlaneId] - Filter by swimlane ID
 * @query {number} [assignedTo] - Filter by assigned user ID
 * @query {string} [dueBefore] - Filter tasks due before this ISO 8601 date
 * @query {string} [dueAfter] - Filter tasks due after this ISO 8601 date
 * @returns {Array<Object>} Array of task objects with tags
 */
router.get('/', listTasksValidations, (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { boardId, columnId, swimlaneId, assignedTo, tags, dueBefore, dueAfter } = req.query;
    let query = `
    SELECT t.*, c.name as column_name, s.name as swimlane_name, 
           u1.username as created_by_name, u2.username as assigned_to_name
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    LEFT JOIN swimlanes s ON t.swimlane_id = s.id
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.assigned_to = u2.id
    WHERE 1=1
  `;
    const params = [];
    if (boardId) {
        query += ' AND c.board_id = ?';
        params.push(parseInt(boardId, 10));
    }
    if (columnId) {
        query += ' AND t.column_id = ?';
        params.push(parseInt(columnId, 10));
    }
    if (swimlaneId) {
        query += ' AND t.swimlane_id = ?';
        params.push(parseInt(swimlaneId, 10));
    }
    if (assignedTo) {
        query += ' AND t.assigned_to = ?';
        params.push(parseInt(assignedTo, 10));
    }
    if (dueBefore) {
        query += ' AND t.due_date <= ?';
        params.push(dueBefore);
    }
    if (dueAfter) {
        query += ' AND t.due_date >= ?';
        params.push(dueAfter);
    }
    if (tags) {
        const tagIds = tags.split(',').map(id => Number(id));
        const placeholders = tagIds.map(() => '?').join(',');
        query += ` AND t.id IN (
      SELECT task_id FROM task_tags WHERE tag_id IN (${placeholders})
    )`;
        params.push(...tagIds);
    }
    query += ' ORDER BY t.position ASC';
    database_1.db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!rows.length) {
            return res.json([]);
        }
        const taskIds = rows.map(task => task.id);
        const placeholders = taskIds.map(() => '?').join(',');
        database_1.db.all(`SELECT tt.task_id, tg.*
       FROM task_tags tt
       JOIN tags tg ON tg.id = tt.tag_id
       WHERE tt.task_id IN (${placeholders})`, taskIds, (tagErr, tagRows = []) => {
            if (tagErr) {
                // In case of tag lookup issues, still return tasks without tags
                return res.json(rows.map(task => ({ ...task, tags: [] })));
            }
            const tagsByTask = tagRows.reduce((acc, tagRow) => {
                if (!acc[tagRow.task_id]) {
                    acc[tagRow.task_id] = [];
                }
                acc[tagRow.task_id].push(tagRow);
                return acc;
            }, {});
            const tasksWithTags = rows.map(task => ({
                ...task,
                tags: tagsByTask[task.id] || []
            }));
            res.json(tasksWithTags);
        });
    });
});
/**
 * Advanced task search endpoint with filtering, sorting, and pagination
 * @route GET /api/tasks/search/advanced
 */
router.get('/search/advanced', async (req, res) => {
    try {
        const filters = {
            search: req.query.search,
            board_id: req.query.board_id ? parseInt(req.query.board_id) : undefined,
            column_id: req.query.column_id ? parseInt(req.query.column_id) : undefined,
            assigned_to: req.query.assigned_to ? parseInt(req.query.assigned_to) : undefined,
            overdue: req.query.overdue,
            due_today: req.query.due_today,
            due_this_week: req.query.due_this_week,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
            offset: req.query.offset ? parseInt(req.query.offset) : 0
        };
        if (req.query.priority) {
            filters.priority = req.query.priority.includes(',')
                ? req.query.priority.split(',')
                : req.query.priority;
        }
        if (req.query.tags) {
            filters.tags = req.query.tags.split(',').map(id => parseInt(id));
        }
        filters.sort = {
            by: req.query.sort_by || 'position',
            direction: req.query.sort_direction || 'ASC'
        };
        const tasks = await (0, taskFilters_1.searchTasks)(filters);
        const total = await (0, taskFilters_1.countTasks)(filters);
        res.json({
            tasks,
            total,
            limit: filters.limit,
            offset: filters.offset,
            has_more: (filters.offset + filters.limit) < total
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Get a specific task
router.get('/:id', [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const taskId = parseInt(id, 10);
    database_1.db.get(`SELECT t.*, c.name as column_name, s.name as swimlane_name, 
            u1.username as created_by_name, u2.username as assigned_to_name
     FROM tasks t
     JOIN columns c ON t.column_id = c.id
     LEFT JOIN swimlanes s ON t.swimlane_id = s.id
     LEFT JOIN users u1 ON t.created_by = u1.id
     LEFT JOIN users u2 ON t.assigned_to = u2.id
     WHERE t.id = ?`, [taskId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Task not found' });
        }
        // Get tags for the task
        database_1.db.all('SELECT tg.* FROM tags tg JOIN task_tags tt ON tg.id = tt.tag_id WHERE tt.task_id = ?', [id], (err, tagRows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            // Get subtasks for the task
            database_1.db.all('SELECT * FROM subtasks WHERE task_id = ? ORDER BY position ASC', [id], (err, subtaskRows) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                // Get attachments for the task
                database_1.db.all('SELECT * FROM attachments WHERE task_id = ?', [id], (err, attachmentRows) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    // Get task history
                    database_1.db.all(`SELECT th.*, u.username as user_name 
                     FROM task_history th 
                     LEFT JOIN users u ON th.user_id = u.id 
                     WHERE th.task_id = ? 
                     ORDER BY th.created_at DESC`, [id], (err, historyRows) => {
                        if (err) {
                            return res.status(500).json({ error: err.message });
                        }
                        res.json({
                            ...row,
                            tags: tagRows,
                            subtasks: subtaskRows,
                            attachments: attachmentRows,
                            history: historyRows
                        });
                    });
                });
            });
        });
    });
});
// Create a new task
router.post('/', createTaskValidations, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const result = await createTaskRecord(req.body);
        res.status(201).json({ ...result, message: 'Task created successfully' });
    }
    catch (error) {
        handleTaskError(res, error);
    }
});
// API-key protected endpoint for external automation (e.g. n8n) to create tasks
router.post('/create', apiKeyAuth, createTaskValidations, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const result = await createTaskRecord(req.body);
        res.status(201).json({ ...result, message: 'Task created successfully', source: 'automation' });
    }
    catch (error) {
        handleTaskError(res, error);
    }
});
// Update a task
router.put('/:id', updateTaskValidations, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const result = await updateTaskRecord(req.params.id, req.body);
        res.json(result);
    }
    catch (error) {
        handleTaskError(res, error);
    }
});
// API-key protected endpoint for external automation to update tasks
router.post('/update', apiKeyAuth, webhookUpdateValidations, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const result = await updateTaskRecord(req.body.id, req.body);
        res.json({ ...result, source: 'automation' });
    }
    catch (error) {
        handleTaskError(res, error);
    }
});
// Delete a task
router.delete('/:id', async (req, res) => {
    try {
        const result = await deleteTaskRecord(req.params.id, req.body);
        res.json(result);
    }
    catch (error) {
        handleTaskError(res, error);
    }
});
// API-key protected endpoint for external automation to delete tasks
router.post('/delete', apiKeyAuth, webhookDeleteValidations, async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const result = await deleteTaskRecord(req.body.id, req.body);
        res.json({ ...result, source: 'automation' });
    }
    catch (error) {
        handleTaskError(res, error);
    }
});
// Add a subtask to a task
router.post('/:id/subtasks', [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Subtask title is required'),
], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { title, completed = 0 } = req.body;
    // Get the next position for the subtask
    database_1.db.get('SELECT MAX(position) as maxPosition FROM subtasks WHERE task_id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const position = (row.maxPosition || 0) + 1;
        database_1.db.run('INSERT INTO subtasks (task_id, title, completed, position) VALUES (?, ?, ?, ?)', [id, title, completed, position], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, message: 'Subtask created successfully' });
        });
    });
});
// Update a subtask
router.put('/:taskId/subtasks/:subtaskId', [
    (0, express_validator_1.body)('title').optional().notEmpty().withMessage('Subtask title cannot be empty'),
], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { taskId, subtaskId } = req.params;
    const { title, completed, position } = req.body;
    // Build update query dynamically
    const updates = [];
    const values = [];
    if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
    }
    if (completed !== undefined) {
        updates.push('completed = ?');
        values.push(completed);
    }
    if (position !== undefined) {
        updates.push('position = ?');
        values.push(position);
    }
    if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(subtaskId, taskId);
    database_1.db.run(`UPDATE subtasks SET ${updates.join(', ')} WHERE id = ? AND task_id = ?`, values, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Subtask not found' });
        }
        res.json({ message: 'Subtask updated successfully' });
    });
});
// Delete a subtask
router.delete('/:taskId/subtasks/:subtaskId', (req, res) => {
    const { taskId, subtaskId } = req.params;
    database_1.db.run('DELETE FROM subtasks WHERE id = ? AND task_id = ?', [subtaskId, taskId], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Subtask not found' });
        }
        res.json({ message: 'Subtask deleted successfully' });
    });
});
// Add tags to a task
router.post('/:id/tags', (req, res) => {
    const { id } = req.params;
    const { tagIds } = req.body;
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
        return res.status(400).json({ error: 'Tag IDs array is required' });
    }
    const tagPromises = tagIds.map(tagId => {
        return new Promise((resolve, reject) => {
            database_1.db.run('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)', [id, tagId], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    });
    Promise.all(tagPromises)
        .then(() => {
        res.json({ message: 'Tags added to task successfully' });
    })
        .catch(err => {
        res.status(500).json({ error: err.message });
    });
});
// Remove tags from a task
router.delete('/:id/tags', (req, res) => {
    const { id } = req.params;
    const { tagIds } = req.body;
    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
        return res.status(400).json({ error: 'Tag IDs array is required' });
    }
    const placeholders = tagIds.map(() => '?').join(',');
    database_1.db.run(`DELETE FROM task_tags WHERE task_id = ? AND tag_id IN (${placeholders})`, [id, ...tagIds], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Tags removed from task successfully' });
    });
});
// Bulk Operations
const bulkOps = require("../utils/bulkOperations");
/**
 * Bulk update tasks
 */
router.post('/bulk/update', async (req, res) => {
    const { taskIds, updates, userId } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ error: 'taskIds array is required' });
    }
    if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'updates object is required' });
    }
    try {
        const result = await bulkOps.bulkUpdateTasks(taskIds, updates, userId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Bulk delete tasks
 */
router.post('/bulk/delete', async (req, res) => {
    const { taskIds, userId } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ error: 'taskIds array is required' });
    }
    try {
        const result = await bulkOps.bulkDeleteTasks(taskIds, userId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Bulk move tasks to column
 */
router.post('/bulk/move', async (req, res) => {
    const { taskIds, columnId, userId } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ error: 'taskIds array is required' });
    }
    if (!columnId) {
        return res.status(400).json({ error: 'columnId is required' });
    }
    try {
        const result = await bulkOps.bulkMoveTasks(taskIds, columnId, userId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Bulk duplicate tasks
 */
router.post('/bulk/duplicate', async (req, res) => {
    const { taskIds, userId } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ error: 'taskIds array is required' });
    }
    try {
        const result = await bulkOps.bulkDuplicateTasks(taskIds, userId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
function normalizeOptionalInt(value, { treatUndefinedAsNull = false } = {}) {
    if (value === undefined) {
        return treatUndefinedAsNull ? null : undefined;
    }
    if (value === null || value === '') {
        return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}
async function createTaskRecord(data) {
    const title = data.title;
    const columnId = Number(data.column_id ?? data.columnId);
    const swimlaneId = normalizeOptionalInt(data.swimlane_id ?? data.swimlaneId, { treatUndefinedAsNull: true });
    const description = data.description ?? '';
    const priority = data.priority ?? 'medium';
    const dueDate = data.due_date ?? data.dueDate ?? null;
    const recurringRule = data.recurring_rule ?? data.recurringRule ?? null;
    const pinned = data.pinned ?? 0;
    const createdBy = normalizeOptionalInt(data.created_by ?? data.createdBy, { treatUndefinedAsNull: true });
    const assignedTo = normalizeOptionalInt(data.assigned_to ?? data.assignedTo, { treatUndefinedAsNull: true });
    const tags = Array.isArray(data.tags)
        ? data.tags
        : Array.isArray(data.tagIds)
            ? data.tagIds
            : [];
    const tagIds = tags
        .map(tag => {
        if (tag && typeof tag === 'object') {
            return tag.id ?? tag.tag_id ?? tag.value;
        }
        return tag;
    })
        .filter(tag => tag !== undefined && tag !== null)
        .map(tag => normalizeOptionalInt(tag, { treatUndefinedAsNull: true }))
        .filter(tag => tag !== null);
    return new Promise((resolve, reject) => {
        database_1.db.get('SELECT MAX(position) as maxPosition FROM tasks WHERE column_id = ? AND (swimlane_id = ? OR (swimlane_id IS NULL AND ? IS NULL))', [columnId, swimlaneId, swimlaneId], (err, row) => {
            if (err) {
                return reject({ status: 500, message: err.message });
            }
            const position = (row?.maxPosition || 0) + 1;
            database_1.db.run(`INSERT INTO tasks (title, description, column_id, swimlane_id, position, priority, due_date, recurring_rule, pinned, created_by, assigned_to)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                title,
                description,
                columnId,
                swimlaneId,
                position,
                priority,
                dueDate,
                recurringRule,
                pinned,
                createdBy,
                assignedTo,
            ], function (insertErr) {
                if (insertErr) {
                    return reject({ status: 500, message: insertErr.message });
                }
                const taskId = this.lastID;
                (0, history_1.recordTaskHistory)(taskId, 'created', null, null, createdBy);
                const finalize = () => {
                    database_1.db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (fetchErr, taskRow) => {
                        if (fetchErr) {
                            return reject({ status: 500, message: fetchErr.message });
                        }
                        (0, eventBus_1.emitEvent)('task', 'created', {
                            task: taskRow,
                            tags: tagIds,
                        });
                        (0, automation_1.triggerAutomation)('task_created', {
                            taskId,
                            columnId,
                            priority,
                            assignedTo,
                        });
                        resolve({ id: taskId, task: taskRow });
                    });
                };
                if (tagIds.length === 0) {
                    finalize();
                    return;
                }
                const tagPromises = tagIds.map(tagId => new Promise((tagResolve, tagReject) => {
                    database_1.db.run('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)', [taskId, tagId], (tagErr) => {
                        if (tagErr) {
                            tagReject(tagErr);
                        }
                        else {
                            tagResolve();
                        }
                    });
                }));
                Promise.all(tagPromises)
                    .then(finalize)
                    .catch(tagErr => reject({ status: 500, message: tagErr.message }));
            });
        });
    });
}
async function updateTaskRecord(id, data) {
    const title = data.title;
    const description = data.description;
    const columnId = normalizeOptionalInt(data.column_id ?? data.columnId);
    const swimlaneId = normalizeOptionalInt(data.swimlane_id ?? data.swimlaneId);
    const position = normalizeOptionalInt(data.position);
    const priority = data.priority;
    const dueDate = data.due_date ?? data.dueDate;
    const recurringRule = data.recurring_rule ?? data.recurringRule;
    const pinned = data.pinned;
    const assignedTo = normalizeOptionalInt(data.assigned_to ?? data.assignedTo);
    const updatedBy = normalizeOptionalInt(data.updated_by ?? data.updatedBy);
    const dbGet = (query, params = []) => new Promise((resolve, reject) => {
        database_1.db.get(query, params, (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row);
        });
    });
    const dbAll = (query, params = []) => new Promise((resolve, reject) => {
        database_1.db.all(query, params, (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
    const dbRun = (query, params = []) => new Promise((resolve, reject) => {
        database_1.db.run(query, params, function (err) {
            if (err) {
                return reject(err);
            }
            resolve(this);
        });
    });
    return new Promise(async (resolve, reject) => {
        try {
            const currentTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
            if (!currentTask) {
                return reject({ status: 404, message: 'Task not found' });
            }
            const updates = [];
            const values = [];
            const updatedFields = {};
            const targetColumnId = columnId ?? currentTask.column_id;
            const targetSwimlaneId = swimlaneId ?? currentTask.swimlane_id;
            const positionChanged = position !== undefined;
            const columnChanged = columnId !== undefined && columnId !== currentTask.column_id;
            const swimlaneChanged = swimlaneId !== undefined && swimlaneId !== currentTask.swimlane_id;
            const needsReindex = positionChanged || columnChanged || swimlaneChanged;
            if (title !== undefined) {
                updates.push('title = ?');
                values.push(title);
                updatedFields.title = title;
                if (title !== currentTask.title) {
                    (0, history_1.recordTaskHistory)(id, 'title_changed', currentTask.title, title, updatedBy);
                }
            }
            if (description !== undefined) {
                updates.push('description = ?');
                values.push(description);
                updatedFields.description = description;
                if (description !== currentTask.description) {
                    (0, history_1.recordTaskHistory)(id, 'description_changed', currentTask.description, description, updatedBy);
                }
            }
            if (columnId !== undefined) {
                updates.push('column_id = ?');
                values.push(columnId);
                updatedFields.column_id = columnId;
                if (columnId !== currentTask.column_id) {
                    (0, history_1.recordTaskHistory)(id, 'column_changed', currentTask.column_id, columnId, updatedBy);
                    (0, automation_1.triggerAutomation)('task_moved', {
                        taskId: Number(id),
                        oldColumnId: currentTask.column_id,
                        newColumnId: columnId,
                    });
                }
            }
            if (swimlaneId !== undefined) {
                updates.push('swimlane_id = ?');
                values.push(swimlaneId);
                updatedFields.swimlane_id = swimlaneId;
                if (swimlaneId !== currentTask.swimlane_id) {
                    (0, history_1.recordTaskHistory)(id, 'swimlane_changed', currentTask.swimlane_id, swimlaneId, updatedBy);
                }
            }
            if (position !== undefined) {
                updatedFields.position = position;
                if (!needsReindex) {
                    updates.push('position = ?');
                    values.push(position);
                }
            }
            if (priority !== undefined) {
                updates.push('priority = ?');
                values.push(priority);
                updatedFields.priority = priority;
                if (priority !== currentTask.priority) {
                    (0, history_1.recordTaskHistory)(id, 'priority_changed', currentTask.priority, priority, updatedBy);
                }
            }
            if (dueDate !== undefined) {
                updates.push('due_date = ?');
                values.push(dueDate);
                updatedFields.due_date = dueDate;
                if (dueDate !== currentTask.due_date) {
                    (0, history_1.recordTaskHistory)(id, 'due_date_changed', currentTask.due_date, dueDate, updatedBy);
                }
            }
            if (recurringRule !== undefined) {
                updates.push('recurring_rule = ?');
                values.push(recurringRule);
                updatedFields.recurring_rule = recurringRule;
            }
            if (pinned !== undefined) {
                updates.push('pinned = ?');
                values.push(pinned);
                updatedFields.pinned = pinned;
            }
            if (assignedTo !== undefined) {
                updates.push('assigned_to = ?');
                values.push(assignedTo);
                updatedFields.assigned_to = assignedTo;
                if (assignedTo !== currentTask.assigned_to) {
                    (0, history_1.recordTaskHistory)(id, 'assignment_changed', currentTask.assigned_to, assignedTo, updatedBy);
                }
            }
            if (updates.length === 0 && !needsReindex) {
                return reject({ status: 400, message: 'No valid fields to update' });
            }
            if (needsReindex) {
                try {
                    const existingTasks = await dbAll(`SELECT id FROM tasks WHERE column_id = ?
             AND ((swimlane_id IS NULL AND ? IS NULL) OR swimlane_id = ?)
             ORDER BY position ASC`, [targetColumnId, targetSwimlaneId, targetSwimlaneId]);
                    const siblingIds = existingTasks
                        .map(task => task.id)
                        .filter(taskId => taskId !== Number(id));
                    const insertionIndex = Math.max(0, Math.min(position ?? siblingIds.length, siblingIds.length));
                    siblingIds.splice(insertionIndex, 0, Number(id));
                    await dbRun('BEGIN TRANSACTION');
                    try {
                        if (updates.length > 0) {
                            updates.push('updated_at = CURRENT_TIMESTAMP');
                            await dbRun(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, [...values, id]);
                        }
                        for (let index = 0; index < siblingIds.length; index++) {
                            await dbRun('UPDATE tasks SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [index, siblingIds[index]]);
                        }
                        await dbRun('COMMIT');
                    }
                    catch (transactionErr) {
                        await dbRun('ROLLBACK');
                        throw transactionErr;
                    }
                    const updatedTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [id]);
                    updatedFields.position = insertionIndex;
                    (0, eventBus_1.emitEvent)('task', 'updated', {
                        id: Number(id),
                        changes: updatedFields,
                        task: updatedTask,
                    });
                    resolve({ message: 'Task updated successfully', task: updatedTask, changes: updatedFields });
                }
                catch (reindexErr) {
                    reject({ status: 500, message: reindexErr.message });
                }
                return;
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            database_1.db.run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values, function (updateErr) {
                if (updateErr) {
                    return reject({ status: 500, message: updateErr.message });
                }
                database_1.db.get('SELECT * FROM tasks WHERE id = ?', [id], (fetchErr, updatedTask) => {
                    if (fetchErr) {
                        return reject({ status: 500, message: fetchErr.message });
                    }
                    (0, eventBus_1.emitEvent)('task', 'updated', {
                        id: Number(id),
                        changes: updatedFields,
                        task: updatedTask,
                    });
                    resolve({ message: 'Task updated successfully', task: updatedTask, changes: updatedFields });
                });
            });
        }
        catch (error) {
            reject({ status: 500, message: error.message });
        }
    });
}
async function deleteTaskRecord(id, data) {
    const deletedBy = normalizeOptionalInt(data?.deleted_by ?? data?.deletedBy, { treatUndefinedAsNull: true });
    return new Promise((resolve, reject) => {
        database_1.db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, task) => {
            if (err) {
                return reject({ status: 500, message: err.message });
            }
            if (!task) {
                return reject({ status: 404, message: 'Task not found' });
            }
            database_1.db.run('DELETE FROM tasks WHERE id = ?', [id], function (deleteErr) {
                if (deleteErr) {
                    return reject({ status: 500, message: deleteErr.message });
                }
                (0, history_1.recordTaskHistory)(id, 'deleted', null, null, deletedBy);
                (0, automation_1.triggerAutomation)('task_deleted', {
                    taskId: Number(id),
                    columnId: task.column_id,
                });
                (0, eventBus_1.emitEvent)('task', 'deleted', {
                    id: Number(id),
                    deletedBy,
                    task,
                });
                resolve({ message: 'Task deleted successfully', task });
            });
        });
    });
}
function handleTaskError(res, error) {
    if (!error) {
        return res.status(500).json({ error: 'Unknown error' });
    }
    if (error.status) {
        return res.status(error.status).json({ error: error.message });
    }
    const message = error.message || error.toString();
    return res.status(500).json({ error: message });
}
module.exports = router;
//# sourceMappingURL=tasks.js.map