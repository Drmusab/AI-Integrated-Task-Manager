"use strict";
const cron = require("node-cron");
const database_1 = require("../utils/database");
const automation_1 = require("./automation");
const notifications_1 = require("./notifications");
const tasks_1 = require("./tasks");
const reporting_1 = require("./reporting");
// Time constants
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
// Start the scheduler
const startScheduler = () => {
    console.log('Starting task scheduler...');
    // Check for due tasks every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date().toISOString();
            // Get tasks that are due or overdue
            database_1.db.all('SELECT * FROM tasks WHERE due_date <= ? AND due_date IS NOT NULL', [now], async (err, tasks) => {
                if (err) {
                    console.error('Error checking due tasks:', err);
                    return;
                }
                for (const task of tasks) {
                    const dueDate = new Date(task.due_date);
                    const nowDate = new Date();
                    const minutesUntilDue = Math.floor((dueDate - nowDate) / MILLISECONDS_PER_MINUTE);
                    // Check if task is overdue (more than 1 hour past due date)
                    if (nowDate - dueDate > MILLISECONDS_PER_HOUR) {
                        // Trigger automation for overdue task
                        (0, automation_1.triggerAutomation)('task_overdue', { taskId: task.id, columnId: task.column_id });
                        // Send notification for overdue task
                        (0, notifications_1.sendTaskDueNotification)(task, minutesUntilDue);
                    }
                    // Check if task is due (within 1 hour of due date)
                    else if (nowDate - dueDate >= 0) {
                        // Trigger automation for due task
                        (0, automation_1.triggerAutomation)('task_due', { taskId: task.id, columnId: task.column_id });
                        // Send notification for due task
                        (0, notifications_1.sendTaskDueNotification)(task, 0);
                    }
                    // Check if task is due soon (within 1 hour of due date)
                    else if (dueDate - nowDate <= MILLISECONDS_PER_HOUR) {
                        // Trigger automation for task due soon
                        (0, automation_1.triggerAutomation)('task_due_soon', { taskId: task.id, columnId: task.column_id });
                        // Send notification for task due soon
                        (0, notifications_1.sendTaskDueNotification)(task, minutesUntilDue);
                    }
                }
            });
        }
        catch (error) {
            console.error('Error in scheduler:', error);
        }
    });
    // Check for recurring tasks daily at midnight
    cron.schedule('0 0 * * *', async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            // Get tasks with recurring rules
            database_1.db.all('SELECT * FROM tasks WHERE recurring_rule IS NOT NULL', async (err, tasks) => {
                if (err) {
                    console.error('Error checking recurring tasks:', err);
                    return;
                }
                for (const task of tasks) {
                    try {
                        const recurringRule = JSON.parse(task.recurring_rule);
                        const lastDueDate = new Date(task.due_date);
                        // Check if we need to create a new instance of this recurring task
                        if (shouldCreateRecurringTask(lastDueDate, recurringRule, today)) {
                            await (0, tasks_1.createRecurringTask)(task, recurringRule);
                            // Send routine reminder for the new instance
                            (0, notifications_1.sendRoutineReminder)(task);
                        }
                    }
                    catch (error) {
                        console.error(`Error processing recurring task ${task.id}:`, error);
                    }
                }
            });
        }
        catch (error) {
            console.error('Error in recurring task scheduler:', error);
        }
    });
    // Check for routine lead-time notifications every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            database_1.db.all('SELECT * FROM tasks WHERE recurring_rule IS NOT NULL AND due_date IS NOT NULL', [], async (err, tasks) => {
                if (err) {
                    console.error('Error checking routine notifications:', err);
                    return;
                }
                for (const task of tasks) {
                    const recurringRule = parseRecurringRule(task.recurring_rule);
                    if (recurringRule.status === 'paused') {
                        continue;
                    }
                    const dueDate = new Date(task.due_date);
                    if (Number.isNaN(dueDate.getTime())) {
                        continue;
                    }
                    const minutesUntilDue = Math.floor((dueDate - now) / MILLISECONDS_PER_MINUTE);
                    const shouldNotify = minutesUntilDue <= recurringRule.notificationLeadTime
                        && minutesUntilDue >= (recurringRule.notificationLeadTime - 1);
                    const alreadyNotified = recurringRule.lastNotificationAt
                        && new Date(recurringRule.lastNotificationAt) > new Date(now.getTime() - MILLISECONDS_PER_HOUR);
                    if (shouldNotify && !alreadyNotified) {
                        try {
                            await (0, notifications_1.sendRoutineReminder)(task);
                            recurringRule.lastNotificationAt = new Date().toISOString();
                            await database_1.db.run('UPDATE tasks SET recurring_rule = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(recurringRule), task.id]);
                        }
                        catch (error) {
                            console.error(`Failed to send routine reminder for task ${task.id}:`, error);
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error in routine notification scheduler:', error);
        }
    });
    // Generate and send weekly reports to n8n every Monday at 9:00 AM
    cron.schedule('0 9 * * 1', async () => {
        try {
            const report = await (0, reporting_1.generateWeeklyReport)();
            await (0, reporting_1.sendReportToN8n)(report);
        }
        catch (error) {
            console.error('Error sending weekly report to n8n:', error);
        }
    });
    // Clean up old automation logs weekly
    cron.schedule('0 0 * * 0', async () => {
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const oneWeekAgoStr = oneWeekAgo.toISOString();
            database_1.db.run('DELETE FROM automation_logs WHERE created_at < ?', [oneWeekAgoStr], function (err) {
                if (err) {
                    console.error('Error cleaning up automation logs:', err);
                }
            });
        }
        catch (error) {
            console.error('Error in log cleanup scheduler:', error);
        }
    });
    console.log('Task scheduler started');
};
// Check if a new instance of a recurring task should be created
const shouldCreateRecurringTask = (lastDueDate, recurringRule, today) => {
    const nextDueDate = calculateNextDueDate(lastDueDate, recurringRule);
    return nextDueDate && nextDueDate.toISOString().split('T')[0] === today;
};
// Calculate the next due date for a recurring task
const calculateNextDueDate = (lastDueDate, recurringRule) => {
    if (!(lastDueDate instanceof Date) || Number.isNaN(lastDueDate.getTime())) {
        return null;
    }
    const { frequency, interval, endDate, maxOccurrences } = recurringRule;
    const nextDueDate = new Date(lastDueDate);
    switch (frequency) {
        case 'daily':
            nextDueDate.setDate(nextDueDate.getDate() + (interval || 1));
            break;
        case 'weekly':
            nextDueDate.setDate(nextDueDate.getDate() + ((interval || 1) * 7));
            break;
        case 'monthly':
            nextDueDate.setMonth(nextDueDate.getMonth() + (interval || 1));
            break;
        case 'yearly':
            nextDueDate.setFullYear(nextDueDate.getFullYear() + (interval || 1));
            break;
        default:
            return null;
    }
    // Check if we've reached the end date
    if (endDate && new Date(endDate) < nextDueDate) {
        return null;
    }
    return nextDueDate;
};
const parseRecurringRule = (ruleString) => {
    try {
        const parsed = typeof ruleString === 'string' ? JSON.parse(ruleString) : (ruleString || {});
        return {
            interval: parsed.interval || 1,
            notificationLeadTime: parsed.notificationLeadTime || 60,
            status: parsed.status || 'active',
            ...parsed,
        };
    }
    catch (error) {
        return { interval: 1, notificationLeadTime: 60, status: 'active' };
    }
};
module.exports = { startScheduler };
//# sourceMappingURL=scheduler.js.map