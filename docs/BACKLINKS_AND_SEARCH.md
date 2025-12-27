# Phase C & D Implementation - Backlinks and Unified Search

## Overview

This implementation adds two major features to the Obsidian-style notes system:

1. **Phase C - Backlinks with Context Snippets**: Provides an Obsidian-like experience by showing where each backlink appears in its source note with 40-80 character context snippets.

2. **Phase D - Unified Search**: Enables global search across both notes and tasks, powering a future command palette / quick switcher experience.

## Phase C: Backlinks with Context Snippets

### Features

- **Instant Backlinks Display**: When a note is opened, all notes linking to it are shown with context
- **Context Snippets**: Each backlink includes surrounding text showing where the link appears
- **Performance Optimized**: Uses indexed lookup (O(n) over backlinks only, no full note scans)
- **Smart Fallbacks**: Falls back to note title if snippet extraction fails

### API Endpoints

#### Get Backlinks with Snippets
```
GET /api/obsidian-notes/:id/backlinks
```

**Response:**
```json
[
  {
    "sourceNoteId": "uuid-123",
    "sourceNoteTitle": "Meeting Notes",
    "linkType": "wikilink",
    "snippet": "...discussed the [[Project Plan]] in detail and...",
    "position": 145
  }
]
```

#### Get Note with Backlinks
```
GET /api/obsidian-notes/:id/with-backlinks
```

**Response:**
```json
{
  "id": "uuid-456",
  "title": "Project Plan",
  "contentMarkdown": "...",
  "backlinks": [
    {
      "sourceNoteId": "uuid-123",
      "sourceNoteTitle": "Meeting Notes",
      "linkType": "wikilink",
      "snippet": "...discussed the [[Project Plan]] in detail..."
    }
  ]
}
```

### Code Usage

```typescript
import { noteService } from './services/noteService';

// Get backlinks with snippets for a note
const backlinks = await noteService.getBacklinksWithSnippets(noteId);

// Get note with all backlink snippets
const noteWithBacklinks = await noteService.getNoteWithBacklinkSnippets(noteId);
```

### Snippet Extraction Utilities

```typescript
import {
  extractSnippet,
  extractWikilinkSnippet,
  extractSearchSnippet,
} from './utils/snippetExtractor';

// Extract snippet around a position
const snippet = extractSnippet(text, position, length, contextChars);

// Extract snippet around a wikilink
const wikilinkSnippet = extractWikilinkSnippet(
  markdown,
  'Note Title',
  'Fallback'
);

// Extract snippet around search term
const searchSnippet = extractSearchSnippet(text, 'search term');
```

## Phase D: Unified Search

### Features

- **Unified Results**: Search across both notes and tasks in a single query
- **Smart Ranking**: Title matches ranked higher than body matches
- **Related Entities**: Automatically discovers and includes related notes/tasks
- **Performance**: Responds in <100ms even with 200+ documents
- **Type Filtering**: Can filter to search only notes or only tasks

### API Endpoints

#### Unified Search
```
GET /api/obsidian-notes/search/unified?q=project&limit=20&includeRelated=true
```

**Response:**
```json
{
  "query": "project",
  "results": [
    {
      "id": "uuid-789",
      "type": "note",
      "title": "Project Plan",
      "snippet": "Project Plan for Q1",
      "score": 100,
      "related": {
        "tasks": ["1", "2", "3"]
      }
    },
    {
      "id": "42",
      "type": "task",
      "title": "Review project proposal",
      "snippet": "Review project proposal by Friday",
      "score": 100,
      "related": {
        "notes": ["uuid-789"]
      }
    }
  ],
  "total": 2
}
```

#### Quick Search
```
GET /api/obsidian-notes/search/quick?q=meeting
```

Returns top 10 results without related entities for fast command palette usage.

**Response:**
```json
{
  "query": "meeting",
  "results": [
    {
      "id": "uuid-123",
      "type": "note",
      "title": "Meeting Notes",
      "snippet": "Meeting Notes from Monday",
      "score": 100
    }
  ]
}
```

### Code Usage

