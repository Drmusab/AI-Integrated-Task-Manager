# Knowledge Vault - Unified Obsidian-Style Knowledge Management

## Overview

The Knowledge Vault is a unified, Obsidian-style knowledge management system that integrates all existing knowledge modules (Thoughts, Ideas, Notes, Writing/Research, Utilities) into one cohesive vault with PARA (Projects, Areas, Resources, Archives) organization.

## Architecture

### Backend Components

1. **Knowledge Vault Service** (`backend/src/services/knowledgeVault.ts`)
   - Unified data model for all knowledge entities
   - PARA categorization system
   - Full-text search across all content
   - Cross-module linking and relationships
   - Data migration from existing modules

2. **API Routes** (`backend/src/routes/knowledgeVault.ts`)
   - RESTful API for vault operations
   - CRUD operations for vault items
   - Link management between items
   - Search and statistics endpoints
   - Migration endpoint for existing data

3. **Database Schema**
   - `vault_items` table: Unified storage for all knowledge entities
   - `vault_links` table: Relationships between vault items
   - Indexed for performance on type, PARA category, folder path, and user

### Frontend Components

1. **Knowledge Vault Page** (`frontend/src/pages/KnowledgeVault.tsx`)
   - Unified interface for all knowledge items
   - PARA-based filtering and organization
   - Grid and list view modes
   - Full-text search
   - Rich item creation and editing

2. **Vault Service** (`frontend/src/services/vaultService.ts`)
   - API client for vault operations
   - TypeScript interfaces for type safety

### Integration

The vault integrates into the main application:
- Added to `backend/src/app.ts` as `/api/vault` endpoint
- Added to `frontend/src/App.tsx` as `/vault` route
- Added to navigation bar with AccountTree icon

## Features

### 1. Unified Data Model

All knowledge entities are represented as `VaultItem`:
- **Type**: Note, Thought, Idea, Article, Research, Quote, Word, Sticky Note, Task, Pomodoro
- **Title**: Item title
- **Content**: Full markdown content
- **PARA Category**: Project, Area, Resource, or Archive
- **Folder Path**: Hierarchical organization
- **Tags**: Flexible categorization
- **Metadata**: Type-specific additional data
- **Links**: Relationships to other vault items

### 2. PARA Method Organization

Based on Tiago Forte's PARA method:
- **Projects**: Short-term goals with deadlines
- **Areas**: Long-term responsibilities
- **Resources**: Reference materials and knowledge
- **Archives**: Completed or inactive items

### 3. Cross-Module Linking

Vault items can be linked across different types:
- Reference links between items
- Related content connections
- Parent-child relationships
- Wiki-style bidirectional links

### 4. Full-Text Search

Search across:
- Titles
- Content
- Tags
- Metadata

### 5. Data Migration

Preserves existing data while creating unified vault:
- Migrates thoughts from Thought Organizer
- Migrates ideas from Ideas Tracker
- Migrates articles and research from Writing Hub
- Migrates quotes and words from Utilities
- Migrates notes from Obsidian Notes system
- Original data remains intact in source tables

## API Endpoints

### Vault Items

- `GET /api/vault/items` - List vault items with filters
- `GET /api/vault/items/:id` - Get specific item
- `POST /api/vault/items` - Create new item
- `PUT /api/vault/items/:id` - Update item
- `DELETE /api/vault/items/:id` - Delete item

### Links

- `POST /api/vault/links` - Create link between items
- `GET /api/vault/items/:id/links` - Get item links
- `DELETE /api/vault/links/:id` - Delete link

### Search & Stats

- `GET /api/vault/search?q=query` - Search vault
- `GET /api/vault/stats` - Get statistics

### Migration

- `POST /api/vault/initialize` - Initialize vault tables
- `POST /api/vault/migrate` - Migrate existing data

## Usage

### Creating a Vault Item

```typescript
import { createVaultItem } from '../services/vaultService';

const item = await createVaultItem({
  type: 'note',
  title: 'My First Note',
  content: 'This is the content of my note',
  para_category: 'resource',
  folder_path: 'Knowledge/Programming',
  tags: ['typescript', 'web-development'],
  metadata: {
    source: 'documentation',
  },
});
```

### Searching the Vault

```typescript
import { searchVault } from '../services/vaultService';

const results = await searchVault('typescript programming');
```

### Migrating Existing Data

```typescript
import { migrateToVault } from '../services/vaultService';

const result = await migrateToVault();
console.log(`Migrated ${result.migrated} items`);
```

## Data Model

### VaultItem Interface

```typescript
interface VaultItem {
  id: string;                        // UUID
  type: VaultItemType;               // note, thought, idea, etc.
  title: string;                     // Item title
  content: string;                   // Markdown content
  para_category: PARACategory | null; // PARA classification
  folder_path: string | null;        // Hierarchical path
  tags: string[];                    // Tags array
  metadata: Record<string, any>;     // Type-specific data
  linked_items: string[];            // Related item IDs
  created_by: number;                // User ID
  created_at: string;                // ISO timestamp
  updated_at: string;                // ISO timestamp
  source_table: string;              // Original table
  source_id: string;                 // Original ID
}
```

### VaultLink Interface

```typescript
interface VaultLink {
  id: string;                        // UUID
  source_id: string;                 // Source item ID
  target_id: string;                 // Target item ID
  link_type: 'reference' | 'related' | 'parent' | 'child' | 'wikilink';
  created_at: string;                // ISO timestamp
}
```

## Benefits

1. **Unified Interface**: Single location for all knowledge
2. **Better Organization**: PARA method for systematic categorization
3. **Enhanced Discovery**: Cross-module search and linking
4. **Consistent Experience**: Same UI/UX for all knowledge types
5. **Backward Compatible**: Existing modules still function
6. **Scalable**: Easy to add new knowledge types
7. **Flexible**: Multiple organization methods (PARA, folders, tags)

## Future Enhancements

Potential improvements:
- Graph view of vault connections
- AI-powered suggestions for categorization
- Automatic tagging using NLP
- Daily note templates with PARA integration
- Export vault to markdown files
- Import from other note-taking apps
- Collaborative vault sharing
- Version history for vault items
- Smart folders based on queries
- Calendar integration for time-based organization

## Migration Guide

### Step 1: Initialize Vault
Navigate to `/vault` and the tables will be auto-created on first API call.

### Step 2: Migrate Data
Click "Migrate Data" button in the Knowledge Vault page to move existing data.

### Step 3: Organize with PARA
Review migrated items and assign PARA categories as appropriate.

### Step 4: Create Links
Add connections between related items for better knowledge graph.

### Step 5: Continue Using
Both original modules and vault work simultaneously. Gradually transition to vault-centric workflow.

## Troubleshooting

### Migration Issues
- Check browser console for specific errors
- Ensure all source modules have data
- Large datasets may take longer to migrate

### Search Not Working
- Verify items have content
- Check that search query is not empty
- Try simpler search terms

### Links Not Appearing
- Ensure both items exist in vault
- Verify you own the source item
- Check link was created successfully

## Technical Notes

### Database Migrations
The vault tables are created automatically on first initialization. No manual migration needed.

### Performance
- Indexed on frequently queried columns
- Pagination support for large datasets
- Efficient search with SQLite FTS (future enhancement)

### Security
- User-based access control
- Items are private to creating user
- Links require ownership of source item

## Conclusion

The Knowledge Vault unifies all knowledge management modules into one cohesive system, making it easier to organize, find, and connect information using the proven PARA method and Obsidian-style linking.
