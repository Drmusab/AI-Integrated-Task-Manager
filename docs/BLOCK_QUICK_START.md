# Block System Quick Start

## What is the Block System?

The Block System is a flexible, extensible architecture where **everything** in the application is represented as a **block** - the smallest atomic unit of content and structure.

## Quick Example

```typescript
import { BlockCRUDEngine } from './services/blockCRUD';
import { BlockType } from './types/blocks';
import { initializeBlockSystem } from './services/blockSystem';

// Initialize the system (do this once on app startup)
initializeBlockSystem();

// Create a CRUD engine
const engine = new BlockCRUDEngine();

// Create a Kanban board
const board = engine.create({
  type: BlockType.KANBAN_BOARD,
  data: { name: 'My Project' }
});

// Add a column
const column = engine.create({
  type: BlockType.KANBAN_COLUMN,
  data: { name: 'To Do', color: '#3498db' },
  parentId: board.id
});

// Add a card
const card = engine.create({
  type: BlockType.KANBAN_CARD,
  data: {
    title: 'Implement feature',
    priority: 'high',
    tags: ['backend', 'api']
  },
  parentId: column.id
});

// Add subtasks
engine.create({
  type: BlockType.TODO,
  data: { content: 'Design API', completed: false },
  parentId: card.id
});

// Move card to another column
const doneColumn = engine.create({
  type: BlockType.KANBAN_COLUMN,
  data: { name: 'Done', color: '#2ecc71' },
  parentId: board.id
});

engine.move({
  id: card.id,
  newParentId: doneColumn.id
});

// Export the entire tree as JSON
const tree = engine.exportTree();
console.log(JSON.stringify(tree, null, 2));
```

## 23 Block Types Available

### Content Blocks
- `TEXT` - Basic text
- `HEADING` - H1-H6 headings
- `TODO` - Checkboxes
- `IMAGE` - Images
- `EMBED` - Embedded content
- `DIVIDER` - Visual separators
- `QUOTE` - Blockquotes
- `CODE` - Code blocks
- `LIST` - Ordered/unordered lists
- `LIST_ITEM` - List items

### Structure Blocks
- `PAGE` - Top-level containers
- `ROW` - Horizontal layouts
- `COLUMN` - Vertical layouts

### Kanban Blocks
- `KANBAN_BOARD` - Full boards
- `KANBAN_COLUMN` - Columns
- `KANBAN_CARD` - Task cards
- `KANBAN_SWIMLANE` - Horizontal groups

### Table Blocks
- `TABLE` - Tables
- `TABLE_ROW` - Rows
- `TABLE_CELL` - Cells

### AI Blocks
- `AI_BLOCK` - AI-generated content
- `AI_CHAT` - Chat interfaces
- `AI_SUGGESTION` - Smart suggestions

## Core Operations

### Create
```typescript
const block = engine.create({
  type: BlockType.TEXT,
  data: { content: 'Hello World' },
  parentId: 'parent-id',  // optional
  position: 0,            // optional
  metadata: {}            // optional
});
```

### Read
```typescript
// Get by ID
const block = engine.get('block-id');

// Query by type
const cards = engine.query({ type: BlockType.KANBAN_CARD });

// Search
const results = engine.search({ query: 'urgent' });

// Get children
const children = engine.getChildren('parent-id');
```

### Update
```typescript
engine.update({
  id: 'block-id',
  data: { priority: 'critical' },
  metadata: { aiHints: { isAIGenerated: true } }
});
```

### Delete
```typescript
// Delete single block
engine.delete({ id: 'block-id' });

// Delete with all children
engine.delete({ id: 'block-id', deleteChildren: true });
```

### Move
```typescript
engine.move({
  id: 'block-id',
  newParentId: 'new-parent-id',
  position: 0  // optional
});
```

### Duplicate
```typescript
// Duplicate without children
const dup = engine.duplicate({ id: 'block-id' });

// Duplicate with children
const dup = engine.duplicate({ 
  id: 'block-id',
  duplicateChildren: true 
});
```

## Key Features

✅ **Type Safe** - Full TypeScript support  
✅ **Tree Structure** - Maintains valid tree relationships  
✅ **Validation** - Automatic data validation  
✅ **Extensible** - Add new block types easily  
✅ **AI Ready** - Built-in AI block support  
✅ **JSON Serializable** - Export/import trees  
✅ **Well Tested** - 33 passing tests  

## Adding New Block Types

Adding a new block type takes less than 30 minutes:

1. Add to `BlockType` enum
2. Create data interface
3. Add to `Block` union type
4. Create schema with validation
5. Add to `allBlockSchemas` array

See [BLOCK_ARCHITECTURE.md](./BLOCK_ARCHITECTURE.md#extensibility) for details.

## Documentation

- 📖 [**BLOCK_ARCHITECTURE.md**](./BLOCK_ARCHITECTURE.md) - Complete architecture guide
- 📖 [**BLOCK_CRUD_OPERATIONS.md**](./BLOCK_CRUD_OPERATIONS.md) - Detailed CRUD guide
- 📖 [**BLOCK_IMPLEMENTATION_SUMMARY.md**](./BLOCK_IMPLEMENTATION_SUMMARY.md) - Implementation summary

## Files

```
backend/src/
├── types/
│   └── blocks.ts                  # Type definitions
├── services/
│   ├── blockRegistry.ts           # Registry & validation
│   ├── blockSchemas.ts            # Schema definitions
│   ├── blockCRUD.ts              # CRUD operations
│   └── blockSystem.ts            # Initialization
├── examples/
│   └── block-trees.json          # Example structures
└── tests/
    └── blocks.test.ts            # Tests (33 passing)
```

## Getting Started

```typescript
// 1. Import dependencies
import { initializeBlockSystem } from './services/blockSystem';
import { BlockCRUDEngine } from './services/blockCRUD';
import { BlockType } from './types/blocks';

// 2. Initialize system (once)
initializeBlockSystem();

// 3. Create engine
const engine = new BlockCRUDEngine();

// 4. Start creating blocks!
const page = engine.create({
  type: BlockType.PAGE,
  data: { title: 'My First Page' }
});
```

## Running Tests

```bash
cd backend
npm test -- blocks.test.ts
```

Expected output:
```
Test Suites: 1 passed, 1 total
Tests:       33 passed, 33 total
```

## Next Steps

1. Read the [Architecture Guide](./BLOCK_ARCHITECTURE.md)
2. Try the examples in `examples/block-trees.json`
3. Explore the [CRUD Operations Guide](./BLOCK_CRUD_OPERATIONS.md)
4. Run the tests to see it in action
5. Start building with blocks!

---

**Status:** ✅ Production Ready  
**Tests:** ✅ 33/33 Passing  
**Documentation:** ✅ Complete
