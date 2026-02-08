import express, { Express, Request, Response } from 'express';
import { semanticSearch } from './search';
import { checkEmbeddingServer } from './embedder';
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
  deleteChunksByDocumentId,
  deleteDocument,
  insertHighlight,
  getHighlightsByDocumentId,
  deleteHighlight,
  insertNote,
  getNotesByDocumentId,
  updateNote,
  deleteNote,
} from './database';
import { generateId } from '@open-context/shared';
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
// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
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
    if (!capturedData.url || !capturedData.id) {
  return res.status(400).json({ error: "Invalid payload" });
}


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
// Delete document endpoint
app.delete('/api/documents/:id', (req: Request, res: Response) => {
  try {
    const documentId = req.params.id;
    
    console.log(`🗑️ Deleting document: ${documentId}`);
    
    // Check if document exists
    const document = getDocumentById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }
    
    // Delete chunks first (foreign key constraint)
    deleteChunksByDocumentId(documentId);
    
    // Delete document
    deleteDocument(documentId);
    
    console.log(`✅ Deleted document and its chunks: ${documentId}`);
    
    res.json({
      success: true,
      message: 'Document deleted successfully',
      id: documentId,
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get document with full content and chunks
app.get('/api/documents/:id/full', (req: Request, res: Response) => {
  try {
    const document = getDocumentById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Get all chunks for this document
    const chunks = getChunksByDocumentId(req.params.id);
    
    // Parse embeddings if needed (they're stored as JSON strings)
    const chunksWithEmbeddings = chunks.map(chunk => ({
      ...chunk,
      embedding: chunk.embedding ? JSON.parse(chunk.embedding) : null,
    }));
    
    res.json({
      document,
      chunks: chunksWithEmbeddings,
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error('❌ Error fetching document:', error);
    res.status(500).json({
      error: 'Failed to fetch document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get related documents (based on similar content)
app.get('/api/documents/:id/related', async (req: Request, res: Response) => {
  try {
    const document = getDocumentById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Get chunks for this document
    const chunks = getChunksByDocumentId(req.params.id);
    
    if (chunks.length === 0 || !chunks[0].embedding) {
      return res.json({ related: [] });
    }
    
    // Use first chunk's embedding to find similar documents
    const embedding = JSON.parse(chunks[0].embedding);
    
    // Get all other documents
    const allDocs = getAllDocuments(1000);
    const otherDocs = allDocs.filter(d => d.id !== req.params.id);
    
    // Calculate similarity for each document
    const similarities: { doc: any; similarity: number }[] = [];
    
    for (const otherDoc of otherDocs) {
      const otherChunks = getChunksByDocumentId(otherDoc.id);
      
      if (otherChunks.length === 0 || !otherChunks[0].embedding) continue;
      
      const otherEmbedding = JSON.parse(otherChunks[0].embedding);
      const similarity = cosineSimilarity(embedding, otherEmbedding);
      
      similarities.push({ doc: otherDoc, similarity });
    }
    
    // Sort by similarity and take top 5
    const related = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(item => ({
        ...item.doc,
        similarity: item.similarity,
      }));
    
    res.json({ related });
  } catch (error) {
    console.error('❌ Error finding related documents:', error);
    res.status(500).json({
      error: 'Failed to find related documents',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper function (add this near the top with imports)
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
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
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

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

app.get('/api/documents/:id/highlights', (req: Request, res: Response) => {
  try {
    const highlights = getHighlightsByDocumentId(req.params.id);
    res.json({ highlights });
  } catch (error) {
    console.error('❌ Error fetching highlights:', error);
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

app.post('/api/documents/:id/highlights', (req: Request, res: Response) => {
  try {
    const { text, color, position_start, position_end } = req.body;
    
    const highlightId = generateId('highlight');
    
    insertHighlight({
      id: highlightId,
      document_id: req.params.id,
      text,
      color,
      position_start,
      position_end,
    });
    
    res.json({ success: true, id: highlightId });
  } catch (error) {
    console.error('❌ Error creating highlight:', error);
    res.status(500).json({ error: 'Failed to create highlight' });
  }
});

app.delete('/api/highlights/:id', (req: Request, res: Response) => {
  try {
    deleteHighlight(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting highlight:', error);
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

// Get notes for a document
app.get('/api/documents/:id/notes', (req: Request, res: Response) => {
  try {
    const notes = getNotesByDocumentId(req.params.id);
    res.json({ notes });
  } catch (error) {
    console.error('❌ Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create note
app.post('/api/documents/:id/notes', (req: Request, res: Response) => {
  try {
    const { content, highlight_id } = req.body;
    
    const noteId = generateId('note');
    
    insertNote({
      id: noteId,
      document_id: req.params.id,
      content,
      highlight_id,
    });
    
    res.json({ success: true, id: noteId });
  } catch (error) {
    console.error('❌ Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note
app.put('/api/notes/:id', (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    updateNote(req.params.id, content);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
app.delete('/api/notes/:id', (req: Request, res: Response) => {
  try {
    deleteNote(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Search endpoint (placeholder for Phase 2)
// Search endpoint (SEMANTIC SEARCH)
app.post('/api/search', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required',
      });
    }

    console.log(`🔍 Search request: "${query}"`);

    const results = await semanticSearch(query, limit);

    res.json({
      query,
      results: results.map((r) => ({
        chunkId: r.chunkId,
        documentId: r.documentId,
        documentTitle: r.documentTitle,
        documentUrl: r.documentUrl,
        content: r.content,
        similarity: r.similarity,
        chunkIndex: r.chunkIndex,
      })),
      total: results.length,
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
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

// Export all documents as JSON
app.get('/api/export/documents', (_req: Request, res: Response) => {
  try {
    console.log('📤 Exporting all documents...');
    
    const documents = getAllDocuments(10000); // Get all documents
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      stats: getDatabaseStats(),
      documents: documents,
      chunks: [],
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="open-context-export.json"');
    res.json(exportData);
    
    console.log(`✅ Exported ${documents.length} documents`);
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({
      error: 'Failed to export documents',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Export single document as Markdown
app.get('/api/export/documents/:id/markdown', (req: Request, res: Response) => {
  try {
    const document = getDocumentById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Create Markdown content
    const markdown = `# ${document.title || 'Untitled'}

**URL:** ${document.url}
${document.author ? `**Author:** ${document.author}\n` : ''}${document.site_name ? `**Source:** ${document.site_name}\n` : ''}**Captured:** ${new Date(document.created_at).toLocaleString()}
${document.word_count ? `**Word Count:** ${document.word_count}\n` : ''}
---

${document.content || 'No content available'}
`;
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${document.id}.md"`);
    res.send(markdown);
    
    console.log(`✅ Exported document ${document.id} as Markdown`);
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({
      error: 'Failed to export document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Export statistics report
app.get('/api/export/stats', (_req: Request, res: Response) => {
  try {
    const stats = getDatabaseStats();
    const documents = getAllDocuments(10000);
    
    // Calculate additional stats
    const domains = new Map<string, number>();
    const byMonth = new Map<string, number>();
    
    documents.forEach((doc) => {
      // Domain stats
      try {
        const url = new URL(doc.url);
        const domain = url.hostname.replace('www.', '');
        domains.set(domain, (domains.get(domain) || 0) + 1);
      } catch {}
      
      // Monthly stats
      const date = new Date(doc.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + 1);
    });
    
    const report = {
      generatedAt: new Date().toISOString(),
      overview: stats,
      topDomains: Array.from(domains.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([domain, count]) => ({ domain, count })),
      capturesByMonth: Array.from(byMonth.entries())
        .sort()
        .map(([month, count]) => ({ month, count })),
      totalDomains: domains.size,
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="stats-report.json"');
    res.json(report);
    
    console.log('✅ Exported statistics report');
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({
      error: 'Failed to export stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
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
  console.log('🔍 Checking embedding server...');
  const isEmbeddingServerRunning = await checkEmbeddingServer();
  if (!isEmbeddingServerRunning) {
    console.warn('⚠️  WARNING: Embedding server not running!');
    console.warn('⚠️  Start it with: cd scripts && .\\venv\\Scripts\\activate && python embedding_server.py');
    console.warn('⚠️  Search and capture will not work without it.');
  } else {
    console.log('✅ Embedding server is running');
  }
  
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