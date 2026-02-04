import { generateId } from '@open-context/shared';
import { InsertChunkData } from './database';

export interface ChunkingOptions {
  chunkSize?: number; // Characters per chunk
  overlap?: number; // Characters to overlap between chunks
  minChunkSize?: number; // Minimum chunk size to keep
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  chunkSize: 500,
  overlap: 50,
  minChunkSize: 100,
};

export function chunkText(
  text: string,
  documentId: string,
  options: ChunkingOptions = {}
): InsertChunkData[] {
  const { chunkSize, overlap, minChunkSize } = { ...DEFAULT_OPTIONS, ...options };

  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  console.log(`📏 Text length: ${cleanText.length} characters`);

  if (cleanText.length === 0) {
    console.log('⚠️ Empty text, no chunks created');
    return [];
  }

  const chunks: InsertChunkData[] = [];
  
  // Simple chunking without smart boundary detection
  for (let i = 0; i < cleanText.length; i += (chunkSize - overlap)) {
    const chunkContent = cleanText.substring(i, i + chunkSize).trim();
    
    if (chunkContent.length >= minChunkSize) {
      chunks.push({
        id: generateId('chunk'),
        document_id: documentId,
        content: chunkContent,
        chunk_index: chunks.length,
        char_count: chunkContent.length,
      });
    }
  }

  console.log(`📝 Created ${chunks.length} chunks`);

  return chunks;
}

/**
 * Get chunking statistics
 */
export function getChunkingStats(chunks: InsertChunkData[]) {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgCharCount: 0,
      minCharCount: 0,
      maxCharCount: 0,
    };
  }

  const charCounts = chunks.map((c) => c.char_count || 0);

  return {
    totalChunks: chunks.length,
    avgCharCount: Math.round(charCounts.reduce((a, b) => a + b, 0) / chunks.length),
    minCharCount: Math.min(...charCounts),
    maxCharCount: Math.max(...charCounts),
  };
}

export default {
  chunkText,
  getChunkingStats,
};