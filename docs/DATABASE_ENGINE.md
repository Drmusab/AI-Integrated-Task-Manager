# Universal Database Engine

## Overview

The Universal Database Engine is a Notion-like database system where databases are schemas + views, not traditional SQL tables. The same underlying data supports multiple dynamic views (Table, Kanban, Calendar, Timeline, Gallery) without data duplication.

## Core Principles

1. **Databases are Schemas, NOT Tables**: A database defines properties (schema), row blocks (data), and view definitions (projections)
2. **Rows Are Blocks**: Each row is a block compatible with the global block system
3. **Views Are NOT Data**: Views never store data; they are pure query + presentation configurations

## Architecture

### Type System

```typescript
// Property Types
PropertyType: text, number, select, multi_select, date, checkbox, relation, rollup, formula

// View Types
ViewType: table, board, calendar, timeline, gallery

// Block Types
BlockType.DATABASE    // Database container
BlockType.DB_ROW      // Database row
```

### Components

1. **Block System** (`blockCRUD.ts`, `blockRegistry.ts`)
   - Manages blocks and their tree structure
   - Provides CRUD operations for all block types
   - Validates block data against schemas

2. **Database Service** (`databaseService.ts`)
   - High-level API for managing databases, rows, and views
   - Handles property management
   - Provides import/export functionality

3. **Query Engine** (`databaseQueryEngine.ts`)
   - Filters (compound AND/OR)
   - Sorting (multi-property)
   - Grouping
   - Aggregations (count, sum, avg, min, max, etc.)
   - Pagination

## API Usage

### Creating a Database

```typescript
POST /api/databases
{
  "name": "Tasks",
  "description": "Task management database",
  "properties": [
    {
      "name": "Title",
      "type": "text",
      "required": true
    },
    {
      "name": "Status",
      "type": "select",
      "config": {
        "options": [
          { "id": "todo", "value": "To Do", "color": "#gray" },
          { "id": "progress", "value": "In Progress", "color": "#blue" },
          { "id": "done", "value": "Done", "color": "#green" }
        ]
      }
    },
    {
      "name": "Priority",
      "type": "select",
      "config": {
        "options": [
          { "id": "low", "value": "Low", "color": "#gray" },
          { "id": "medium", "value": "Medium", "color": "#yellow" },
          { "id": "high", "value": "High", "color": "#red" }
        ]
      }
    },
    {
      "name": "Due Date",
      "type": "date",
      "config": {
        "includeTime": false
      }
    }
  ]
}
```

### Creating Rows

```typescript
POST /api/databases/{databaseId}/rows
{
  "values": {
    "{titlePropertyId}": "Build database engine",
    "{statusPropertyId}": "progress",
    "{priorityPropertyId}": "high",
    "{dueDatePropertyId}": "2025-01-15"
  }
}
```

### Creating Views

#### Table View

```typescript
POST /api/databases/{databaseId}/views
{
  "name": "All Tasks",
  "type": "table",
  "sort": [
    { "propertyId": "{dueDatePropertyId}", "direction": "ASC" }
  ],
  "config": {
    "rowHeight": "normal"
  }
}
```

#### Board (Kanban) View

```typescript
POST /api/databases/{databaseId}/views
{
  "name": "Tasks by Status",
  "type": "board",
  "config": {
    "groupByPropertyId": "{statusPropertyId}",
    "cardProperties": ["{priorityPropertyId}", "{dueDatePropertyId}"]
  }
}
```

#### Calendar View

```typescript
POST /api/databases/{databaseId}/views
{
  "name": "Task Calendar",
  "type": "calendar",
  "config": {
    "datePropertyId": "{dueDatePropertyId}",
    "layout": "month"
  }
}
```

#### Timeline View

```typescript
POST /api/databases/{databaseId}/views
{
  "name": "Project Timeline",
  "type": "timeline",
  "config": {
    "startDatePropertyId": "{startPropertyId}",
    "endDatePropertyId": "{endPropertyId}",
    "zoom": "week"
  }
}
```

#### Gallery View

```typescript
POST /api/databases/{databaseId}/views
{
  "name": "Task Gallery",
  "type": "gallery",
  "config": {
    "cardSize": "medium",
    "previewProperties": ["{statusPropertyId}", "{priorityPropertyId}"]
  }
}
```

