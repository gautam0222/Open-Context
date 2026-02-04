import express, { Express, Request, Response } from 'express';
import { ensureDbReady } from './database';
import { generateEmbeddingsBatch } from './embedder';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  insertDocument,
  getDocumentByUrl,
  getDocumentById,
  getAllDocuments,
  getDocumentCount,
  getDatabaseStats,
} from './database';
import { extractContent } from './extractor';
import { chunkText, getChunkingStats } from './chunker';
import {
  insertChunks,
  getChunksByDocumentId,
  getTotalChunkCount,
} from './database';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    version: '0.2.0',
  });
});

// Capture endpoint (ENHANCED with content extraction)
// Capture endpoint (ENHANCED with chunking)
app.post('/api/capture', async (req: Request, res: Response) => {
  try {
    const capturedData = req.body as {
      id: string;
      url: string;
      title: string;
      selectedText?: string;
      timestamp: number;
    };

    console.log('📸 Received capture:', {
      id: capturedData.id,
      url: capturedData.url,
      title: capturedData.title,
      timestamp: new Date(capturedData.timestamp).toISOString(),
    });

    // Check if URL already exists
    const existingDoc = getDocumentByUrl(capturedData.url);
    if (existingDoc) {
      console.log('⚠️ URL already captured:', existingDoc.id);
      
      // Get chunk count for existing doc
      const chunkCount = getChunksByDocumentId(existingDoc.id).length;
      
      return res.json({
        success: true,
        message: 'URL already captured',
        id: existingDoc.id,
        duplicate: true,
        wordCount: existingDoc.word_count,
        chunkCount: chunkCount,
      });
    }

    // Extract content from URL
    console.log('🔍 Extracting content...');
    const extraction = await extractContent(capturedData.url);

    if (!extraction.success || !extraction.data) {
      console.error('❌ Extraction failed:', extraction.error);

      // Still save basic info even if extraction fails
      insertDocument({
        id: capturedData.id,
        url: capturedData.url,
        title: capturedData.title,
        excerpt: capturedData.selectedText,
      });

      return res.json({
        success: true,
        message: 'Saved (extraction failed)',
        id: capturedData.id,
        extractionFailed: true,
        error: extraction.error,
      });
    }

    // Save document to database
    insertDocument({
      id: capturedData.id,
      url: capturedData.url,
      title: extraction.data.title,
      content: extraction.data.textContent,
      excerpt: extraction.data.excerpt,
      author: extraction.data.byline || undefined,
      site_name: extraction.data.siteName || undefined,
      word_count: extraction.data.wordCount,
    });

    console.log(`✅ Saved document ${capturedData.id} (${extraction.data.wordCount} words)`);

    // Chunk the content
    // Chunk the content
    console.log('🔪 Chunking content...');
    const chunks = chunkText(extraction.data.textContent, capturedData.id);
    
    if (chunks.length > 0) {
      // GENERATE EMBEDDINGS (NEW CODE)
      console.log('🤖 Generating embeddings...');
      const chunkTexts = chunks.map(c => c.content);
      const embeddingResult = await generateEmbeddingsBatch(chunkTexts);
      
      if (embeddingResult.success && embeddingResult.embeddings) {
        // Add embeddings to chunks
        chunks.forEach((chunk, index) => {
          chunk.embedding = embeddingResult.embeddings![index];
        });
        console.log(`✅ Added embeddings to ${chunks.length} chunks`);
      } else {
        console.warn('⚠️ Embedding generation failed:', embeddingResult.error);
      }
      
      insertChunks(chunks);
      console.log(`✅ Saved ${chunks.length} chunks`);
      
      const chunkStats = getChunkingStats(chunks);
      console.log(`📊 Chunk stats: avg ${chunkStats.avgCharCount} chars, range ${chunkStats.minCharCount}-${chunkStats.maxCharCount}`);
    }

    const stats = getDatabaseStats();
    const totalChunks = getTotalChunkCount();

    res.json({
      success: true,
      message: 'Content captured, extracted, and chunked successfully',
      id: capturedData.id,
      wordCount: extraction.data.wordCount,
      chunkCount: chunks.length,
      totalDocuments: stats.totalDocuments,
      totalChunks: totalChunks,
    });
  } catch (error) {
    console.error('❌ Capture error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to capture content',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get document by ID
app.get('/api/documents/:id', (req: Request, res: Response) => {
  try {
    const document = getDocumentById(req.params.id);

    if (!document) {
      return res.status(404).json({
        error: 'Document not found',
      });
    }

    res.json({ document });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve document',
    });
  }
});

// Get chunks for a document
app.get('/api/documents/:id/chunks', (req: Request, res: Response) => {
  try {
    const chunks = getChunksByDocumentId(req.params.id);

    res.json({
      chunks,
      total: chunks.length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve chunks',
      chunks: [],
      total: 0,
    });
  }
});

// Get all captures/documents
app.get('/api/captures', (_req: Request, res: Response) => {
  try {
    const documents = getAllDocuments(100);
    const stats = getDatabaseStats();

    res.json({
      documents,
      total: getDocumentCount(),
      stats,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve documents',
      documents: [],
      total: 0,
    });
  }
});

// Database stats endpoint
// Database stats endpoint (ENHANCED)
app.get('/api/stats', (_req: Request, res: Response) => {
  try {
    const stats = getDatabaseStats();
    const totalChunks = getTotalChunkCount();
    
    res.json({
      ...stats,
      totalChunks,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get stats',
    });
  }
});

// Search endpoint (placeholder for Phase 2)
app.post('/api/search', (req: Request, res: Response) => {
  const { query } = req.body;

  console.log('🔍 Search query:', query);

  // TODO: Implement semantic search (Phase 2)
  res.json({
    results: [],
    query,
    total: 0,
  });
});

// Get all documents (placeholder - same as captures for now)
app.get('/api/documents', (_req: Request, res: Response) => {
  try {
    const documents = getAllDocuments(100);
    res.json({
      documents,
      total: getDocumentCount(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve documents',
      documents: [],
      total: 0,
    });
  }
});

// Get graph data (placeholder for Phase 3)
app.get('/api/graph', (_req: Request, res: Response) => {
  // TODO: Implement graph data retrieval (Phase 3)
  res.json({
    nodes: [],
    edges: [],
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('💥 Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
  });
});

// Start server
// Start server after database is ready
async function startServer() {
  // Wait for database to be ready
  await ensureDbReady();
  
  app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   🧠 Open Context Server v1.1.0       ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║   Port: ${PORT.toString().padEnd(30)} ║`);
    console.log(`║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(22)} ║`);
    console.log('╠════════════════════════════════════════╣');
    console.log('║   Endpoints:                           ║');
    console.log(`║   GET  /health                         ║`);
    console.log(`║   POST /api/capture                    ║`);
    console.log(`║   GET  /api/captures                   ║`);
    console.log(`║   GET  /api/documents/:id              ║`);
    console.log(`║   GET  /api/documents                  ║`);
    console.log(`║   GET  /api/stats                      ║`);
    console.log(`║   POST /api/search                     ║`);
    console.log(`║   GET  /api/graph                      ║`);
    console.log('╚════════════════════════════════════════╝');
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;