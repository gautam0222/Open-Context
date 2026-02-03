/**
 * Core document interface representing a captured web page
 */
export interface Document {
  id: string;
  url: string;
  title: string;
  content?: string;
  excerpt?: string;
  createdAt: number;
  updatedAt?: number;
  metadata?: DocumentMetadata;
}

export interface DocumentMetadata {
  author?: string;
  description?: string;
  favicon?: string;
  image?: string;
  siteName?: string;
  wordCount?: number;
  readingTime?: number; // in minutes
}

/**
 * Text chunk for embedding
 */
export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  embedding?: number[];
  createdAt: number;
}

/**
 * Captured data from extension
 */
export interface CapturedData {
  url: string;
  title: string;
  selectedText?: string;
  timestamp: number;
  tabId?: number;
}

/**
 * Search query and results
 */
export interface SearchQuery {
  query: string;
  limit?: number;
  filters?: SearchFilters;
}

export interface SearchFilters {
  dateFrom?: number;
  dateTo?: number;
  domains?: string[];
}

export interface SearchResult {
  documentId: string;
  chunkId: string;
  content: string;
  url: string;
  title: string;
  similarity: number;
  highlights?: string[];
}