import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { generateId } from '@open-context/shared';
import path from 'path';
import fs from 'fs';

// Database file path
const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'open-context.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Created data directory');
}

let db: SqlJsDatabase;
let isInitialized = false;

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('📊 Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('📊 Created new database');
  }

  // Create tables
  initializeTables();
  isInitialized = true;
}

// Create tables
function initializeTables() {
  // Documents table
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      content TEXT,
      excerpt TEXT,
      author TEXT,
      site_name TEXT,
      favicon TEXT,
      word_count INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER
    )
  `);

  // Chunks table WITH EMBEDDING COLUMN
  db.run(`
    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      char_count INTEGER,
      embedding TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS highlights (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    text TEXT NOT NULL,
    color TEXT,
    position_start INTEGER,
    position_end INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    content TEXT NOT NULL,
    highlight_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY(highlight_id) REFERENCES highlights(id) ON DELETE CASCADE
  )
`);

// Entities table (concepts extracted from documents)
db.run(`
  CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
  )
`);

// Document-Entity relationships
db.run(`
  CREATE TABLE IF NOT EXISTS document_entities (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    context TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    UNIQUE(document_id, entity_id)
  )
`);

// Entity relationships (concept A relates to concept B)
db.run(`
  CREATE TABLE IF NOT EXISTS entity_relationships (
    id TEXT PRIMARY KEY,
    entity_a_id TEXT NOT NULL,
    entity_b_id TEXT NOT NULL,
    relationship_type TEXT,
    strength REAL DEFAULT 0.5,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(entity_a_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY(entity_b_id) REFERENCES entities(id) ON DELETE CASCADE,
    UNIQUE(entity_a_id, entity_b_id)
  )
`);

// Collections table
db.exec(`
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT '📁',
    parent_id TEXT,
    position INTEGER DEFAULT 0,
    is_smart BOOLEAN DEFAULT 0,
    smart_rules TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY(parent_id) REFERENCES collections(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_collections_parent ON collections(parent_id);
  CREATE INDEX IF NOT EXISTS idx_collections_position ON collections(position);
`);

// Document-Collection relationships (many-to-many)
db.exec(`
  CREATE TABLE IF NOT EXISTS collection_documents (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    position INTEGER DEFAULT 0,
    UNIQUE(collection_id, document_id),
    FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_collection_docs_collection ON collection_documents(collection_id);
  CREATE INDEX IF NOT EXISTS idx_collection_docs_document ON collection_documents(document_id);
`);

// Indexes for graph queries
db.run(`CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_doc_entities_doc ON document_entities(document_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_doc_entities_entity ON document_entities(entity_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_entity_rels_a ON entity_relationships(entity_a_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_entity_rels_b ON entity_relationships(entity_b_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_highlights_document ON highlights(document_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_notes_document ON notes(document_id)`);

  // Create indexes for documents
  db.run(`CREATE INDEX IF NOT EXISTS idx_url ON documents(url)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON documents(created_at DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_title ON documents(title)`);

  // Create indexes for chunks
  db.run(`CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_chunks_index ON chunks(document_id, chunk_index)`);

  // Save to disk
  saveDatabase();

  console.log('✅ Database tables initialized');
}

// Near the top of database.ts, after db is created:
export { db };

// Save database to disk
function saveDatabase() {
  if (!isInitialized) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Call init and wait for it
initDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

// Helper to ensure DB is ready
export function ensureDbReady(): Promise<void> {
  return new Promise((resolve) => {
    const checkReady = () => {
      if (isInitialized) {
        resolve();
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  });
}

// ==================== DOCUMENT OPERATIONS ====================

export interface DocumentRow {
  id: string;
  url: string;
  title: string | null;
  content: string | null;
  excerpt: string | null;
  author: string | null;
  site_name: string | null;
  favicon: string | null;
  word_count: number | null;
  created_at: number;
  updated_at: number | null;
}

export interface InsertDocumentData {
  id: string;
  url: string;
  title?: string;
  content?: string;
  excerpt?: string;
  author?: string;
  site_name?: string;
  favicon?: string;
  word_count?: number;
}

/**
 * Insert a new document
 */
export function insertDocument(data: InsertDocumentData): void {
  db.run(
    `
    INSERT INTO documents (
      id, url, title, content, excerpt, author, site_name, favicon, word_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      data.id,
      data.url,
      data.title || null,
      data.content || null,
      data.excerpt || null,
      data.author || null,
      data.site_name || null,
      data.favicon || null,
      data.word_count || null,
      Date.now(),
    ]
  );

  saveDatabase();
}

/**
 * Update an existing document
 */
export function updateDocument(id: string, data: Partial<InsertDocumentData>): void {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value || null);
    }
  });

  values.push(Date.now(), id);

  db.run(
    `UPDATE documents SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`,
    values
  );

  saveDatabase();
}

/**
 * Get document by ID
 */
export function getDocumentById(id: string): DocumentRow | null {
  const result = db.exec('SELECT * FROM documents WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;

  return rowToDocument(result[0].columns, result[0].values[0]);
}

/**
 * Get document by URL
 */
export function getDocumentByUrl(url: string): DocumentRow | null {
  const result = db.exec('SELECT * FROM documents WHERE url = ?', [url]);
  if (result.length === 0 || result[0].values.length === 0) return null;

  return rowToDocument(result[0].columns, result[0].values[0]);
}

/**
 * Get all documents (with pagination)
 */
export function getAllDocuments(limit = 100, offset = 0): DocumentRow[] {
  const result = db.exec(
    'SELECT * FROM documents ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => rowToDocument(result[0].columns, row));
}

/**
 * Get total document count
 */
export function getDocumentCount(): number {
  const result = db.exec('SELECT COUNT(*) as count FROM documents');
  if (result.length === 0) return 0;
  return Number(result[0].values[0][0]) || 0;
}

/**
 * Delete document by ID
 */
export function deleteDocument(id: string): void {
  db.run('DELETE FROM documents WHERE id = ?', [id]);
  saveDatabase();
}

/**
 * Search documents by title or content
 */
export function searchDocuments(query: string, limit = 20): DocumentRow[] {
  const searchPattern = `%${query}%`;
  const result = db.exec(
    `SELECT * FROM documents 
     WHERE title LIKE ? OR content LIKE ?
     ORDER BY created_at DESC LIMIT ?`,
    [searchPattern, searchPattern, limit]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => rowToDocument(result[0].columns, row));
}

/**
 * Get database statistics
 */
export function getDatabaseStats() {
  const totalDocs = getDocumentCount();

  let totalWords = 0;
  let avgWords = 0;

  const totalResult = db.exec('SELECT SUM(word_count) as total FROM documents');
  if (totalResult.length > 0 && totalResult[0].values.length > 0) {
    totalWords = Number(totalResult[0].values[0][0]) || 0;
  }

  const avgResult = db.exec('SELECT AVG(word_count) as average FROM documents');
  if (avgResult.length > 0 && avgResult[0].values.length > 0) {
    avgWords = Math.round(Number(avgResult[0].values[0][0]) || 0);
  }

  return {
    totalDocuments: totalDocs,
    totalWords: totalWords,
    averageWords: avgWords,
  };
}

/**
 * Helper: Convert SQL row to DocumentRow object
 */
function rowToDocument(
  columns: string[],
  values: (string | number | null | Uint8Array)[]
): DocumentRow {
  const row: Record<string, any> = {};

  columns.forEach((col, idx) => {
    const value = values[idx];
    row[col] = value instanceof Uint8Array ? null : value;
  });

  return {
    id: row.id as string,
    url: row.url as string,
    title: row.title ?? null,
    content: row.content ?? null,
    excerpt: row.excerpt ?? null,
    author: row.author ?? null,
    site_name: row.site_name ?? null,
    favicon: row.favicon ?? null,
    word_count:
      row.word_count !== null && row.word_count !== undefined
        ? Number(row.word_count)
        : null,
    created_at: Number(row.created_at),
    updated_at:
      row.updated_at !== null && row.updated_at !== undefined
        ? Number(row.updated_at)
        : null,
  };
}


/**
 * Close database (save final state)
 */
export function closeDatabase(): void {
  saveDatabase();
  db.close();
  console.log('📊 Database connection closed');
}

// ==================== CHUNK OPERATIONS ====================

export interface ChunkRow {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  char_count: number | null;
  embedding: string | null; // JSON string of the embedding array
  created_at: number;
}

export interface InsertChunkData {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  char_count?: number;
  embedding?: number[]; // Array of numbers
}

/**
 * Insert a chunk
 */
export function insertChunk(data: InsertChunkData): void {
  db.run(
    `
    INSERT INTO chunks (
      id, document_id, content, chunk_index, char_count, embedding, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    [
      data.id,
      data.document_id,
      data.content,
      data.chunk_index,
      data.char_count || null,
      data.embedding ? JSON.stringify(data.embedding) : null,
      Date.now(),
    ]
  );

  saveDatabase();
}

export function insertChunks(chunks: InsertChunkData[]): void {
  chunks.forEach((chunk) => {
    db.run(
      `
      INSERT INTO chunks (
        id, document_id, content, chunk_index, char_count, embedding, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        chunk.id,
        chunk.document_id,
        chunk.content,
        chunk.chunk_index,
        chunk.char_count || null,
        chunk.embedding ? JSON.stringify(chunk.embedding) : null,
        Date.now(),
      ]
    );
  });

  saveDatabase();
}

/**
 * Get all chunks for a document
 */
export function getChunksByDocumentId(documentId: string): ChunkRow[] {
  const result = db.exec(
    'SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index ASC',
    [documentId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => rowToChunk(result[0].columns, row));
}

/**
 * Get chunk count for a document
 */
export function getChunkCountByDocumentId(documentId: string): number {
  const result = db.exec('SELECT COUNT(*) as count FROM chunks WHERE document_id = ?', [
    documentId,
  ]);
  if (result.length === 0) return 0;
  return Number(result[0].values[0][0]) || 0;
}

/**
 * Get total chunk count
 */
export function getTotalChunkCount(): number {
  const result = db.exec('SELECT COUNT(*) as count FROM chunks');
  if (result.length === 0) return 0;
  return Number(result[0].values[0][0]) || 0;
}

/**
 * Delete all chunks for a document
 */
export function deleteChunksByDocumentId(documentId: string): void {
  db.run('DELETE FROM chunks WHERE document_id = ?', [documentId]);
  saveDatabase();
}

/**
 * Helper: Convert SQL row to ChunkRow object
 */
function rowToChunk(
  columns: string[],
  values: (string | number | null | Uint8Array)[]
): ChunkRow {
  const chunk: Record<string, string | number | null> = {};
  columns.forEach((col, idx) => {
    const value = values[idx];
    chunk[col] = value instanceof Uint8Array ? null : value;
  });
  return chunk as unknown as ChunkRow;
}

/**
 * Execute raw SQL (read-only use recommended)
 */
export function exec(sql: string, params?: any[]) {
  return db.exec(sql, params);
}

// ==================== HIGHLIGHTS OPERATIONS ====================

export interface HighlightRow {
  id: string;
  document_id: string;
  text: string;
  color: string | null;
  position_start: number;
  position_end: number;
  created_at: number;
}

export interface InsertHighlightData {
  id: string;
  document_id: string;
  text: string;
  color?: string;
  position_start: number;
  position_end: number;
}

// ============= COLLECTIONS =============

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  parent_id: string | null;
  position: number;
  is_smart: number;
  smart_rules: string | null;
  created_at: number;
  updated_at: number | null;
}

export interface InsertCollection {
  id: string;
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  parent_id?: string | null;
  position?: number;
  is_smart?: number;
  smart_rules?: string | null;
  created_at: number;
}

export interface CollectionDocument {
  id: string;
  collection_id: string;
  document_id: string;
  added_at: number;
  position: number;
}

/**
 * Insert a new collection
 */
export function insertCollection(collection: InsertCollection): void {
  const stmt = db.prepare(`
    INSERT INTO collections (
      id, name, description, color, icon, parent_id, position, 
      is_smart, smart_rules, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    collection.id,
    collection.name,
    collection.description || null,
    collection.color || '#6366f1',
    collection.icon || '📁',
    collection.parent_id || null,
    collection.position || 0,
    collection.is_smart || 0,
    collection.smart_rules || null,
    collection.created_at,
  ]);
}

/**
 * Get all collections
 */
export function getAllCollections(): Collection[] {
  const result = db.exec('SELECT * FROM collections ORDER BY position ASC, created_at DESC');
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as Collection;
  });
}

/**
 * Get collection by ID
 */
export function getCollectionById(id: string): Collection | null {
  const result = db.exec('SELECT * FROM collections WHERE id = ?', [id]);
  
  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const obj: any = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj as Collection;
}

/**
 * Get child collections (subcollections)
 */
export function getChildCollections(parentId: string | null): Collection[] {
  const query = parentId 
    ? 'SELECT * FROM collections WHERE parent_id = ? ORDER BY position ASC'
    : 'SELECT * FROM collections WHERE parent_id IS NULL ORDER BY position ASC';
  
  const result = parentId 
    ? db.exec(query, [parentId])
    : db.exec(query);
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as Collection;
  });
}

/**
 * Update collection
 */
export function updateCollection(id: string, updates: Partial<Collection>): void {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  const stmt = db.prepare(`UPDATE collections SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(values);
}

/**
 * Delete collection (and all subcollections)
 */
export function deleteCollection(id: string): void {
  db.exec('DELETE FROM collections WHERE id = ?', [id]);
}

/**
 * Add document to collection
 */

/**
 * Generate unique ID with prefix
 */

export function addDocumentToCollection(collectionId: string, documentId: string): void {
  const id = generateId('col_doc');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO collection_documents (id, collection_id, document_id, added_at, position)
    VALUES (?, ?, ?, ?, 0)
  `);

  stmt.run([id, collectionId, documentId, Date.now()]);
}

/**
 * Remove document from collection
 */
export function removeDocumentFromCollection(collectionId: string, documentId: string): void {
  db.exec(
    'DELETE FROM collection_documents WHERE collection_id = ? AND document_id = ?',
    [collectionId, documentId]
  );
}

/**
 * Get documents in a collection
 */
export function getCollectionDocuments(collectionId: string): Document[] {
  const result = db.exec(`
    SELECT d.* FROM documents d
    INNER JOIN collection_documents cd ON d.id = cd.document_id
    WHERE cd.collection_id = ?
    ORDER BY cd.position ASC, cd.added_at DESC
  `, [collectionId]);
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as Document;
  });
}

/**
 * Get collections containing a document
 */
export function getDocumentCollections(documentId: string): Collection[] {
  const result = db.exec(`
    SELECT c.* FROM collections c
    INNER JOIN collection_documents cd ON c.id = cd.collection_id
    WHERE cd.document_id = ?
    ORDER BY c.name ASC
  `, [documentId]);
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as Collection;
  });
}

/**
 * Get collection statistics
 */
export function getCollectionStats(collectionId: string): {
  documentCount: number;
  totalWords: number;
  lastUpdated: number | null;
} {
  const countResult = db.exec(
    'SELECT COUNT(*) as count FROM collection_documents WHERE collection_id = ?',
    [collectionId]
  );

  const wordsResult = db.exec(`
    SELECT SUM(d.word_count) as total_words, MAX(cd.added_at) as last_updated
    FROM documents d
    INNER JOIN collection_documents cd ON d.id = cd.document_id
    WHERE cd.collection_id = ?
  `, [collectionId]);

  const documentCount = countResult[0]?.values[0]?.[0] as number || 0;
  const totalWords = wordsResult[0]?.values[0]?.[0] as number || 0;
  const lastUpdated = wordsResult[0]?.values[0]?.[1] as number || null;

  return {
    documentCount,
    totalWords,
    lastUpdated,
  };
}

export function insertHighlight(data: InsertHighlightData): void {
  db.run(
    `INSERT INTO highlights (id, document_id, text, color, position_start, position_end, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.document_id,
      data.text,
      data.color || 'yellow',
      data.position_start,
      data.position_end,
      Date.now(),
    ]
  );
  saveDatabase();
}

export function getHighlightsByDocumentId(documentId: string): HighlightRow[] {
  const result = db.exec(
    'SELECT * FROM highlights WHERE document_id = ? ORDER BY position_start ASC',
    [documentId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as HighlightRow;
  });
}

export function deleteHighlight(id: string): void {
  db.run('DELETE FROM highlights WHERE id = ?', [id]);
  saveDatabase();
}

// ==================== NOTES OPERATIONS ====================

export interface NoteRow {
  id: string;
  document_id: string;
  content: string;
  highlight_id: string | null;
  created_at: number;
  updated_at: number | null;
}

export interface InsertNoteData {
  id: string;
  document_id: string;
  content: string;
  highlight_id?: string;
}

export function insertNote(data: InsertNoteData): void {
  db.run(
    `INSERT INTO notes (id, document_id, content, highlight_id, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [data.id, data.document_id, data.content, data.highlight_id || null, Date.now()]
  );
  saveDatabase();
}

export function getNotesByDocumentId(documentId: string): NoteRow[] {
  const result = db.exec(
    'SELECT * FROM notes WHERE document_id = ? ORDER BY created_at DESC',
    [documentId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as NoteRow;
  });
}

export function updateNote(id: string, content: string): void {
  db.run('UPDATE notes SET content = ?, updated_at = ? WHERE id = ?', [
    content,
    Date.now(),
    id,
  ]);
  saveDatabase();
}

export function deleteNote(id: string): void {
  db.run('DELETE FROM notes WHERE id = ?', [id]);
  saveDatabase();
}

// ==================== ENTITIES OPERATIONS ====================

export interface EntityRow {
  id: string;
  name: string;
  type: string;
  frequency: number;
  created_at: number;
}

export interface InsertEntityData {
  id: string;
  name: string;
  type: string;
  frequency?: number;
}

export function insertEntity(data: InsertEntityData): void {
  db.run(
    `INSERT OR IGNORE INTO entities (id, name, type, frequency, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [data.id, data.name, data.type, data.frequency || 1, Date.now()]
  );
  saveDatabase();
}

export function getEntityByName(name: string): EntityRow | null {
  const result = db.exec('SELECT * FROM entities WHERE LOWER(name) = LOWER(?)', [name]);
  if (result.length === 0 || result[0].values.length === 0) return null;

  const row = result[0].values[0];
  const obj: any = {};
  result[0].columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return obj as EntityRow;
}

export function getAllEntities(limit: number = 1000): EntityRow[] {
  const result = db.exec(
    `SELECT * FROM entities ORDER BY frequency DESC LIMIT ?`,
    [limit]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as EntityRow;
  });
}

export function incrementEntityFrequency(entityId: string): void {
  db.run('UPDATE entities SET frequency = frequency + 1 WHERE id = ?', [entityId]);
  saveDatabase();
}

// ==================== DOCUMENT-ENTITY RELATIONSHIPS ====================

export interface DocumentEntityRow {
  id: string;
  document_id: string;
  entity_id: string;
  frequency: number;
  context: string | null;
  created_at: number;
}

export interface InsertDocumentEntityData {
  id: string;
  document_id: string;
  entity_id: string;
  frequency?: number;
  context?: string;
}

export function insertDocumentEntity(data: InsertDocumentEntityData): void {
  db.run(
    `INSERT OR REPLACE INTO document_entities (id, document_id, entity_id, frequency, context, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.document_id,
      data.entity_id,
      data.frequency || 1,
      data.context || null,
      Date.now(),
    ]
  );
  saveDatabase();
}

export function getDocumentEntities(documentId: string): DocumentEntityRow[] {
  const result = db.exec(
    'SELECT * FROM document_entities WHERE document_id = ? ORDER BY frequency DESC',
    [documentId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as DocumentEntityRow;
  });
}

export function getEntityDocuments(entityId: string): DocumentEntityRow[] {
  const result = db.exec(
    'SELECT * FROM document_entities WHERE entity_id = ? ORDER BY frequency DESC',
    [entityId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as DocumentEntityRow;
  });
}

// ==================== ENTITY RELATIONSHIPS ====================

export interface EntityRelationshipRow {
  id: string;
  entity_a_id: string;
  entity_b_id: string;
  relationship_type: string | null;
  strength: number;
  created_at: number;
}

export interface InsertEntityRelationshipData {
  id: string;
  entity_a_id: string;
  entity_b_id: string;
  relationship_type?: string;
  strength?: number;
}

export function insertEntityRelationship(data: InsertEntityRelationshipData): void {
  db.run(
    `INSERT OR REPLACE INTO entity_relationships (id, entity_a_id, entity_b_id, relationship_type, strength, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.entity_a_id,
      data.entity_b_id,
      data.relationship_type || 'related_to',
      data.strength || 0.5,
      Date.now(),
    ]
  );
  saveDatabase();
}

export function getEntityRelationships(entityId: string): EntityRelationshipRow[] {
  const result = db.exec(
    `SELECT * FROM entity_relationships 
     WHERE entity_a_id = ? OR entity_b_id = ?
     ORDER BY strength DESC`,
    [entityId, entityId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as EntityRelationshipRow;
  });
}

export function getAllEntityRelationships(limit: number = 1000): EntityRelationshipRow[] {
  const result = db.exec(
    `SELECT * FROM entity_relationships ORDER BY strength DESC LIMIT ?`,
    [limit]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as EntityRelationshipRow;
  });
}

// Update exports
export default {
  insertDocument,
  updateDocument,
  getDocumentById,
  getDocumentByUrl,
  getAllDocuments,
  getDocumentCount,
  deleteDocument,
  searchDocuments,
  getDatabaseStats,
  closeDatabase,
  insertChunk,
  insertChunks,
  getChunksByDocumentId,
  getChunkCountByDocumentId,
  getTotalChunkCount,
  deleteChunksByDocumentId,
  insertHighlight,
  getHighlightsByDocumentId,
  deleteHighlight,
  insertNote,
  getNotesByDocumentId,
  updateNote,
  deleteNote,
  insertEntity,
  getEntityByName,
  getAllEntities,
  incrementEntityFrequency,
  insertDocumentEntity,
  getDocumentEntities,
  getEntityDocuments,
  insertEntityRelationship,
  getEntityRelationships,
  getAllEntityRelationships,
};
