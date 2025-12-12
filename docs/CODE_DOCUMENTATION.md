# Code Documentation - Kanban Routine Manager

This document provides comprehensive documentation for every code file and function in the Kanban Routine Manager application.

## Table of Contents
- [Backend Documentation](#backend-documentation)
  - [Utilities](#utilities)
  - [Middleware](#middleware)
  - [Services](#services)
  - [Routes](#routes)
- [Frontend Documentation](#frontend-documentation)
  - [Components](#components)
  - [Pages](#pages)
  - [Services](#services-1)
  - [Contexts](#contexts)
  - [Utilities](#utilities-1)

---

## Backend Documentation

### Utilities

#### `backend/src/utils/database.js`
**Purpose:** SQLite database management and initialization

**Key Functions:**
- `runAsync(sql, params)` - Executes SQL statements that modify the database (INSERT, UPDATE, DELETE). Returns a promise with lastID and changes count.
- `getAsync(sql, params)` - Executes queries that return a single row. Returns undefined if no results found.
- `allAsync(sql, params)` - Executes queries that return multiple rows. Returns an array of row objects.
- `initDatabase()` - Initializes all database tables, creates indexes, and seeds default data including demo user, default board, columns, and tags.
- `clearDatabase()` - Clears all data from all tables while preserving schema. Used for testing and reset operations.

**Database Schema:**
- Users, boards, columns, swimlanes, tasks, tags, task_tags
- Subtasks, attachments, task_history
- Integrations, automation_rules, automation_logs, settings

#### `backend/src/utils/history.js`
**Purpose:** Task history tracking for audit trails

**Key Functions:**
- `recordTaskHistory(taskId, action, oldValue, newValue, userId)` - Records a task change event in the database. Includes action type (created, updated, moved, deleted), old and new values, and user who made the change. Errors are logged but don't interrupt the main operation.

#### `backend/src/utils/logger.js`
**Purpose:** Environment-aware logging with multiple log levels

**Key Features:**
- Supports ERROR, WARN, INFO, DEBUG log levels
- Automatically filters logs based on NODE_ENV (production: errors/warnings only, development: all levels, test: suppressed unless enabled)
- Formats messages with timestamps and metadata
- Thread-safe console output

**Key Functions:**
- `logger.error(message, meta)` - Logs critical errors
- `logger.warn(message, meta)` - Logs warnings
- `logger.info(message, meta)` - Logs informational messages (development only)
- `logger.debug(message, meta)` - Logs debug information (development only)

---

### Middleware

#### `backend/src/middleware/apiKeyAuth.js`
**Purpose:** API key authentication for webhooks and automation endpoints

**Key Features:**
- Extracts API keys from multiple sources: x-api-key header, Authorization Bearer header, or api_key query parameter
- Uses constant-time comparison to prevent timing attacks
- No-op in development if N8N_API_KEY is not configured
- Returns 401 Unauthorized if authentication fails

**Key Function:**
- `apiKeyAuth(req, res, next)` - Express middleware that validates API key before allowing access to protected routes

#### `backend/src/middleware/errorHandler.js`
**Purpose:** Centralized error handling for the application

**Key Components:**
- `AppError` class - Custom error class with statusCode, details, and isOperational properties
- `errorHandler(err, req, res, next)` - Main error handling middleware that formats errors, sanitizes sensitive data, and returns appropriate HTTP responses
- `asyncHandler(fn)` - Wrapper for async route handlers that automatically catches promise rejections
- `sanitizeBody(body)` - Removes sensitive fields (passwords, tokens, etc.) from error logs

**Error Handling:**
- ValidationError → 400 Bad Request
- UnauthorizedError → 401 Unauthorized
- SQLITE_CONSTRAINT → 409 Conflict
- SQLITE_ERROR → 500 Internal Server Error
- Default → 500 Internal Server Error

#### `backend/src/middleware/performance.js`
**Purpose:** Performance monitoring and profiling

**Key Components:**
- `requestTimer(req, res, next)` - Middleware that tracks request processing time and logs slow requests (>1000ms)
- `measureTime(name, fn)` - Utility function to measure and log execution time of any async operation
- `QueryPerformanceTracker` class - Tracks database query execution times, identifies slow queries (>100ms), maintains circular buffer of recent queries, provides statistics (avg, min, max durations)

**Usage:**
```javascript
// Enabled in development or with ENABLE_QUERY_TRACKING=true
queryTracker.track(query, params, duration);
const stats = queryTracker.getStats();
```

#### `backend/src/middleware/validation.js`
**Purpose:** Express-validator error handling

**Key Function:**
- `handleValidationErrors(req, res, next)` - Middleware that checks for validation errors from express-validator rules and returns 400 response with formatted error details if validation fails

---

### Services

#### `backend/src/services/eventBus.js`
**Purpose:** Real-time event streaming and synchronization

**Key Features:**
- In-memory event buffer (max 500 events)
- Server-Sent Events (SSE) support for live updates
- Event filtering by timestamp, event ID, or limit
- Pub/sub pattern for real-time client synchronization

**Key Functions:**
- `emitEvent(resource, action, payload)` - Emits an event to all subscribers. Creates unique event ID and timestamp. Examples: task.created, board.updated, column.deleted
- `subscribe(listener)` - Registers a callback to receive all events. Returns unsubscribe function.
- `getEventsSince({ since, lastEventId, limit })` - Retrieves filtered events from buffer
- `toNumericBoolean(value)` - Converts boolean to 1/0 for SQLite storage
- `resetEvents()` - Clears event buffer (used in testing)

#### `backend/src/services/webhook.js`
**Purpose:** HTTP webhook triggering for external integrations

**Key Function:**
- `triggerWebhook(webhookId, payload)` - Sends POST request to configured webhook URL. Retrieves configuration from database, validates settings, supports Bearer token authentication, 10-second timeout, returns success/error status with response data

**Webhook Configuration:**
```json
{
  "webhookUrl": "https://n8n.example.com/webhook/...",
  "apiKey": "optional-bearer-token"
}
```

#### `backend/src/services/tasks.js`
**Purpose:** Recurring task creation and management

**Key Function:**
- `createRecurringTask(originalTask, recurringRule)` - Creates new instance of recurring task based on frequency and interval. Calculates next due date, validates end date and max occurrences constraints, copies task properties and tags, records creation in history.

**Supported Frequencies:**
- `daily` - Repeats every N days
- `weekly` - Repeats every N weeks
- `monthly` - Repeats every N months
- `yearly` - Repeats every N years

**Recurring Rule Schema:**
```javascript
{
  frequency: 'weekly',
  interval: 2,            // Every 2 weeks
  endDate: '2024-12-31',  // Optional
  maxOccurrences: 10      // Optional
}
```

#### `backend/src/services/scheduler.js`
**Purpose:** Cron-based task scheduling and automation

**Key Features:**
- **Every minute**: Checks for due/overdue tasks, triggers appropriate automations and notifications
- **Daily at midnight**: Processes recurring tasks, creates new instances based on rules
- **Every minute**: Sends routine task reminders based on notification lead time
- **Monday at 9 AM**: Generates and sends weekly reports to n8n
- **Weekly (Sunday midnight)**: Cleans up old automation logs (>7 days)

**Key Functions:**
- `startScheduler()` - Initializes all cron jobs
- `shouldCreateRecurringTask(lastDueDate, recurringRule, today)` - Determines if new recurring task instance should be created
- `calculateNextDueDate(lastDueDate, recurringRule)` - Calculates next due date based on frequency
- `parseRecurringRule(ruleString)` - Safely parses recurring rule JSON with defaults

**Time Constants:**
- `MILLISECONDS_PER_MINUTE` = 60,000
- `MILLISECONDS_PER_HOUR` = 3,600,000

#### `backend/src/services/notifications.js`
**Purpose:** Notification system for task events

**Key Functions:**
- `sendNotification(title, message, options)` - Sends notification to n8n webhooks. Options include type (info/reminder/routine/due), priority, task/board IDs, and metadata.
- `sendTaskReminder(task)` - Sends reminder for upcoming task
- `sendRoutineReminder(task)` - Sends reminder for scheduled routine task
- `sendTaskDueNotification(task, minutesUntilDue)` - Sends due/overdue notification with time until due

**Notification Types:**
- `info` - General information
- `reminder` - Task reminder
- `routine` - Routine task reminder
- `due` - Task due soon or overdue

**Notification Payload:**
```javascript
{
  type: 'notification',
  title: 'Task Reminder',
  message: 'Task "Deploy app" is due',
  notificationType: 'due',
  priority: 'high',
  taskId: 123,
  boardId: 1,
  timestamp: '2024-01-15T10:30:00Z',
  metadata: { dueDate: '...', minutesUntilDue: 30 }
}
```

#### `backend/src/services/automation.js`
**Purpose:** Rule-based automation engine

**Key Features:**
- Trigger-based automation execution
- Conditional rule evaluation
- Multiple action types
- Execution logging

**Key Functions:**
- `triggerAutomation(eventType, eventData)` - Finds and executes matching automation rules. Logs results to automation_logs table.
- `checkTriggerConditions(triggerConfig, eventData)` - Validates if event data matches rule conditions (column, priority, assignee, etc.)
- `executeAutomationAction(actionType, actionConfig, eventData)` - Executes automation action based on type

**Supported Triggers:**
- `task_created` - When a task is created
- `task_updated` - When a task is modified
- `task_moved` - When a task changes columns
- `task_deleted` - When a task is deleted
- `task_due` - When a task is due
- `task_overdue` - When a task is overdue
- `task_due_soon` - When a task is due within 1 hour

**Supported Actions:**
- `webhook` - Trigger external webhook
- `notification` - Send notification
- `move_task` - Move task to different column
- `update_task` - Update task fields (priority, due date, assignee)
- `create_task` - Create new task

**Automation Rule Structure:**
```javascript
{
  name: 'Notify on high priority',
  trigger_type: 'task_created',
  trigger_config: {
    columnId: 1,
    priority: 'high'
  },
  action_type: 'notification',
  action_config: {
    title: 'High Priority Task',
    message: 'A high priority task was created'
  }
}
```

#### `backend/src/services/reporting.js`
**Purpose:** Analytics and reporting generation

**Key Functions:**
- `generateWeeklyReport()` - Generates comprehensive weekly report with tasks created/completed/overdue, completion rate, average completion time, tasks by column/priority, top 5 active boards
- `generateCustomReport(startDate, endDate)` - Generates report for custom date range
- `sendReportToN8n(report)` - Sends generated report to all enabled n8n webhooks

**Weekly Report Structure:**
```javascript
{
  period: {
    start: '2024-01-08T00:00:00Z',
    end: '2024-01-15T00:00:00Z',
    days: 7
  },
  summary: {
    tasksCreated: 25,
    tasksCompleted: 18,
    tasksOverdue: 3,
    completionRate: '72.00%',
    avgCompletionTimeHours: '24.50'
  },
  tasksByColumn: [
    { column: 'To Do', count: 10 },
    { column: 'In Progress', count: 5 },
    { column: 'Done', count: 18 }
  ],
  tasksByPriority: [
    { priority: 'high', count: 5 },
    { priority: 'medium', count: 15 },
    { priority: 'low', count: 5 }
  ],
  activeBoards: [
    { id: 1, name: 'Project Alpha', task_count: 20, recent_activity: 15 }
  ]
}
```

---

### Routes

#### `backend/src/routes/tasks.js`
**Purpose:** Task CRUD operations and management

**Endpoints:**
- `GET /api/tasks` - List all tasks with optional filters (board, column, priority, tags, search)
- `GET /api/tasks/:id` - Get single task with full details including subtasks, tags, attachments
- `POST /api/tasks` - Create new task with validation
- `PUT /api/tasks/:id` - Update existing task
- `DELETE /api/tasks/:id` - Delete task and related data
- `PUT /api/tasks/:id/move` - Move task to different column/swimlane
- `POST /api/tasks/:id/tags` - Add tag to task
- `DELETE /api/tasks/:id/tags/:tagId` - Remove tag from task

#### `backend/src/routes/boards.js`
**Purpose:** Board management operations

**Endpoints:**
- `GET /api/boards` - List all boards
- `GET /api/boards/:id` - Get board with columns and swimlanes
- `POST /api/boards` - Create new board with optional template
- `PUT /api/boards/:id` - Update board details
- `DELETE /api/boards/:id` - Delete board and cascade delete related data
- `GET /api/boards/:id/columns` - Get all columns for a board
- `POST /api/boards/:id/columns` - Add column to board
- `PUT /api/boards/:id/columns/:columnId` - Update column
- `DELETE /api/boards/:id/columns/:columnId` - Delete column
- `GET /api/boards/:id/swimlanes` - Get all swimlanes for a board
- `POST /api/boards/:id/swimlanes` - Add swimlane to board

#### `backend/src/routes/users.js`
**Purpose:** User authentication and management

**Endpoints:**
- `POST /api/users/login` - Authenticate user with username/password, returns JWT token
- `POST /api/users/register` - Create new user account
- `GET /api/users/me` - Get current authenticated user profile
- `PUT /api/users/me` - Update current user profile
- `PUT /api/users/me/password` - Change password with current password validation

#### `backend/src/routes/integrations.js`
**Purpose:** External integration management

**Endpoints:**
- `GET /api/integrations` - List all integrations
- `GET /api/integrations/:id` - Get single integration
- `POST /api/integrations` - Create new integration (n8n webhook, etc.)
- `PUT /api/integrations/:id` - Update integration
- `DELETE /api/integrations/:id` - Delete integration
- `POST /api/integrations/test-n8n-webhook` - Test n8n webhook connectivity

#### `backend/src/routes/automation.js`
**Purpose:** Automation rule management

**Endpoints:**
- `GET /api/automation` - List all automation rules
- `GET /api/automation/:id` - Get single rule details
- `POST /api/automation` - Create new automation rule
- `PUT /api/automation/:id` - Update rule
- `DELETE /api/automation/:id` - Delete rule
- `POST /api/automation/:id/trigger` - Manually trigger automation rule
- `GET /api/automation/:id/logs` - Get execution logs for rule

#### `backend/src/routes/sync.js`
**Purpose:** Real-time synchronization via Server-Sent Events

**Endpoints:**
- `GET /api/sync/stream` - SSE endpoint for real-time event stream
- `GET /api/sync/events` - Get buffered events since timestamp or event ID
- `GET /api/sync/status` - Get sync system status and event count

#### `backend/src/routes/ai.js`
**Purpose:** Natural language AI command processing

**Endpoints:**
- `POST /api/ai/command` - Execute natural language command
- `GET /api/ai/patterns` - Get supported command patterns and examples

**Supported Commands:**
- "Create [priority] task [title] in [column]"
- "List tasks in [column]"
- "Move task [id] to [column]"
- "Complete task [id]"
- "Set due date of task [id] to [date]"
- "Set priority of task [id] to [priority]"
- "Show weekly report"
- "Show report from [start] to [end]"

#### `backend/src/routes/reports.js`
**Purpose:** Report generation and delivery

**Endpoints:**
- `GET /api/reports/weekly` - Generate weekly report
- `GET /api/reports/custom` - Generate custom date range report
- `GET /api/reports/analytics` - Get productivity analytics
- `POST /api/reports/weekly/send-to-n8n` - Send weekly report to n8n webhooks
- `POST /api/reports/custom/send-to-n8n` - Send custom report to n8n webhooks

#### `backend/src/routes/routines.js`
**Purpose:** Recurring task management

**Endpoints:**
- `GET /api/routines` - List all recurring tasks
- `GET /api/routines/:id` - Get recurring task details
- `POST /api/routines` - Create new recurring task
- `PUT /api/routines/:id` - Update recurring task and rule
- `DELETE /api/routines/:id` - Delete recurring task
- `POST /api/routines/:id/pause` - Pause recurring task
- `POST /api/routines/:id/resume` - Resume paused recurring task

#### `backend/src/routes/settings.js`
**Purpose:** Application settings management

**Endpoints:**
- `GET /api/settings` - Get all settings
- `GET /api/settings/:key` - Get single setting by key
- `PUT /api/settings/:key` - Update setting value
- `POST /api/settings` - Create new setting
- `DELETE /api/settings/:key` - Delete setting

---

## Frontend Documentation

### Components

#### `frontend/src/components/TaskCard.js`
**Purpose:** Draggable task card component for Kanban board

**Props:**
- `task` - Task object with id, title, description, priority, due_date, tags, etc.
- `onEdit` - Callback function when task is edited
- `onDelete` - Callback function when task is deleted
- `isDraggable` - Boolean to enable/disable drag functionality

**Features:**
- Drag and drop support via react-beautiful-dnd
- Priority badge color coding (critical=red, high=orange, medium=yellow, low=green)
- Due date display with overdue highlighting
- Tag display with custom colors
- Markdown description preview
- Subtask completion progress bar

#### `frontend/src/components/TaskDialog.js`
**Purpose:** Modal dialog for creating and editing tasks

**Props:**
- `open` - Boolean to control dialog visibility
- `onClose` - Callback when dialog is closed
- `task` - Existing task object (for edit mode)
- `columnId` - Default column ID for new tasks
- `boardId` - Board ID for the task

**Features:**
- Rich text editor with Markdown support
- Priority selector (low, medium, high, critical)
- Due date picker with calendar
- Tag multi-select with creation
- Swimlane selector
- Assignee selector
- Subtask management (add, edit, delete, reorder)
- File attachment upload (max 10MB per file)
- Form validation

#### `frontend/src/components/ColumnDialog.js`
**Purpose:** Dialog for creating and editing Kanban columns

**Props:**
- `open` - Boolean to control dialog visibility
- `onClose` - Callback when dialog is closed
- `column` - Existing column object (for edit mode)
- `boardId` - Board ID for the column

**Features:**
- Column name input with validation
- Color picker for column background
- Icon selector from Material-UI icons
- WIP (Work In Progress) limit setting
- Position/order management

#### `frontend/src/components/SwimlaneDialog.js`
**Purpose:** Dialog for creating and editing swimlanes

**Props:**
- `open` - Boolean to control dialog visibility
- `onClose` - Callback when dialog is closed
- `swimlane` - Existing swimlane object (for edit mode)
- `boardId` - Board ID for the swimlane

**Features:**
- Swimlane name input
- Color picker
- Collapsed state toggle

#### `frontend/src/components/RoutineDialog.js`
**Purpose:** Dialog for creating and configuring recurring tasks

**Props:**
- `open` - Boolean to control dialog visibility
- `onClose` - Callback when dialog is closed
- `routine` - Existing routine object (for edit mode)
- `boardId` - Board ID for the routine

**Features:**
- Task details (title, description, priority)
- Recurrence rule configuration:
  - Frequency (daily, weekly, monthly, yearly)
  - Interval (every N frequency units)
  - End date (optional)
  - Max occurrences (optional)
- Notification lead time (minutes before due)
- Pause/resume controls

#### `frontend/src/components/ConfirmDialog.js`
**Purpose:** Reusable confirmation dialog component

**Props:**
- `open` - Boolean to control dialog visibility
- `title` - Dialog title text
- `message` - Confirmation message text
- `onConfirm` - Callback when user confirms
- `onCancel` - Callback when user cancels
- `confirmText` - Text for confirm button (default: "Confirm")
- `cancelText` - Text for cancel button (default: "Cancel")
- `severity` - Dialog severity (error, warning, info)

#### `frontend/src/components/ErrorBoundary.js`
**Purpose:** React error boundary for graceful error handling

**Features:**
- Catches JavaScript errors in component tree
- Displays user-friendly error message
- Shows error details in development mode
- Provides "Try Again" button to reset error state
- Prevents entire app crash from component errors

#### `frontend/src/components/Navbar.js`
**Purpose:** Application navigation bar with user menu

**Features:**
- App branding and logo
- Navigation links (Boards, Analytics, Settings)
- User profile menu
- Logout functionality
- Responsive design for mobile

---

### Pages

#### `frontend/src/pages/Board.js`
**Purpose:** Main Kanban board view with drag-and-drop

**Features:**
- Multi-column Kanban layout
- Horizontal swimlanes for task categorization
- Drag and drop tasks between columns and swimlanes
- Column management (add, edit, delete, reorder)
- Swimlane management (add, edit, delete, reorder)
- Task filtering (search, priority, tags, assignee, due date)
- Task creation, editing, deletion
- Real-time sync via SSE
- Board settings and configuration

**State Management:**
- Tasks grouped by column and swimlane
- Drag and drop state with react-beautiful-dnd
- Filter state for search and filters
- Modal state for dialogs

#### `frontend/src/pages/Boards.js`
**Purpose:** Board list and management page

**Features:**
- Grid layout of board cards
- Create new board with templates:
  - Simple (To Do, In Progress, Done)
  - Software Development (Backlog, Ready, In Progress, Review, Testing, Done)
  - Bug Tracking (Reported, Confirmed, In Progress, Testing, Resolved)
  - Custom (blank board)
- Edit board details (name, description)
- Delete board with confirmation
- Search and filter boards
- Board analytics preview (task count, completion rate)

#### `frontend/src/pages/Login.js`
**Purpose:** User authentication page

**Features:**
- Username and password login form
- Form validation
- Error message display
- JWT token storage in localStorage
- Redirect to boards after successful login
- Demo credentials display (demo/demo123)

#### `frontend/src/pages/Analytics.js`
**Purpose:** Task analytics and reporting dashboard

**Features:**
- Summary cards:
  - Total tasks
  - Tasks by status (To Do, In Progress, Done)
  - Completion rate percentage
  - Overdue tasks count
- Charts and visualizations:
  - Task distribution pie chart
  - Completion trends line chart
  - Priority breakdown bar chart
  - Board performance comparison
- Date range selector
- Export data (CSV, JSON)
- Weekly/monthly/yearly view options

**Libraries Used:**
- Recharts for data visualization
- Material-UI for UI components

#### `frontend/src/pages/Calendar.js`
**Purpose:** Calendar view of tasks with due dates

**Features:**
- Monthly calendar grid
- Tasks displayed on due dates
- Color coding by priority
- Click to view/edit task details
- Drag tasks to change due dates
- Filter by board, column, priority
- Today indicator

#### `frontend/src/pages/Routines.js`
**Purpose:** Recurring task management page

**Features:**
- List of all recurring tasks
- Recurrence rule display (daily, weekly, etc.)
- Pause/resume controls
- Edit recurring task and rule
- Delete recurring task
- Create new recurring task
- Upcoming instance preview
- Notification lead time configuration

#### `frontend/src/pages/Settings.js`
**Purpose:** Application settings and configuration

**Tabs:**
1. **Profile** - User profile settings, password change
2. **Integrations** - n8n webhook configuration, API keys
3. **Automation** - Automation rule management
4. **Reports** - Report scheduling (weekly reports, custom reports)
5. **Appearance** - Theme, color scheme, accessibility
6. **Data** - Backup/restore, export data, clear data

---

### Services

#### `frontend/src/services/api.js`
**Purpose:** Axios HTTP client configuration

**Features:**
- Base URL configuration from environment
- Request interceptor for JWT token injection
- Response interceptor for error handling
- 401 handling with redirect to login
- Network error handling

**Axios Instance Configuration:**
```javascript
{
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
}
```

#### `frontend/src/services/taskService.js`
**Purpose:** Task-related API calls

**Functions:**
- `getAllTasks(filters)` - Fetch all tasks with optional filters
- `getTaskById(id)` - Fetch single task details
- `createTask(taskData)` - Create new task
- `updateTask(id, taskData)` - Update existing task
- `deleteTask(id)` - Delete task
- `moveTask(id, columnId, position)` - Move task to different column
- `addTagToTask(taskId, tagId)` - Add tag to task
- `removeTagFromTask(taskId, tagId)` - Remove tag from task
- `uploadAttachment(taskId, file)` - Upload file attachment

#### `frontend/src/services/boardService.js`
**Purpose:** Board-related API calls

**Functions:**
- `getAllBoards()` - Fetch all boards
- `getBoardById(id)` - Fetch single board with columns and swimlanes
- `createBoard(boardData)` - Create new board
- `updateBoard(id, boardData)` - Update board details
- `deleteBoard(id)` - Delete board
- `createColumn(boardId, columnData)` - Add column to board
- `updateColumn(boardId, columnId, columnData)` - Update column
- `deleteColumn(boardId, columnId)` - Delete column
- `createSwimlane(boardId, swimlaneData)` - Add swimlane to board
- `updateSwimlane(boardId, swimlaneId, swimlaneData)` - Update swimlane
- `deleteSwimlane(boardId, swimlaneId)` - Delete swimlane

#### `frontend/src/services/automationService.js`
**Purpose:** Automation rule API calls

**Functions:**
- `getAllRules()` - Fetch all automation rules
- `getRuleById(id)` - Fetch single rule
- `createRule(ruleData)` - Create automation rule
- `updateRule(id, ruleData)` - Update rule
- `deleteRule(id)` - Delete rule
- `triggerRule(id)` - Manually trigger rule
- `getRuleLogs(id)` - Get execution logs

#### `frontend/src/services/integrationService.js`
**Purpose:** Integration management API calls

**Functions:**
- `getAllIntegrations()` - Fetch all integrations
- `getIntegrationById(id)` - Fetch single integration
- `createIntegration(integrationData)` - Create integration
- `updateIntegration(id, integrationData)` - Update integration
- `deleteIntegration(id)` - Delete integration
- `testN8nWebhook(webhookUrl)` - Test webhook connectivity

#### `frontend/src/services/routineService.js`
**Purpose:** Recurring task API calls

**Functions:**
- `getAllRoutines()` - Fetch all recurring tasks
- `getRoutineById(id)` - Fetch single routine
- `createRoutine(routineData)` - Create recurring task
- `updateRoutine(id, routineData)` - Update routine and rule
- `deleteRoutine(id)` - Delete recurring task
- `pauseRoutine(id)` - Pause recurring task
- `resumeRoutine(id)` - Resume recurring task

#### `frontend/src/services/settingsService.js`
**Purpose:** Settings management API calls

**Functions:**
- `getAllSettings()` - Fetch all settings
- `getSettingByKey(key)` - Fetch single setting
- `updateSetting(key, value)` - Update setting value
- `createSetting(settingData)` - Create new setting
- `deleteSetting(key)` - Delete setting

---

### Contexts

#### `frontend/src/contexts/AuthContext.js`
**Purpose:** Global authentication state management

**Provides:**
- `user` - Current authenticated user object
- `login(username, password)` - Login function
- `logout()` - Logout function
- `isAuthenticated` - Boolean authentication status
- `loading` - Boolean loading state

**Features:**
- JWT token management in localStorage
- Automatic token refresh
- Protected route redirects
- User profile caching

**Usage:**
```javascript
const { user, login, logout, isAuthenticated } = useAuth();
```

#### `frontend/src/contexts/NotificationContext.js`
**Purpose:** Global notification/snackbar management

**Provides:**
- `showNotification(message, severity)` - Display notification
- `hideNotification()` - Hide current notification

**Features:**
- Multiple severity levels (success, error, warning, info)
- Auto-dismiss after 6 seconds
- Queue support for multiple notifications
- Customizable position and duration

**Usage:**
```javascript
const { showNotification } = useNotification();
showNotification('Task created successfully', 'success');
```

---

### Utilities

#### `frontend/src/utils/boardUtils.js`
**Purpose:** Board and task manipulation utilities

**Functions:**
- `reorderTasks(tasks, startIndex, endIndex)` - Reorder tasks within same column
- `moveTasks(tasks, source, destination)` - Move task between columns
- `groupTasksByColumn(tasks, columns)` - Group tasks by their columns
- `groupTasksBySwimlane(tasks, swimlanes)` - Group tasks by swimlanes
- `filterTasks(tasks, filters)` - Apply search and filter criteria
- `sortTasks(tasks, sortBy)` - Sort tasks by field (due date, priority, created date)
- `calculateBoardProgress(tasks, columns)` - Calculate completion percentage
- `getTaskCountByColumn(tasks)` - Count tasks in each column

**Filter Criteria:**
- Search text (title, description)
- Priority (low, medium, high, critical)
- Tags (multiple selection)
- Assignee
- Due date (overdue, today, this week, this month)

---

## Testing

### Backend Tests

Located in `backend/tests/`:
- `tasks.crud.test.js` - Task CRUD operations
- `tasks.recurring.test.js` - Recurring task creation
- `boards.test.js` - Board management
- `ai.commands.test.js` - AI command parsing
- `reports.test.js` - Report generation
- `settings.test.js` - Settings management
- `sync.events.test.js` - Event bus and sync

**Test Framework:** Jest with Supertest for API testing

**Running Tests:**
```bash
cd backend
npm test
```

### Frontend Tests

Located in `frontend/src/**/__tests__/`:
- `ErrorBoundary.test.js` - Error boundary component
- `taskService.test.js` - Task service API calls
- `boardUtils.test.js` - Board utility functions

**Test Framework:** React Testing Library with Jest

**Running Tests:**
```bash
cd frontend
npm test
```

---

## Environment Configuration

### Backend Environment Variables

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_PATH=./data/kanban.db
N8N_API_KEY=your-secure-api-key-here
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./attachments
MAX_FILE_SIZE=10485760
NOTIFICATION_ENABLED=true
BACKUP_ENABLED=true
BACKUP_INTERVAL=daily
BACKUP_DIR=./backups
```

### Frontend Environment Variables

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENABLE_DEBUG=false
```

---

## API Authentication

### JWT Token Authentication

Most API endpoints require JWT token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### API Key Authentication

Webhook and automation endpoints require API key authentication. Include the API key in one of these ways:

1. **x-api-key header:** `x-api-key: your-api-key`
2. **Authorization Bearer header:** `Authorization: Bearer your-api-key`
3. **Query parameter:** `?api_key=your-api-key`

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Database constraint violation |
| 500 | Internal Server Error |

---

## Database Indexes

For optimal performance, the following indexes are created:

- `idx_tasks_column_id` - Fast task lookup by column
- `idx_tasks_swimlane_id` - Fast task lookup by swimlane
- `idx_tasks_due_date` - Fast due date queries
- `idx_task_history_task_id` - Fast history lookup
- `idx_automation_logs_rule_id` - Fast log lookup

---

## Security Features

1. **Helmet.js** - Secures HTTP headers
2. **CORS** - Cross-origin resource sharing control
3. **Rate Limiting** - 100 requests per 15 minutes per IP
4. **JWT Authentication** - Secure user sessions
5. **API Key Authentication** - Webhook security
6. **Password Hashing** - bcrypt with 10 rounds
7. **SQL Injection Prevention** - Parameterized queries
8. **Sensitive Data Redaction** - Automatic logging sanitization
9. **Constant-time Comparison** - Timing attack prevention

---

## Performance Optimization

1. **Database Indexes** - Fast query execution
2. **Request Timer Middleware** - Performance monitoring
3. **Query Performance Tracker** - Slow query detection
4. **Circular Event Buffer** - Memory-efficient event storage (max 500 events)
5. **Connection Pooling** - Database connection reuse
6. **Gzip Compression** - Response compression
7. **Static Asset Caching** - Browser caching for attachments

---

## Logging

### Log Levels
- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions that should be addressed
- **INFO**: Informational messages about application state
- **DEBUG**: Detailed debugging information

### Log Format
```
[2024-01-15T10:30:00.000Z] [INFO] Server running on port 3001
```

### Environment-based Logging
- **Production**: ERROR and WARN only
- **Development**: All levels
- **Test**: Suppressed (unless ENABLE_TEST_LOGGING=true)

---

## Deployment

### Docker Deployment

```bash
docker-compose up -d
```

Services:
- **kanban-frontend**: React app on port 3000
- **kanban-backend**: Node.js API on port 3001
- **kanban-n8n**: n8n automation on port 5678

### Manual Deployment

**Backend:**
```bash
cd backend
npm install
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
serve -s build
```

---

## Dependencies

### Backend Dependencies
- express - Web framework
- sqlite3 - Database
- cors - CORS middleware
- helmet - Security headers
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- multer - File upload handling
- node-cron - Task scheduling
- axios - HTTP client
- dotenv - Environment variables
- express-rate-limit - Rate limiting
- express-validator - Request validation
- uuid - UUID generation

### Frontend Dependencies
- react - UI library
- react-router-dom - Routing
- @mui/material - UI components
- @emotion/react - CSS-in-JS
- react-beautiful-dnd - Drag and drop
- axios - HTTP client
- date-fns - Date manipulation
- dayjs - Date parsing
- notistack - Notifications
- react-markdown - Markdown rendering
- recharts - Data visualization
- remark-gfm - GitHub Flavored Markdown

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/Drmusab/Kanban-Routine-Manager/issues
- Documentation: `/docs` directory

---

**Last Updated:** January 2024
**Version:** 1.0.0
