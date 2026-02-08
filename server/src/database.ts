import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
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
};