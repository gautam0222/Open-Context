import fetch from 'node-fetch';

const EMBEDDING_SERVER_URL = 'http://localhost:5000';

export interface EmbeddingResult {
  success: boolean;
  embedding?: number[];
  embeddings?: number[][];
  dimension?: number;
  error?: string;
}

/**
 * Check if embedding server is running
 */
export async function checkEmbeddingServer(): Promise<boolean> {
  try {
    const response = await fetch(`${EMBEDDING_SERVER_URL}/health`, {
      // @ts-ignore
      timeout: 2000,
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    const response = await fetch(`${EMBEDDING_SERVER_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      // @ts-ignore
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Embedding server error: ${response.status} ${error}`,
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult> {
  try {
    console.log(`🤖 Requesting embeddings for ${texts.length} chunks...`);

    const response = await fetch(`${EMBEDDING_SERVER_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
      // @ts-ignore
      timeout: 60000, // 60 second timeout for large batches
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        error: `Embedding server error: ${response.status} ${error}`,
      };
    }

    const result = await response.json();
    console.log(`✅ Received ${result.count} embeddings (${result.dimension}D)`);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default {
  generateEmbedding,
  generateEmbeddingsBatch,
  checkEmbeddingServer,
};