```typescript
import { unifiedSearchService } from './services/unifiedSearchService';

// Unified search with all options
const results = await unifiedSearchService.search('project', {
  limit: 20,
  offset: 0,
  types: ['note', 'task'],
  includeRelated: true,
});

// Quick search (top 10, no related entities)
const quickResults = await unifiedSearchService.quickSearch('meeting');

// Search only notes
const noteResults = await unifiedSearchService.searchNotesOnly('keyword');

// Search only tasks
const taskResults = await unifiedSearchService.searchTasksOnly('keyword');
```

### Search Options

```typescript
interface UnifiedSearchOptions {
  limit?: number;          // Max results (default: 50)
  offset?: number;         // Pagination offset (default: 0)
  types?: Array<'note' | 'task'>;  // Filter by type
  includeRelated?: boolean; // Include related entities (default: true)
}
```

### Ranking Algorithm

The search uses a simple but effective ranking system:

1. **Title matches** score 100 points
2. **Content/description matches** score 50 points
3. Results sorted by score (descending)
4. Equal scores: notes appear before tasks

## Performance Characteristics

### Backlinks
- **Query Type**: Indexed lookup by `targetNoteId`
- **Time Complexity**: O(n) where n = number of backlinks
- **Measured Performance**: <200ms for 50 backlinks
- **No Full Scans**: Only queries backlinks table, doesn't scan all notes

### Unified Search
- **Query Type**: Parallel search across notes and tasks tables
- **Measured Performance**: <100ms for 200+ documents
- **Optimization**: Uses LIKE queries with score calculation in SQL
- **Related Entities**: Separate queries, only when requested

## Testing

### Test Coverage

- **Snippet Extraction**: 21 tests covering all edge cases
- **Backlinks**: 4 tests including performance validation
- **Unified Search**: 8 tests including ranking and performance
- **Total New Tests**: 33
- **Existing Tests**: 20 (all still passing)
- **Overall**: 53/53 tests passing ✅

### Performance Tests

Both features include performance tests to ensure they meet the requirements:

```typescript
// Backlinks performance test (50 backlinks)
test('backlinks query uses indexed lookup (performance)', async () => {
  // ... create 50 notes with backlinks
  const startTime = Date.now();
  const backlinks = await noteService.getBacklinksWithSnippets(targetId);
  const duration = Date.now() - startTime;
  
  expect(duration).toBeLessThan(200); // < 200ms
});

// Search performance test (200 documents)
test('search performs well with many documents', async () => {
  // ... create 100 notes + 100 tasks
  const startTime = Date.now();
  const results = await searchService.search('special');
  const duration = Date.now() - startTime;
  
  expect(duration).toBeLessThan(100); // < 100ms
});
```

## Database Schema

Both features use existing database tables with proper indexes:

### Indexed Fields (Already in place)
- `obsidian_note_links.target_note_id` - For backlinks lookup
- `obsidian_note_links.source_note_id` - For related entity discovery
- `obsidian_task_note_relations.note_id` - For task-note relations
- `obsidian_task_note_relations.task_id` - For task-note relations

No schema changes were required!

## Exit Criteria ✅

### Phase C - Backlinks
- ✅ Opening a note instantly shows backlinks
- ✅ Backlinks feel "alive" and contextual (with snippets)
- ✅ No noticeable performance hit
- ✅ Obsidian-like navigation achieved with minimal code

### Phase D - Unified Search
- ✅ One search box finds everything
- ✅ Notes and tasks feel connected
- ✅ Related items appear naturally
- ✅ Foundation ready for:
  - Command palette
  - Graph search
  - AI-powered retrieval

## Future Enhancements

While the current implementation satisfies all requirements, potential enhancements include:

1. **FTS5 for Search**: Upgrade to SQLite FTS5 for even faster full-text search
2. **Graph View**: Build on backlinks to create a visual knowledge graph
3. **Smart Ranking**: ML-based ranking considering recency, popularity, etc.
4. **Fuzzy Search**: Add fuzzy matching for typo tolerance
5. **Search Filters**: Add date ranges, tags, and other metadata filters

## Security

- ✅ CodeQL scan: No vulnerabilities found
- ✅ No SQL injection (uses parameterized queries)
- ✅ No XSS risk (snippets are plain text, not rendered HTML)
- ✅ Input validation on all API endpoints
