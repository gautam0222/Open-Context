import express, { Express, Request, Response } from 'express';
import { searchSimilarChunks } from './search';
import { getSearchStats } from './search';
import { checkEmbeddingServer } from './embedder';
import { ensureDbReady, getTotalChunkCount } from './database';
import { generateEmbeddingsBatch } from './embedder';
import cors from 'cors';
import { chatWithContext, ChatMessage } from './rag';
import dotenv from 'dotenv';
import { db } from './database';
import { SAMPLE_ARTICLES } from './sampleContent';
import { InsertChunkData } from './database';
import {
  insertDocument,
  updateDocument,
  getDocumentById,
  getDocumentByUrl,
  getAllDocuments,
  getDocumentCount,
  deleteDocument,
  getDatabaseStats,
  insertChunk,
  insertChunks,
  getChunksByDocumentId,
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
  getEntityDocuments,
  insertEntityRelationship,
  getEntityRelationships,
  getAllEntityRelationships,
  insertCollection,
  getAllCollections,
  getCollectionById,
  getChildCollections,
  updateCollection,
  deleteCollection,
  addDocumentToCollection,
  removeDocumentFromCollection,
  getCollectionDocuments,
  getDocumentCollections,
  getCollectionStats,
  Collection,
  InsertCollection,
} from './database';
import { generateId } from '@open-context/shared';
import { extractContent } from './extractor';
import { chunkText, getChunkingStats } from './chunker';
import { extractEntities, findCoOccurrences } from './nlp';
import { generateInsights, buildTimeline, getReadingStats } from './insights';
import multer from 'multer';
import { processFile } from './fileProcessor';

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

// After chunks are saved, add entity extraction
console.log('🧠 Extracting entities...');
const entities = extractEntities(extraction.data.textContent || '');
console.log(`📊 Found ${entities.length} entities`);

// Save entities to database
const entityMap: Map<string, string> = new Map(); // text -> entity_id

for (const entity of entities) {
  // Check if entity already exists
  let existingEntity = getEntityByName(entity.text);
  
  if (existingEntity) {
    // Increment frequency
    incrementEntityFrequency(existingEntity.id);
    entityMap.set(entity.text.toLowerCase(), existingEntity.id);
  } else {
    // Create new entity
    const entityId = generateId('entity');
    insertEntity({
      id: entityId,
      name: entity.text,
      type: entity.type,
      frequency: entity.frequency,
    });
    entityMap.set(entity.text.toLowerCase(), entityId);
  }
}

// Link entities to document
for (const [entityText, entityId] of entityMap.entries()) {
  const entity = entities.find((e: { text: string; }) => e.text.toLowerCase() === entityText);
  if (entity) {
    insertDocumentEntity({
      id: generateId('doc_entity'),
      document_id: capturedData.id,
      entity_id: entityId,
      frequency: entity.frequency,
    });
  }
}

// Find co-occurrences and create relationships
const coOccurrences = findCoOccurrences(entities, extraction.data.textContent || '');
for (const coOcc of coOccurrences) {
  const entity1Id = entityMap.get(coOcc.entity1);
  const entity2Id = entityMap.get(coOcc.entity2);
  
  if (entity1Id && entity2Id && entity1Id !== entity2Id) {
    insertEntityRelationship({
      id: generateId('rel'),
      entity_a_id: entity1Id,
      entity_b_id: entity2Id,
      relationship_type: 'co_occurs',
      strength: coOcc.strength,
    });
  }
}

console.log(`✅ Extracted and linked ${entityMap.size} entities`);

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

