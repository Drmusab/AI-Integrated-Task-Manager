"use strict";
const express = require("express");
const router = express.Router();
const express_validator_1 = require("express-validator");
const database_1 = require("../utils/database");
const automation_1 = require("../services/automation");
// Get all automation rules
router.get('/', (req, res) => {
    database_1.db.all('SELECT ar.*, u.username as created_by_name FROM automation_rules ar LEFT JOIN users u ON ar.created_by = u.id ORDER BY ar.created_at DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Parse JSON fields for each rule
        const rules = rows.map(row => ({
            ...row,
            trigger_config: JSON.parse(row.trigger_config),
            action_config: JSON.parse(row.action_config)
        }));
        res.json(rules);
    });
});
// Get a specific automation rule
router.get('/:id', (req, res) => {
    const { id } = req.params;
    database_1.db.get('SELECT ar.*, u.username as created_by_name FROM automation_rules ar LEFT JOIN users u ON ar.created_by = u.id WHERE ar.id = ?', [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Automation rule not found' });
        }
        // Parse JSON fields
        const rule = {
            ...row,
            trigger_config: JSON.parse(row.trigger_config),
            action_config: JSON.parse(row.action_config)
        };
        res.json(rule);
    });
});
// Create a new automation rule
router.post('/', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Rule name is required'),
    (0, express_validator_1.body)('trigger_type').notEmpty().withMessage('Trigger type is required'),
    (0, express_validator_1.body)('trigger_config').notEmpty().withMessage('Trigger config is required'),
    (0, express_validator_1.body)('action_type').notEmpty().withMessage('Action type is required'),
    (0, express_validator_1.body)('action_config').notEmpty().withMessage('Action config is required'),
], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, trigger_type, trigger_config, action_type, action_config, enabled = 1, created_by } = req.body;
    database_1.db.run('INSERT INTO automation_rules (name, trigger_type, trigger_config, action_type, action_config, enabled, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [name, trigger_type, JSON.stringify(trigger_config), action_type, JSON.stringify(action_config), enabled, created_by], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, message: 'Automation rule created successfully' });
    });
});
// Update an automation rule
router.put('/:id', [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Rule name cannot be empty'),
    (0, express_validator_1.body)('trigger_type').optional().notEmpty().withMessage('Trigger type cannot be empty'),
    (0, express_validator_1.body)('action_type').optional().notEmpty().withMessage('Action type cannot be empty'),
], (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.params;
    const { name, trigger_type, trigger_config, action_type, action_config, enabled } = req.body;
    // Build update query dynamically
    const updates = [];
    const values = [];
    if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
    }
    if (trigger_type !== undefined) {
        updates.push('trigger_type = ?');
        values.push(trigger_type);
    }
    if (trigger_config !== undefined) {
        updates.push('trigger_config = ?');
        values.push(JSON.stringify(trigger_config));
    }
    if (action_type !== undefined) {
        updates.push('action_type = ?');
        values.push(action_type);
    }
    if (action_config !== undefined) {
        updates.push('action_config = ?');
        values.push(JSON.stringify(action_config));
    }
    if (enabled !== undefined) {
        updates.push('enabled = ?');
        values.push(enabled);
    }
    if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    database_1.db.run(`UPDATE automation_rules SET ${updates.join(', ')} WHERE id = ?`, values, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Automation rule not found' });
        }
        res.json({ message: 'Automation rule updated successfully' });
    });
});
// Delete an automation rule
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    database_1.db.run('DELETE FROM automation_rules WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Automation rule not found' });
        }
        res.json({ message: 'Automation rule deleted successfully' });
    });
});
// Get automation logs
router.get('/logs', (req, res) => {
    const { ruleId, limit = 50 } = req.query;
    let query = `
    SELECT al.*, ar.name as rule_name
    FROM automation_logs al
    JOIN automation_rules ar ON al.rule_id = ar.id
    WHERE 1=1
  `;
    const params = [];
    if (ruleId) {
        query += ' AND al.rule_id = ?';
        params.push(ruleId);
    }
    query += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(limit);
    database_1.db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});
// Manually trigger an automation rule
router.post('/:id/trigger', async (req, res) => {
    const { id } = req.params;
    const payload = req.body?.payload ?? {};
    let rule;
    try {
        rule = await (0, database_1.getAsync)('SELECT * FROM automation_rules WHERE id = ? AND enabled = 1', [id]);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
    if (!rule) {
        return res.status(404).json({ error: 'Automation rule not found or disabled' });
    }
    try {
        let triggerConfig;
        let actionConfig;
        try {
            triggerConfig = JSON.parse(rule.trigger_config);
        }
        catch (error) {
            throw new Error('Invalid trigger configuration');
        }
        try {
            actionConfig = JSON.parse(rule.action_config);
        }
        catch (error) {
            throw new Error('Invalid action configuration');
        }
        if (!(0, automation_1.checkTriggerConditions)(triggerConfig, payload)) {
            return res.status(400).json({ error: 'Trigger conditions not met' });
        }
        const actionResult = await (0, automation_1.executeAutomationAction)(rule.action_type, actionConfig, payload);
        await (0, database_1.runAsync)('INSERT INTO automation_logs (rule_id, status, message) VALUES (?, ?, ?)', [
            id,
            actionResult?.success === false ? 'failed' : 'success',
            actionResult?.message || actionResult?.error || 'Manual trigger',
        ]);
        if (actionResult?.success === false) {
            return res.status(400).json({
                success: false,
                message: 'Automation rule execution failed',
                error: actionResult.error,
            });
        }
        return res.json({
            success: true,
            message: 'Automation rule triggered successfully',
            result: actionResult,
        });
    }
    catch (error) {
        try {
            await (0, database_1.runAsync)('INSERT INTO automation_logs (rule_id, status, message) VALUES (?, ?, ?)', [id, 'failed', error.message]);
        }
        catch (logError) {
            console.error('Failed to log automation execution:', logError);
        }
        return res.status(500).json({
            success: false,
            message: 'Automation rule execution failed',
            error: error.message,
        });
    }
});
module.exports = router;
//# sourceMappingURL=automation.js.map