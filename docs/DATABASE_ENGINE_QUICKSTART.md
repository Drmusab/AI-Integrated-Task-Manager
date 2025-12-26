# Universal Database Engine - Quick Start

## What is it?

A Notion-like database system where **databases are schemas + views**, not traditional SQL tables. The same data supports multiple dynamic views (Table, Kanban, Calendar, Timeline, Gallery) without duplication.

## Key Features

✅ **9 Property Types**: text, number, select, multi-select, date, checkbox, relation, rollup, formula  
✅ **5 View Types**: Table, Board, Calendar, Timeline, Gallery  
✅ **Powerful Queries**: Filter, sort, group, aggregate, paginate  
✅ **No Data Duplication**: Views are pure configurations  
✅ **Type-Safe**: Full TypeScript support  
✅ **Well-Tested**: 21 unit tests, all passing  

## Quick Example

```typescript
import { initializeBlockSystem } from './services/blockSystem';
import { BlockCRUDEngine } from './services/blockCRUD';
import { DatabaseService } from './services/databaseService';
import { PropertyType, ViewType } from './types/database';

// Initialize
initializeBlockSystem();
const blockEngine = new BlockCRUDEngine();
const db = new DatabaseService(blockEngine);

// Create database
const dbId = db.createDatabase({
  name: 'Tasks',
  properties: [
    { id: 'title', name: 'Task', type: PropertyType.TEXT },
    { id: 'status', name: 'Status', type: PropertyType.SELECT, config: {...} }
  ]
});

// Add rows
db.createRow(dbId, { title: 'Build feature', status: 'todo' });

// Create views
db.createView({ name: 'All Tasks', type: ViewType.TABLE, databaseId: dbId });
db.createView({ 
  name: 'By Status', 
  type: ViewType.BOARD, 
  databaseId: dbId,
  config: { groupByPropertyId: 'status' }
});

// Query
const results = db.queryRows(dbId, {
  filter: { operator: 'AND', conditions: [...] },
  sort: [{ propertyId: 'title', direction: 'ASC' }],
  limit: 10
});
```

## API Endpoints

Base URL: `/api/databases`

### Databases
- `POST /api/databases` - Create database
- `GET /api/databases/:id` - Get database
- `PUT /api/databases/:id` - Update database
- `DELETE /api/databases/:id` - Delete database
- `GET /api/databases/:id/stats` - Get statistics
- `POST /api/databases/:id/export` - Export database
- `POST /api/databases/import` - Import database

### Properties
- `POST /api/databases/:id/properties` - Add property
- `PUT /api/databases/:id/properties/:propertyId` - Update property
- `DELETE /api/databases/:id/properties/:propertyId` - Delete property

### Rows
- `POST /api/databases/:id/rows` - Create row
- `GET /api/databases/:id/rows` - Get all rows
- `GET /api/databases/:id/rows/:rowId` - Get row
- `PUT /api/databases/:id/rows/:rowId` - Update row
- `DELETE /api/databases/:id/rows/:rowId` - Delete row

### Views
- `POST /api/databases/:id/views` - Create view
- `GET /api/databases/:id/views` - Get all views
- `GET /api/databases/views/:viewId` - Get view
- `PUT /api/databases/views/:viewId` - Update view
- `DELETE /api/databases/views/:viewId` - Delete view

### Queries
- `POST /api/databases/:id/query` - Query database
- `POST /api/databases/views/:viewId/query` - Query view

## Filter Operators

**Text**: `equals`, `not_equals`, `contains`, `not_contains`, `starts_with`, `ends_with`, `is_empty`, `is_not_empty`

**Number**: `greater_than`, `greater_than_or_equal`, `less_than`, `less_than_or_equal`

**Date**: `date_equals`, `date_before`, `date_after`, `date_on_or_before`, `date_on_or_after`

**Select**: `select_equals`, `select_not_equals`, `select_is_empty`, `select_is_not_empty`

**Multi-select**: `multi_select_contains`, `multi_select_not_contains`

**Checkbox**: `is_checked`, `is_not_checked`

## Aggregations

**Count**: `count`, `count_values`, `count_unique`, `count_empty`, `count_not_empty`

**Percentage**: `percent_empty`, `percent_not_empty`

**Statistics**: `sum`, `avg`, `min`, `max`, `median`, `range`

## Running Examples

```bash
# Run the complete example
cd backend
npx ts-node src/examples/databaseExample.ts

# Run tests
npm test databaseQueryEngine.test.ts
```

## Documentation

- **Full Documentation**: See `/docs/DATABASE_ENGINE.md`
- **API Reference**: REST API endpoints with examples
- **Example Code**: Complete task management example
- **Tests**: 21 comprehensive unit tests

## Architecture

```
┌─────────────────────────────────────────┐
│         Universal Database Engine        │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Database │  │   View   │  │  Row   ││
│  │ Service  │  │ Manager  │  │ Store  ││
│  └──────────┘  └──────────┘  └────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │       Query Engine                  ││
│  │ • Filter  • Sort  • Group  • Agg   ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │       Block System                  ││
│  │ • CRUD  • Tree  • Validation       ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## Core Principles

1. **Databases are Schemas**: Properties define structure
2. **Rows are Blocks**: Leverage existing block system
3. **Views are NOT Data**: Pure query configurations
4. **No Duplication**: Same data, multiple projections

## What's Next?

Backend complete! Ready for frontend:
- [ ] Database view components
- [ ] Property editor UI
- [ ] View switcher
- [ ] View-specific renderers
- [ ] State management

## License

MIT
