import { generateEmbedding } from './embedder';
import  db, { exec }  from './database';

export interface SearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;
  documentTitle?: string;
  documentUrl?: string;
  chunkIndex: number;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
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
 * Perform semantic search
 */
export async function semanticSearch(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  console.log(`🔍 Searching for: "${query}"`);

  // Generate embedding for the query
  console.log('🤖 Generating query embedding...');
  const embeddingResult = await generateEmbedding(query);

  if (!embeddingResult.success || !embeddingResult.embedding) {
    throw new Error(`Failed to generate query embedding: ${embeddingResult.error}`);
  }

  const queryEmbedding = embeddingResult.embedding;
  console.log(`✅ Query embedding generated (${queryEmbedding.length}D)`);

  // Get all chunks with embeddings
  const chunksResult = exec(`
    SELECT 
      c.id,
      c.document_id,
      c.content,
      c.chunk_index,
      c.embedding,
      d.title,
      d.url
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    WHERE c.embedding IS NOT NULL
  `);

  if (chunksResult.length === 0 || chunksResult[0].values.length === 0) {
    console.log('⚠️ No chunks with embeddings found');
    return [];
  }

  console.log(`📊 Searching through ${chunksResult[0].values.length} chunks...`);

  // Calculate similarity for each chunk
  const results: SearchResult[] = [];

  for (const row of chunksResult[0].values) {
    const [id, documentId, content, chunkIndex, embeddingJson, title, url] = row;

    if (!embeddingJson) continue;

    try {
      const chunkEmbedding = JSON.parse(embeddingJson as string);
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

      results.push({
        chunkId: id as string,
        documentId: documentId as string,
        content: content as string,
        chunkIndex: chunkIndex as number,
        similarity: similarity,
        documentTitle: title as string,
        documentUrl: url as string,
      });
    } catch (error) {
      console.error(`Failed to parse embedding for chunk ${id}:`, error);
    }
  }

  // Sort by similarity (highest first)
  results.sort((a, b) => b.similarity - a.similarity);

  // Return top N results
  const topResults = results.slice(0, limit);

  console.log(`✅ Found ${topResults.length} results (top similarity: ${topResults[0]?.similarity.toFixed(4) || 'N/A'})`);

  return topResults;
}

export default {
  semanticSearch,
};