// Get graph data (nodes and edges)
// NEW GRAPH API - Simple and meaningful
// NEW GRAPH API - Simple and meaningful
app.get('/api/graph', async (_req: Request, res: Response) => {
  try {
    console.log('🕸️ Building document similarity graph...');
    
    // Get all documents with embeddings
    const documents = getAllDocuments(100);
    
    // Build similarity matrix using existing embeddings
    const nodes = [];
    const edges = [];
    
    // Create document nodes
    for (const doc of documents) {
      nodes.push({
        id: doc.id,
        label: doc.title || 'Untitled',
        type: 'document',
        size: Math.log((doc.word_count || 100) / 100 + 1) * 10 + 5,
        color: '#4f46e5',
        url: doc.url,
        wordCount: doc.word_count,
      });
    }
    
    // Create edges based on embedding similarity
    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        const doc1 = documents[i];
        const doc2 = documents[j];
        
        // Get first chunk embedding for each document
        const chunks1 = getChunksByDocumentId(doc1.id);
        const chunks2 = getChunksByDocumentId(doc2.id);
        
        if (chunks1.length === 0 || chunks2.length === 0) continue;
        if (!chunks1[0].embedding || !chunks2[0].embedding) continue;
        
        const emb1 = JSON.parse(chunks1[0].embedding);
        const emb2 = JSON.parse(chunks2[0].embedding);
        
        // Calculate cosine similarity
        const similarity = cosineSimilarity(emb1, emb2);
        
        // Only connect if similarity is high enough
        if (similarity > 0.5) {
          edges.push({
            id: `${doc1.id}-${doc2.id}`,
            source: doc1.id,
            target: doc2.id,
            size: similarity * 3,
            color: `rgba(79, 70, 229, ${similarity * 0.5})`,
            similarity: similarity,
          });
        }
      }
    }
    
    console.log(`✅ Graph: ${nodes.length} documents, ${edges.length} connections`);
    
    res.json({
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        documents: documents.length,
      },
    });
  } catch (error) {
    console.error('❌ Graph error:', error);
    res.status(500).json({
      error: 'Failed to build graph',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get AI-generated insights
app.get('/api/insights', async (_req: Request, res: Response) => {
  try {
    console.log('🧠 Generating insights...');
    const insights = await generateInsights();
    
    res.json({
      insights,
      count: insights.length,
    });
  } catch (error) {
    console.error('❌ Insights error:', error);
    res.status(500).json({
      error: 'Failed to generate insights',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get learning timeline
app.get('/api/timeline', (_req: Request, res: Response) => {
  try {
    console.log('📅 Building timeline...');
    const timeline = buildTimeline();
    
    res.json({
      timeline,
      count: timeline.length,
    });
  } catch (error) {
    console.error('❌ Timeline error:', error);
    res.status(500).json({
      error: 'Failed to build timeline',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get reading statistics
app.get('/api/stats/reading', (_req: Request, res: Response) => {
  try {
    const stats = getReadingStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Reading stats error:', error);
    res.status(500).json({
      error: 'Failed to get reading stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { query, history } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`💬 Chat request: "${query}"`);

    const conversationHistory: ChatMessage[] = history || [];
    const response = await chatWithContext(query, conversationHistory);

    res.json(response);
  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      error: 'Chat failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md'];
    const fileExt = file.originalname.toLowerCase().split('.').pop();
    
    if (allowedTypes.some(type => type.includes(fileExt || ''))) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOCX, TXT, MD'));
    }
  },
});

// Upload single file
app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📤 Uploading file: ${req.file.originalname}`);

    // Process file
    const processed = await processFile(req.file.buffer, req.file.originalname);

    // Generate document ID
    const docId = generateId('doc');

    // Insert document
    insertDocument({
      id: docId,
      url: `file://${req.file.originalname}`,
      title: processed.title,
      content: processed.content,
      excerpt: processed.excerpt,
      author: undefined,
      site_name: 'Uploaded File',
      word_count: processed.wordCount,
    });

    // Chunk content
    const chunks = chunkText(processed.content, docId, {
  chunkSize: 500,
  overlap: 50,
});

    // Generate embeddings
    console.log(`🧠 Generating embeddings for ${chunks.length} chunks...`);
    const embeddingPromises = chunks.map(chunk =>
  fetch('http://localhost:5000/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: chunk.content }),
  }).then(r => r.json())
);

    const embeddingResults = await Promise.all(embeddingPromises);

    chunks.forEach((chunk, idx) => {
  chunk.embedding = embeddingResults[idx].embedding;
});

insertChunks(chunks);

    console.log(`✅ File uploaded successfully: ${processed.title}`);

    res.json({
      success: true,
      document: {
        id: docId,
        title: processed.title,
        wordCount: processed.wordCount,
        chunks: chunks.length,
        fileType: processed.fileType,
      },
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Upload multiple files
app.post('/api/upload/batch', upload.array('files', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`📤 Batch uploading ${files.length} files...`);

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        console.log(`  Processing: ${file.originalname}`);

        // Process file
        const processed = await processFile(file.buffer, file.originalname);

        // Generate document ID
        const docId = generateId('doc');

        // Insert document
        insertDocument({
          id: docId,
          url: `file://${file.originalname}`,
          title: processed.title,
          content: processed.content,
          excerpt: processed.excerpt,
          author: undefined,
          site_name: 'Uploaded File',
          word_count: processed.wordCount,
        });

        // Chunk and embed
        const chunks = chunkText(processed.content, docId, {
  chunkSize: 500,
  overlap: 50,
});
        const embeddingPromises = chunks.map(chunk =>
          fetch('http://localhost:5000/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: chunk.content }),
          }).then(r => r.json())
        );

        const embeddingResults = await Promise.all(embeddingPromises);

    chunks.forEach((chunk, idx) => {
  chunk.embedding = embeddingResults[idx].embedding;
});

insertChunks(chunks);

        results.push({
          fileName: file.originalname,
          title: processed.title,
          wordCount: processed.wordCount,
          success: true,
        });

        console.log(`  ✅ ${file.originalname}`);
      } catch (error) {
        console.error(`  ❌ ${file.originalname}:`, error);
        errors.push({
          fileName: file.originalname,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`\n✅ Batch upload complete: ${results.length}/${files.length} successful\n`);

    res.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined,
      total: files.length,
      successful: results.length,
      failed: errors.length,
    });
  } catch (error) {
    console.error('❌ Batch upload error:', error);
    res.status(500).json({
      error: 'Batch upload failed',
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

// Import sample content (for onboarding)
// Import sample content (for onboarding)
app.post('/api/import/samples', async (_req: Request, res: Response) => {
  try {
    console.log('📦 Importing sample content...');

    let importedCount = 0;
    const errors: string[] = [];

    for (const article of SAMPLE_ARTICLES) {
      try {
        const docId = generateId('doc');

        // Insert document
        insertDocument({
          id: docId,
          url: article.url,
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          author: article.author,
          site_name: article.site_name,
          word_count: article.word_count,
        });

        console.log(`  📄 Processing: ${article.title}`);

        // Chunk content - returns string[]
        const chunkObjects = chunkText(article.content, docId, {
  chunkSize: 500,
  overlap: 50,
});
        const textChunks = chunkObjects.map(c => c.content);
        console.log(`    Created ${textChunks.length} chunks`);

        // Generate embeddings for each chunk
        console.log(`    Generating embeddings...`);
        const embeddingPromises = textChunks.map((chunkText: string) =>
          fetch('http://localhost:5000/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: chunkText }),
          })
            .then(r => r.json())
            .catch(err => {
              console.error('Embedding error:', err);
              return { embedding: [] };
            })
        );

        const embeddingResults = await Promise.all(embeddingPromises);

        // Insert chunks with embeddings
        const chunkDataArray: InsertChunkData[] = [];
        
        for (let i = 0; i < textChunks.length; i++) {
          const chunkText = textChunks[i];
          const embedding = embeddingResults[i]?.embedding || [];

          if (embedding.length > 0) {
            chunkDataArray.push({
              id: generateId('chunk'),
              document_id: docId,
              content: chunkText,
              chunk_index: i,
              char_count: chunkText.length,
              embedding: embedding, // number[]
            });
          }
        }

        if (chunkDataArray.length > 0) {
          insertChunks(chunkDataArray);
          console.log(`    ✅ Saved ${chunkDataArray.length} chunks with embeddings`);
        }

        importedCount++;
      } catch (error) {
        console.error(`  ❌ Failed to import ${article.title}:`, error);
        errors.push(article.title);
      }
    }

    console.log(`\n✅ Successfully imported ${importedCount}/${SAMPLE_ARTICLES.length} sample articles\n`);

    res.json({
      success: true,
      imported: importedCount,
      total: SAMPLE_ARTICLES.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('❌ Sample import error:', error);
    res.status(500).json({
      error: 'Failed to import samples',
      message: error instanceof Error ? error.message : 'Unknown error',
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

// Re-process all documents to extract entities
// Re-process all documents to extract entities (async, non-blocking)
app.post('/api/documents/reprocess', async (_req: Request, res: Response) => {
  try {
    // Send immediate response
    res.json({
      success: true,
      message: 'Re-processing started in background',
    });

    // Process in background
    setImmediate(async () => {
      console.log('🔄 Re-processing all documents in background...');
      
      const documents = getAllDocuments(1000);
      let processedCount = 0;
      let entityCount = 0;
      
      for (const doc of documents) {
        if (!doc.content) continue;
        
        console.log(`📄 Processing ${processedCount + 1}/${documents.length}: ${doc.title?.substring(0, 50)}...`);
        
        try {
          // Extract entities
          const entities = extractEntities(doc.content);
          
          if (entities.length === 0) {
            console.log(`   ⚠️ No entities found`);
            processedCount++;
            continue;
          }
          
          // Save entities to database
          const entityMap: Map<string, string> = new Map();
          
          for (const entity of entities) {
            let existingEntity = getEntityByName(entity.text);
            
            if (existingEntity) {
              incrementEntityFrequency(existingEntity.id);
              entityMap.set(entity.text.toLowerCase(), existingEntity.id);
            } else {
              const entityId = generateId('entity');
              insertEntity({
                id: entityId,
                name: entity.text,
                type: entity.type,
                frequency: entity.frequency,
              });
              entityMap.set(entity.text.toLowerCase(), entityId);
              entityCount++;
            }
          }
          
          // Link entities to document
          for (const [entityText, entityId] of entityMap.entries()) {
            const entity = entities.find(e => e.text.toLowerCase() === entityText);
            if (entity) {
              try {
                insertDocumentEntity({
                  id: generateId('doc_entity'),
                  document_id: doc.id,
                  entity_id: entityId,
                  frequency: entity.frequency,
                });
              } catch (err) {
                // Skip if already exists
              }
            }
          }
          
          // Find co-occurrences (limit to avoid too many)
          const coOccurrences = findCoOccurrences(entities, doc.content).slice(0, 20);
          for (const coOcc of coOccurrences) {
            const entity1Id = entityMap.get(coOcc.entity1);
            const entity2Id = entityMap.get(coOcc.entity2);
            
            if (entity1Id && entity2Id && entity1Id !== entity2Id) {
              try {
                insertEntityRelationship({
                  id: generateId('rel'),
                  entity_a_id: entity1Id,
                  entity_b_id: entity2Id,
                  relationship_type: 'co_occurs',
                  strength: coOcc.strength,
                });
              } catch (err) {
                // Skip if already exists
              }
            }
          }
          
          console.log(`   ✅ Extracted ${entityMap.size} entities`);
          processedCount++;
          
        } catch (error) {
          console.error(`   ❌ Error processing document:`, error);
          processedCount++;
        }
      }
      
      console.log(`\n🎉 COMPLETE! Re-processed ${processedCount} documents, extracted ${entityCount} new entities\n`);
    });
    
  } catch (error) {
    console.error('❌ Re-processing error:', error);
    res.status(500).json({
      error: 'Failed to start re-processing',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
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

app.get('/api/search/stats', (_req: Request, res: Response) => {
  try {
    const stats = getSearchStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Search stats error:', error);
    res.status(500).json({
      error: 'Failed to get search stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
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

// Get all collections (with tree structure)
app.get('/api/collections', (_req: Request, res: Response) => {
  try {
    const collections = getAllCollections();
    
    // Build tree structure
    const buildTree = (parentId: string | null = null): any[] => {
      const children = collections.filter(c => c.parent_id === parentId);
      return children.map(collection => ({
        ...collection,
        children: buildTree(collection.id),
        stats: getCollectionStats(collection.id),
      }));
    };

    const tree = buildTree(null);

    res.json({
      collections: tree,
      total: collections.length,
    });
  } catch (error) {
    console.error('❌ Get collections error:', error);
    res.status(500).json({ error: 'Failed to get collections' });
  }
});

// Get single collection
app.get('/api/collections/:id', (req: Request, res: Response) => {
  try {
    const collection = getCollectionById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const documents = getCollectionDocuments(collection.id);
    const stats = getCollectionStats(collection.id);
    const children = getChildCollections(collection.id);

    res.json({
      collection,
      documents,
      stats,
      children,
    });
  } catch (error) {
    console.error('❌ Get collection error:', error);
    res.status(500).json({ error: 'Failed to get collection' });
  }
});

// Create collection
app.post('/api/collections', (req: Request, res: Response) => {
  try {
    const { name, description, color, icon, parent_id } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const collectionId = generateId('col');

    const newCollection: InsertCollection = {
      id: collectionId,
      name: name.trim(),
      description: description || null,
      color: color || '#6366f1',
      icon: icon || '📁',
      parent_id: parent_id || null,
      created_at: Date.now(),
    };

    insertCollection(newCollection);

    console.log(`✅ Created collection: ${name}`);

    res.json({
      success: true,
      collection: {
        ...newCollection,
        stats: { documentCount: 0, totalWords: 0, lastUpdated: null },
      },
    });
  } catch (error) {
    console.error('❌ Create collection error:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Update collection
app.put('/api/collections/:id', (req: Request, res: Response) => {
  try {
    const collection = getCollectionById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const { name, description, color, icon, parent_id } = req.body;

    updateCollection(req.params.id, {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(icon && { icon }),
      ...(parent_id !== undefined && { parent_id }),
    });

    console.log(`✅ Updated collection: ${req.params.id}`);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Update collection error:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

// Delete collection
app.delete('/api/collections/:id', (req: Request, res: Response) => {
  try {
    const collection = getCollectionById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    deleteCollection(req.params.id);

    console.log(`✅ Deleted collection: ${collection.name}`);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Delete collection error:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// Add document to collection
app.post('/api/collections/:id/documents', (req: Request, res: Response) => {
  try {
    const { document_id } = req.body;

    if (!document_id) {
      return res.status(400).json({ error: 'document_id is required' });
    }

    const collection = getCollectionById(req.params.id);
    const document = getDocumentById(document_id);

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    addDocumentToCollection(req.params.id, document_id);

    console.log(`✅ Added document to collection: ${document.title} → ${collection.name}`);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Add to collection error:', error);
    res.status(500).json({ error: 'Failed to add document to collection' });
  }
});

// Remove document from collection
app.delete('/api/collections/:id/documents/:documentId', (req: Request, res: Response) => {
  try {
    removeDocumentFromCollection(req.params.id, req.params.documentId);

    console.log(`✅ Removed document from collection`);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Remove from collection error:', error);
    res.status(500).json({ error: 'Failed to remove document from collection' });
  }
});

// Get document's collections
app.get('/api/documents/:id/collections', (req: Request, res: Response) => {
  try {
    const collections = getDocumentCollections(req.params.id);

    res.json({
      collections,
      count: collections.length,
    });
  } catch (error) {
    console.error('❌ Get document collections error:', error);
    res.status(500).json({ error: 'Failed to get document collections' });
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
    const { query, limit } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`🔍 Search request: "${query}" (limit: ${limit || 10})`);

    const results = await searchSimilarChunks(query, limit || 10);

    res.json({
      results,
      count: results.length,
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
// Get graph data (nodes and edges) - OPTIMIZED
app.get('/api/graph', (req: Request, res: Response) => {
  try {
    console.log('🕸️ Building knowledge graph...');
    
    // Get top entities only (limit to prevent overload)
    const entities = getAllEntities(100); // Reduced from 500
    
    // Get top relationships only
    const relationships = getAllEntityRelationships(200); // Reduced from 1000
    
    // Get recent documents only
    const documents = getAllDocuments(50); // Reduced from 500
    
    // Helper function for node colors
    const getColorByType = (type: string): string => {
      const colors: Record<string, string> = {
        person: '#3b82f6',
        place: '#10b981',
        organization: '#8b5cf6',
        topic: '#f59e0b',
        concept: '#ec4899',
        document: '#6b7280',
      };
      return colors[type] || '#9ca3af';
    };
    
    // Build graph structure
    const nodes = [
      // Entity nodes (only high-frequency ones)
      ...entities
        .filter(e => e.frequency >= 2) // Only entities mentioned 2+ times
        .map(entity => ({
          id: entity.id,
          label: entity.name,
          type: entity.type,
          size: Math.min(Math.log(entity.frequency + 1) * 5, 20), // Cap size
          color: getColorByType(entity.type),
        })),
      // Document nodes (smaller size)
      ...documents.map(doc => ({
        id: doc.id,
        label: (doc.title || 'Untitled').substring(0, 50), // Truncate long titles
        type: 'document',
        size: 5, // Fixed smaller size for documents
        color: '#9ca3af',
      })),
    ];
    
    const edges = [
      // Entity relationships (only strong ones)
      ...relationships
        .filter(rel => rel.strength >= 0.2) // Only strong relationships
        .map((rel, idx) => ({
          id: `edge-rel-${idx}`,
          source: rel.entity_a_id,
          target: rel.entity_b_id,
          size: rel.strength * 2,
          color: '#e5e7eb',
        })),
    ];
    
    // Add document-entity edges (limit to top entities per document)
    const allDocEntitiesResult = db.exec(
      'SELECT document_id, entity_id FROM document_entities ORDER BY frequency DESC LIMIT 500'
    );
    
    if (allDocEntitiesResult.length > 0) {
      allDocEntitiesResult[0].values.forEach((row, idx) => {
        const docId = String(row[0]);
        const entityId = String(row[1]);
        
        // Only add edge if both nodes exist
        if (nodes.some(n => n.id === docId) && nodes.some(n => n.id === entityId)) {
          edges.push({
            id: `edge-doc-${idx}`,
            source: docId,
            target: entityId,
            size: 0.5,
            color: '#f3f4f6',
          });
        }
      });
    }
    
    console.log(`✅ Graph: ${nodes.length} nodes, ${edges.length} edges`);
    
    res.json({
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        entities: entities.length,
        documents: documents.length,
      },
    });
  } catch (error) {
    console.error('❌ Graph error:', error);
    res.status(500).json({
      error: 'Failed to build graph',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get entity details with related documents
app.get('/api/entities/:id', (req: Request, res: Response) => {
  try {
    const entityId = req.params.id;
    
    // Get entity
    const entitiesResult = db.exec('SELECT * FROM entities WHERE id = ?', [entityId]);
    if (entitiesResult.length === 0 || entitiesResult[0].values.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }
    
    const entityRow = entitiesResult[0].values[0];
    const entity: Record<string, any> = {};
    entitiesResult[0].columns.forEach((col, i) => {
      entity[col] = entityRow[i];
    });
    
    // Get related documents
    const docEntities = getEntityDocuments(entityId);
    const relatedDocs = docEntities.map(de => {
      const doc = getDocumentById(de.document_id);
      return doc ? { ...doc, relevance: de.frequency } : null;
    }).filter((doc): doc is NonNullable<typeof doc> => doc !== null);
    
    // Get related entities
    const relationships = getEntityRelationships(entityId);
    const relatedEntities = relationships.map(rel => {
      const relatedId = rel.entity_a_id === entityId ? rel.entity_b_id : rel.entity_a_id;
      const relEntitiesResult = db.exec('SELECT * FROM entities WHERE id = ?', [relatedId]);
      
      if (relEntitiesResult.length === 0) return null;
      
      const relEntity: Record<string, any> = {};
      relEntitiesResult[0].columns.forEach((col, i) => {
        relEntity[col] = relEntitiesResult[0].values[0][i];
      });
      
      return { ...relEntity, strength: rel.strength };
    }).filter((entity): entity is NonNullable<typeof entity> => entity !== null);
    
    res.json({
      entity,
      relatedDocuments: relatedDocs,
      relatedEntities,
    });
  } catch (error) {
    console.error('❌ Error fetching entity:', error);
    res.status(500).json({ error: 'Failed to fetch entity' });
  }
});

// Global progress tracker
let reprocessingProgress = {
  isRunning: false,
  current: 0,
  total: 0,
  currentDocument: '',
};

// Get re-processing progress
app.get('/api/documents/reprocess/progress', (_req: Request, res: Response) => {
  res.json(reprocessingProgress);
});

// Update the re-process endpoint to use progress tracking
app.post('/api/documents/reprocess', async (_req: Request, res: Response) => {
  if (reprocessingProgress.isRunning) {
    return res.status(409).json({
      error: 'Re-processing already in progress',
      progress: reprocessingProgress,
    });
  }

  try {
    const documents = getAllDocuments(1000);
    
    reprocessingProgress = {
      isRunning: true,
      current: 0,
      total: documents.length,
      currentDocument: '',
    };

    // Send immediate response
    res.json({
      success: true,
      message: 'Re-processing started',
      total: documents.length,
    });

    // Process in background
    setImmediate(async () => {
      console.log(`\n🔄 Re-processing ${documents.length} documents...\n`);
      
      let processedCount = 0;
      let entityCount = 0;
      
      for (const doc of documents) {
        reprocessingProgress.current = processedCount + 1;
        reprocessingProgress.currentDocument = doc.title || 'Untitled';
        
        if (!doc.content) {
          processedCount++;
          continue;
        }
        
        console.log(`[${processedCount + 1}/${documents.length}] ${doc.title?.substring(0, 60)}...`);
        
        try {
          const entities = extractEntities(doc.content);
          
          if (entities.length === 0) {
            processedCount++;
            continue;
          }
          
          const entityMap: Map<string, string> = new Map();
          
          for (const entity of entities) {
            let existingEntity = getEntityByName(entity.text);
            
            if (existingEntity) {
              incrementEntityFrequency(existingEntity.id);
              entityMap.set(entity.text.toLowerCase(), existingEntity.id);
            } else {
              const entityId = generateId('entity');
              insertEntity({
                id: entityId,
                name: entity.text,
                type: entity.type,
                frequency: entity.frequency,
              });
              entityMap.set(entity.text.toLowerCase(), entityId);
              entityCount++;
            }
          }
          
          for (const [entityText, entityId] of entityMap.entries()) {
            const entity = entities.find(e => e.text.toLowerCase() === entityText);
            if (entity) {
              try {
                insertDocumentEntity({
                  id: generateId('doc_entity'),
                  document_id: doc.id,
                  entity_id: entityId,
                  frequency: entity.frequency,
                });
              } catch (err) {
                // Skip duplicates
              }
            }
          }
          
          const coOccurrences = findCoOccurrences(entities, doc.content);
          for (const coOcc of coOccurrences) {
            const entity1Id = entityMap.get(coOcc.entity1);
            const entity2Id = entityMap.get(coOcc.entity2);
            
            if (entity1Id && entity2Id && entity1Id !== entity2Id) {
              try {
                insertEntityRelationship({
                  id: generateId('rel'),
                  entity_a_id: entity1Id,
                  entity_b_id: entity2Id,
                  relationship_type: 'co_occurs',
                  strength: coOcc.strength,
                });
              } catch (err) {
                // Skip duplicates
              }
            }
          }
          
          console.log(`  ✅ ${entityMap.size} entities`);
          processedCount++;
          
        } catch (error) {
          console.error(`  ❌ Error:`, error);
          processedCount++;
        }
      }
      
      reprocessingProgress.isRunning = false;
      console.log(`\n🎉 COMPLETE! ${processedCount} documents, ${entityCount} new entities\n`);
    });
    
  } catch (error) {
    reprocessingProgress.isRunning = false;
    console.error('❌ Re-processing error:', error);
    res.status(500).json({ error: 'Failed to start re-processing' });
  }
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

// Delete all documents (DANGER!)
app.delete('/api/documents/all', (_req: Request, res: Response) => {
  try {
    console.log('⚠️ Deleting ALL documents...');

    const documents = getAllDocuments(10000);
    let deletedCount = 0;

    for (const doc of documents) {
      try {
        // Delete chunks first
        deleteChunksByDocumentId(doc.id);
        // Delete document
        deleteDocument(doc.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete document ${doc.id}:`, error);
      }
    }

    console.log(`✅ Deleted ${deletedCount} documents`);

    res.json({
      success: true,
      deletedCount,
    });
  } catch (error) {
    console.error('❌ Delete all error:', error);
    res.status(500).json({
      error: 'Failed to delete all documents',
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