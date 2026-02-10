import { getChunksByDocumentId, getAllDocuments } from './database';

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  documentUrl: string;
  content: string;
  similarity: number;
  chunkIndex: number;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    console.warn('Vector lengths do not match');
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Get embedding for a query text
 */
async function getQueryEmbedding(query: string): Promise<number[]> {
  try {
    const response = await fetch('http://localhost:5000/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query }),
    });

    if (!response.ok) {
      throw new Error(`Embedding server error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('❌ Failed to get query embedding:', error);
    throw new Error('Embedding server is not running. Start it with: python scripts/embedding_server.py');
  }
}

/**
 * Search for similar chunks using semantic similarity
 */
export async function searchSimilarChunks(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  console.log(`🔍 Searching for: "${query}" (limit: ${limit})`);

  // Get query embedding
  const queryEmbedding = await getQueryEmbedding(query);

  // Get all documents
  const documents = getAllDocuments(1000);

  if (documents.length === 0) {
    console.log('⚠️ No documents found');
    return [];
  }

  console.log(`📚 Searching across ${documents.length} documents...`);

  // Collect all chunks with similarities
  const allResults: SearchResult[] = [];

  for (const doc of documents) {
    const chunks = getChunksByDocumentId(doc.id);

    for (const chunk of chunks) {
      if (!chunk.embedding) {
        console.warn(`⚠️ Chunk ${chunk.id} has no embedding`);
        continue;
      }

      try {
        const chunkEmbedding = JSON.parse(chunk.embedding);
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

        allResults.push({
          chunkId: chunk.id,
          documentId: doc.id,
          documentTitle: doc.title || 'Untitled',
          documentUrl: doc.url,
          content: chunk.content,
          similarity: similarity,
          chunkIndex: chunk.chunk_index,
        });
      } catch (error) {
        console.error(`❌ Error processing chunk ${chunk.id}:`, error);
      }
    }
  }

  // Sort by similarity (highest first) and limit results
  const topResults = allResults
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  console.log(`✅ Found ${topResults.length} results (best match: ${(topResults[0]?.similarity * 100 || 0).toFixed(1)}%)`);

  return topResults;
}

/**
 * Search with filters and options
 */
export interface SearchOptions {
  query: string;
  limit?: number;
  minSimilarity?: number;
  documentIds?: string[];
  dateFrom?: number;
  dateTo?: number;
}

export async function advancedSearch(options: SearchOptions): Promise<SearchResult[]> {
  const {
    query,
    limit = 10,
    minSimilarity = 0.0,
    documentIds,
    dateFrom,
    dateTo,
  } = options;

  console.log(`🔍 Advanced search:`, options);

  // Get query embedding
  const queryEmbedding = await getQueryEmbedding(query);

  // Get documents (filtered if needed)
  let documents = getAllDocuments(1000);

  // Filter by document IDs if provided
  if (documentIds && documentIds.length > 0) {
    documents = documents.filter(doc => documentIds.includes(doc.id));
  }

  // Filter by date range if provided
  if (dateFrom !== undefined) {
    documents = documents.filter(doc => doc.created_at >= dateFrom);
  }
  if (dateTo !== undefined) {
    documents = documents.filter(doc => doc.created_at <= dateTo);
  }

  if (documents.length === 0) {
    console.log('⚠️ No documents match the filters');
    return [];
  }

  console.log(`📚 Searching across ${documents.length} filtered documents...`);

  // Collect all chunks with similarities
  const allResults: SearchResult[] = [];

  for (const doc of documents) {
    const chunks = getChunksByDocumentId(doc.id);

    for (const chunk of chunks) {
      if (!chunk.embedding) continue;

      try {
        const chunkEmbedding = JSON.parse(chunk.embedding);
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

        // Filter by minimum similarity
        if (similarity < minSimilarity) continue;

        allResults.push({
          chunkId: chunk.id,
          documentId: doc.id,
          documentTitle: doc.title || 'Untitled',
          documentUrl: doc.url,
          content: chunk.content,
          similarity: similarity,
          chunkIndex: chunk.chunk_index,
        });
      } catch (error) {
        console.error(`❌ Error processing chunk ${chunk.id}:`, error);
      }
    }
  }

  // Sort by similarity and limit
  const topResults = allResults
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  console.log(`✅ Found ${topResults.length} results`);

  return topResults;
}

/**
 * Get similar documents to a given document
 */
export async function getSimilarDocuments(
  documentId: string,
  limit: number = 5
): Promise<Array<{ documentId: string; documentTitle: string; similarity: number }>> {
  console.log(`🔗 Finding documents similar to ${documentId}...`);

  const sourceChunks = getChunksByDocumentId(documentId);
  
  if (sourceChunks.length === 0 || !sourceChunks[0].embedding) {
    console.warn('⚠️ Source document has no embeddings');
    return [];
  }

  const sourceEmbedding = JSON.parse(sourceChunks[0].embedding);

  // Get all other documents
  const allDocuments = getAllDocuments(1000).filter(doc => doc.id !== documentId);

  const similarities: Array<{ documentId: string; documentTitle: string; similarity: number }> = [];

  for (const doc of allDocuments) {
    const chunks = getChunksByDocumentId(doc.id);
    
    if (chunks.length === 0 || !chunks[0].embedding) continue;

    try {
      const docEmbedding = JSON.parse(chunks[0].embedding);
      const similarity = cosineSimilarity(sourceEmbedding, docEmbedding);

      similarities.push({
        documentId: doc.id,
        documentTitle: doc.title || 'Untitled',
        similarity: similarity,
      });
    } catch (error) {
      console.error(`❌ Error processing document ${doc.id}:`, error);
    }
  }

  const topSimilar = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  console.log(`✅ Found ${topSimilar.length} similar documents`);

  return topSimilar;
}

/**
 * Batch search multiple queries at once
 */
export async function batchSearch(
  queries: string[],
  limitPerQuery: number = 5
): Promise<Map<string, SearchResult[]>> {
  console.log(`🔍 Batch searching ${queries.length} queries...`);

  const results = new Map<string, SearchResult[]>();

  for (const query of queries) {
    try {
      const queryResults = await searchSimilarChunks(query, limitPerQuery);
      results.set(query, queryResults);
    } catch (error) {
      console.error(`❌ Failed to search "${query}":`, error);
      results.set(query, []);
    }
  }

  console.log(`✅ Batch search complete`);

  return results;
}

/**
 * Get search statistics
 */
export interface SearchStats {
  totalChunksIndexed: number;
  totalDocuments: number;
  avgChunksPerDocument: number;
  embeddingDimensions: number;
}

export function getSearchStats(): SearchStats {
  const documents = getAllDocuments(1000);
  
  let totalChunks = 0;
  let embeddingDim = 0;

  for (const doc of documents) {
    const chunks = getChunksByDocumentId(doc.id);
    totalChunks += chunks.length;

    if (embeddingDim === 0 && chunks.length > 0 && chunks[0].embedding) {
      try {
        const embedding = JSON.parse(chunks[0].embedding);
        embeddingDim = embedding.length;
      } catch {}
    }
  }

  return {
    totalChunksIndexed: totalChunks,
    totalDocuments: documents.length,
    avgChunksPerDocument: documents.length > 0 ? Math.round(totalChunks / documents.length) : 0,
    embeddingDimensions: embeddingDim,
  };
}

export default {
  searchSimilarChunks,
  advancedSearch,
  getSimilarDocuments,
  batchSearch,
  getSearchStats,
  cosineSimilarity,
};