### Querying Data

#### Basic Query

```typescript
POST /api/databases/{databaseId}/query
{
  "filter": {
    "operator": "AND",
    "conditions": [
      {
        "propertyId": "{statusPropertyId}",
        "operator": "select_equals",
        "value": "progress"
      }
    ]
  },
  "sort": [
    { "propertyId": "{priorityPropertyId}", "direction": "DESC" }
  ],
  "limit": 10
}
```

#### Advanced Query with Aggregations

```typescript
POST /api/databases/{databaseId}/query
{
  "groupBy": "{statusPropertyId}",
  "aggregations": [
    {
      "propertyId": "{statusPropertyId}",
      "type": "count"
    }
  ]
}
```

#### View Query

```typescript
POST /api/databases/views/{viewId}/query
{
  // View already has filter/sort/groupBy configured
  // Can override with additional options
  "limit": 20,
  "offset": 0
}
```

## Filter Operators

### Text Operators
- `equals`, `not_equals`
- `contains`, `not_contains`
- `starts_with`, `ends_with`
- `is_empty`, `is_not_empty`

### Number Operators
- `greater_than`, `greater_than_or_equal`
- `less_than`, `less_than_or_equal`

### Date Operators
- `date_equals`, `date_before`, `date_after`
- `date_on_or_before`, `date_on_or_after`

### Select Operators
- `select_equals`, `select_not_equals`
- `select_is_empty`, `select_is_not_empty`

### Multi-select Operators
- `multi_select_contains`, `multi_select_not_contains`

### Checkbox Operators
- `is_checked`, `is_not_checked`

## Aggregation Types

- **Count**: `count`, `count_values`, `count_unique`, `count_empty`, `count_not_empty`
- **Percentage**: `percent_empty`, `percent_not_empty`
- **Statistics**: `sum`, `avg`, `min`, `max`, `median`, `range`

## Example: Complete Task Management Database

```bash
# 1. Create database
curl -X POST http://localhost:3001/api/databases \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Tasks",
    "properties": [
      { "name": "Task", "type": "text", "required": true },
      { "name": "Status", "type": "select", "config": { "options": [...] } },
      { "name": "Priority", "type": "select", "config": { "options": [...] } },
      { "name": "Assignee", "type": "select", "config": { "options": [...] } },
      { "name": "Due Date", "type": "date" },
      { "name": "Completed", "type": "checkbox" }
    ]
  }'

# 2. Create rows
curl -X POST http://localhost:3001/api/databases/{id}/rows \
  -H "Content-Type: application/json" \
  -d '{ "values": { ... } }'

# 3. Create table view
curl -X POST http://localhost:3001/api/databases/{id}/views \
  -H "Content-Type: application/json" \
  -d '{ "name": "All Tasks", "type": "table" }'

# 4. Create board view
curl -X POST http://localhost:3001/api/databases/{id}/views \
  -H "Content-Type: application/json" \
  -d '{ "name": "By Status", "type": "board", "config": { "groupByPropertyId": "..." } }'

# 5. Query data
curl -X POST http://localhost:3001/api/databases/{id}/query \
  -H "Content-Type: application/json" \
  -d '{ "filter": { ... }, "sort": [ ... ] }'
```

## Permissions

The system supports role-based permissions:

- **Owner**: Full control
- **Editor**: Can create/edit/delete rows, create views
- **Commenter**: Can view only
- **Viewer**: Can view only

## Future Enhancements

1. **Formula Properties**: Computed fields with custom expressions
2. **Rollup Properties**: Aggregate data from related databases
3. **Two-way Relations**: Bidirectional database links
4. **Property Dependencies**: Cascading updates
5. **Real-time Collaboration**: Multi-user editing with OT/CRDT
6. **Undo/Redo**: Full history tracking
7. **Templates**: Pre-configured database templates

## Success Criteria ✅

- [x] One database supports 5+ view types
- [x] Adding a new view requires no schema changes
- [x] Views update instantly when data changes (data is not duplicated)
- [x] Filters and grouping behave identically across views
- [x] No view-specific data storage
- [x] Extensible for future view types
- [x] Deterministic sorting and stable row identities
