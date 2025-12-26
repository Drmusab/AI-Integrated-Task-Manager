# Block CRUD Operations Guide

## Overview

This document provides detailed information about the CRUD (Create, Read, Update, Delete) operations available in the block-based architecture, along with additional operations like Move and Duplicate.

## Table of Contents

1. [Create Operations](#create-operations)
2. [Read Operations](#read-operations)
3. [Update Operations](#update-operations)
4. [Delete Operations](#delete-operations)
5. [Move Operations](#move-operations)
6. [Duplicate Operations](#duplicate-operations)
7. [Best Practices](#best-practices)
8. [Error Handling](#error-handling)

---

## Create Operations

### Basic Block Creation

Create a new block with minimal parameters:

```typescript
import { BlockCRUDEngine } from './services/blockCRUD';
import { BlockType } from './types/blocks';

const engine = new BlockCRUDEngine();

const textBlock = engine.create({
  type: BlockType.TEXT,
  data: {
    content: 'Hello, World!'
  }
});

console.log(textBlock.id); // Unique UUID
console.log(textBlock.createdAt); // ISO timestamp
```

### Creating with Parent

Establish parent-child relationships:

```typescript
const page = engine.create({
  type: BlockType.PAGE,
  data: {
    title: 'My Document'
  }
});

const heading = engine.create({
  type: BlockType.HEADING,
  data: {
    content: 'Introduction',
    level: 1
  },
  parentId: page.id
});

// page.children now contains [heading.id]
```

### Creating with Position

Insert blocks at specific positions:

```typescript
const column = engine.create({
  type: BlockType.KANBAN_COLUMN,
  data: { name: 'To Do' }
});

// Add cards at specific positions
const card1 = engine.create({
  type: BlockType.KANBAN_CARD,
  data: { title: 'First' },
  parentId: column.id,
  position: 0  // First position
});

const card2 = engine.create({
  type: BlockType.KANBAN_CARD,
  data: { title: 'Second' },
  parentId: column.id,
  position: 0  // Insert before first
});

// column.children is now [card2.id, card1.id]
```

### Creating with Metadata

Add custom metadata during creation:

```typescript
const aiBlock = engine.create({
  type: BlockType.AI_BLOCK,
  data: {
    prompt: 'Summarize this text',
    response: 'Summary...'
  },
  metadata: {
    aiHints: {
      isAIGenerated: true,
      aiModel: 'gpt-4',
      confidence: 0.92
    },
    permissions: {
      canEdit: false,
      canDelete: true
    }
  }
});
```

---

## Read Operations

### Get by ID

Retrieve a single block:

```typescript
const block = engine.get('block-id');

if (block) {
  console.log(block.type);
  console.log(block.data);
} else {
  console.log('Block not found');
}
```

### Get Multiple Blocks

Retrieve several blocks at once:

```typescript
const ids = ['id-1', 'id-2', 'id-3'];
const blocks = engine.getMany(ids);

console.log(`Found ${blocks.length} blocks`);
```

### Query by Type

Find all blocks of a specific type:

```typescript
// Single type
const cards = engine.query({
  type: BlockType.KANBAN_CARD
});

// Multiple types
const todos = engine.query({
  type: [BlockType.TODO, BlockType.KANBAN_CARD]
});
```

### Query by Parent

Get all children of a parent:

```typescript
const children = engine.query({
  parentId: 'parent-id'
});

// Get root blocks (no parent)
const roots = engine.query({
  parentId: null
});
```

### Combined Queries

Use multiple filters:

```typescript
const results = engine.query({
  type: BlockType.KANBAN_CARD,
  parentId: 'column-id'
});
```

### Text Search

Search block content:

```typescript
const results = engine.search({
  query: 'urgent task',
  type: BlockType.KANBAN_CARD,
  limit: 10,
  offset: 0
});

for (const block of results) {
  if (block.type === BlockType.KANBAN_CARD) {
    console.log(block.data.title);
  }
}
```

### Hierarchical Queries

Navigate the tree structure:

```typescript
// Get direct children
const children = engine.getChildren('parent-id', false);

// Get all descendants (recursive)
const descendants = engine.getChildren('parent-id', true);

// Get parent
const parent = engine.getParent('child-id');

// Get all ancestors (parent chain)
const ancestors = engine.getAncestors('block-id');

// Get root blocks
const roots = engine.getRoots();
```

---

## Update Operations

### Update Data

Modify block-specific data:

```typescript
const updatedBlock = engine.update({
  id: 'card-id',
  data: {
    priority: 'critical',
    dueDate: '2025-02-01'
  }
});

// Only specified fields are updated
// Other fields remain unchanged
```

### Update Metadata

Modify block metadata:

```typescript
engine.update({
  id: 'block-id',
  metadata: {
    permissions: {
      canEdit: false
    },
    uiState: {
      isCollapsed: true
    }
  }
});
```

### Partial Updates

Updates are always partial - only provided fields are modified:

```typescript
const block = engine.create({
  type: BlockType.KANBAN_CARD,
  data: {
    title: 'Original Title',
    description: 'Original Description',
    priority: 'low'
  }
});

// Update only priority
engine.update({
  id: block.id,
  data: {
    priority: 'high'
  }
});

// title and description remain unchanged
```

---

## Delete Operations

### Delete Without Children

Delete a single block (must have no children):

```typescript
try {
  engine.delete({
    id: 'block-id'
  });
  console.log('Block deleted');
} catch (error) {
  console.error('Cannot delete block with children');
}
```

### Delete With Children

Recursively delete block and all descendants:

```typescript
engine.delete({
  id: 'parent-id',
  deleteChildren: true
});

// All children and descendants are deleted
```

### Cleanup After Delete

Deletion automatically:
- Removes block from parent's children array
- Updates parent's timestamp
- Removes from storage
- Removes from roots if it was a root block

---

## Move Operations

### Move to New Parent

Change a block's parent:

```typescript
engine.move({
  id: 'card-id',
  newParentId: 'new-column-id'
});

// Block is removed from old parent
// Block is added to new parent
```

### Move with Position

Specify insertion position:

```typescript
engine.move({
  id: 'card-id',
  newParentId: 'column-id',
  position: 2  // Insert at index 2
});
```

### Move to Root

Make a block a root (top-level):

```typescript
engine.move({
  id: 'block-id',
  newParentId: null
});

// Block becomes a root block
```

### Reorder Within Parent

Move within the same parent:

```typescript
const parent = engine.get('parent-id');
const childId = parent.children[2];

// Move from position 2 to position 0
engine.move({
  id: childId,
  newParentId: parent.id,
  position: 0
});
```

### Move Validation

Move operations validate:
- Target parent exists
- No circular references
- Parent-child relationship is allowed by schemas

```typescript
try {
  engine.move({
    id: 'parent-id',
    newParentId: 'child-id'  // Would create cycle
  });
} catch (error) {
  console.error('Move would create circular reference');
}
```

---

## Duplicate Operations

### Simple Duplicate

Duplicate a block without children:

```typescript
const original = engine.create({
  type: BlockType.KANBAN_CARD,
  data: {
    title: 'Original Task',
    priority: 'high'
  }
});

const duplicate = engine.duplicate({
  id: original.id
});

// New block with new ID
// Same data as original
// Same parent as original
```

### Deep Duplicate

Duplicate block with all children:

```typescript
const card = engine.create({
  type: BlockType.KANBAN_CARD,
  data: { title: 'Card' }
});

engine.create({
  type: BlockType.TODO,
  data: { content: 'Subtask 1', completed: false },
  parentId: card.id
});

engine.create({
  type: BlockType.TODO,
  data: { content: 'Subtask 2', completed: false },
  parentId: card.id
});

// Duplicate card and all subtasks
const duplicatedCard = engine.duplicate({
  id: card.id,
  duplicateChildren: true
});

// duplicatedCard has 2 new children
// All with new unique IDs
```

---

## Best Practices

### 1. Check Block Existence

Always check if a block exists before operating on it:

```typescript
const block = engine.get('block-id');
if (!block) {
  console.error('Block not found');
  return;
}

// Proceed with block
```

### 2. Use Type Guards

When working with block data, use type guards:

```typescript
const block = engine.get('block-id');

if (block && block.type === BlockType.KANBAN_CARD) {
  // TypeScript knows block.data is KanbanCardBlockData
  console.log(block.data.title);
  console.log(block.data.priority);
}
```

### 3. Validate Before Create

Validate data before creation to get better error messages:

```typescript
const validationResult = blockRegistry.validate(
  BlockType.KANBAN_CARD,
  { title: '' }  // Invalid - empty title
);

if (!validationResult.valid) {
  console.error('Validation errors:', validationResult.errors);
  return;
}

// Create only if valid
```

### 4. Use Transactions for Multiple Operations

When performing multiple related operations, consider wrapping them:

```typescript
function createKanbanBoard(name: string) {
  const board = engine.create({
    type: BlockType.KANBAN_BOARD,
    data: { name }
  });

  const todoCol = engine.create({
    type: BlockType.KANBAN_COLUMN,
    data: { name: 'To Do' },
    parentId: board.id
  });

  const doneCol = engine.create({
    type: BlockType.KANBAN_COLUMN,
    data: { name: 'Done' },
    parentId: board.id
  });

  return { board, todoCol, doneCol };
}
```

### 5. Clean Up After Errors

If an operation fails, ensure cleanup:

```typescript
try {
  const parent = engine.create({
    type: BlockType.PAGE,
    data: { title: 'Page' }
  });

  const child = engine.create({
    type: BlockType.TEXT,
    data: { content: 'Child' },
    parentId: parent.id
  });

  // Some operation that might fail
  riskyOperation(child);
} catch (error) {
  // Clean up if needed
  console.error('Operation failed:', error);
}
```

### 6. Maintain Tree Integrity

Always maintain valid tree structure:

```typescript
// Good: Check before adding children
if (blockRegistry.canHaveChild(parent.type, child.type)) {
  const child = engine.create({
    type: childType,
    data: childData,
    parentId: parent.id
  });
}

// Bad: Assuming all relationships are valid
```

---

## Error Handling

### Common Errors

1. **Block Not Found**
```typescript
try {
  const block = engine.get('non-existent-id');
} catch (error) {
  // Handle missing block
}
```

2. **Validation Errors**
```typescript
try {
  engine.create({
    type: BlockType.TEXT,
    data: {}  // Missing required 'content'
  });
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

3. **Invalid Parent-Child Relationship**
```typescript
try {
  engine.create({
    type: BlockType.KANBAN_BOARD,
    parentId: 'text-block-id'  // TEXT cannot have children
  });
} catch (error) {
  console.error('Invalid relationship:', error.message);
}
```

4. **Circular References**
```typescript
try {
  engine.move({
    id: 'parent-id',
    newParentId: 'child-id'  // Would create cycle
  });
} catch (error) {
  console.error('Circular reference prevented:', error.message);
}
```

5. **Delete with Children**
```typescript
try {
  engine.delete({
    id: 'parent-with-children-id'
  });
} catch (error) {
  console.error('Cannot delete:', error.message);
  // Either remove children first or use deleteChildren: true
}
```

### Error Recovery

```typescript
function safeCreate(params) {
  try {
    return engine.create(params);
  } catch (error) {
    console.error('Create failed:', error);
    
    // Attempt recovery
    const validationResult = blockRegistry.validate(
      params.type,
      params.data
    );
    
    if (!validationResult.valid) {
      console.error('Validation errors:', validationResult.errors);
      // Fix data and retry
    }
    
    return null;
  }
}
```

---

## Performance Considerations

### Batch Operations

When creating multiple blocks, minimize lookups:

```typescript
// Good: Create parent once
const parent = engine.create({
  type: BlockType.KANBAN_COLUMN,
  data: { name: 'Column' }
});

for (let i = 0; i < 100; i++) {
  engine.create({
    type: BlockType.KANBAN_CARD,
    data: { title: `Card ${i}` },
    parentId: parent.id  // Reuse parent ID
  });
}
```

### Query Optimization

Use specific queries instead of filtering all blocks:

```typescript
// Good: Query specific parent
const children = engine.query({ parentId: 'parent-id' });

// Less efficient: Get all then filter
const allBlocks = engine.query({});
const children = allBlocks.filter(b => b.parentId === 'parent-id');
```

### Memory Management

For large trees, consider clearing when done:

```typescript
// After processing
engine.clear();

// Or export and clear
const tree = engine.exportTree();
saveToStorage(tree);
engine.clear();
```

---

## Conclusion

The block CRUD operations provide a complete, type-safe API for managing block trees. All operations maintain tree integrity and follow the principle of least surprise. The system is designed for:

- **Safety**: Validation prevents invalid states
- **Consistency**: Tree structure is always valid
- **Performance**: Efficient operations on large trees
- **Flexibility**: Extensible for new block types

For more information, see [BLOCK_ARCHITECTURE.md](./BLOCK_ARCHITECTURE.md).
