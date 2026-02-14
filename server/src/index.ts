import express, { Express, Request, Response } from 'express';
import { searchSimilarChunks } from './search';
import { getSearchStats } from './search';
import { checkEmbeddingServer } from './embedder';
import { ensureDbReady, getTotalChunkCount } from './database';
import { extractEntitiesFromDocuments, ConceptGraph } from './advancedNLP';
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
  upsertUserProfile,
  getUserProfile,
  addUserXP,
  createLearningGoal,
  updateGoalProgress,
  getUserGoals,
  createNotification,
  seedAchievements,
  createWorkspace,
  getUserWorkspaces,
  addWorkspaceMember,
  shareCollectionWithWorkspace,
  getWorkspaceActivity,
  addActivityToFeed,
  getPublicActivity,
  UserProfile,
  LearningGoal,
  Workspace,
  getOrCreateConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
} from './database';
import {
  extractTopicsFromDocuments,
  findTopicConnections,
  getTopicTimeline,
  Topic,
} from './topicExtraction';
import { generateId } from '@open-context/shared';
import { extractContent } from './extractor';
import { chunkText, getChunkingStats } from './chunker';
import { extractEntities, findCoOccurrences } from './nlp';

import { generateInsights, buildTimeline, getReadingStats } from './insights';
import multer from 'multer';
import { processFile } from './fileProcessor';

// Load environment variables
dotenv.config();
seedAchievements();

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
app.get('/api/timeline', (req: Request, res: Response) => {
  try {
    const days = req.query.days
      ? parseInt(req.query.days as string, 10)
      : 90; // default 90 days

    const timeline = buildTimeline(days);

    res.json({
      timeline,
      count: timeline.length,
    });
  } catch (error) {
    console.error('❌ Timeline error:', error);
    res.status(500).json({
      error: 'Failed to build timeline',
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
app.get('/api/captures', (req: Request, res: Response) => {
  try {
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 100;

    const documents = getAllDocuments(limit);
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

app.get('/api/knowledge-graph', async (_req: Request, res: Response) => {
  try {
    console.log('🕸️ Building knowledge graph...');

    // Extract topics
    const topics = await extractTopicsFromDocuments();

    // Find connections
    const connections = findTopicConnections(topics);

    // Get timeline
    const timelineMap = getTopicTimeline(topics);
    const timeline = Array.from(timelineMap.entries()).map(([month, topics]) => ({
      month,
      topics: topics.length,
      topicNames: topics.map(t => t.name),
    }));

    // Category distribution
    const categoryDistribution = topics.reduce((acc, topic) => {
      acc[topic.category] = (acc[topic.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate insights
    const insights = generateKnowledgeInsights(topics, connections);

    console.log(`✅ Graph built: ${topics.length} topics, ${connections.length} connections`);

    res.json({
      topics,
      connections,
      timeline,
      categoryDistribution,
      insights,
      stats: {
        totalTopics: topics.length,
        totalConnections: connections.length,
        totalDocuments: topics.reduce((sum, t) => sum + t.documentCount, 0),
        totalWords: topics.reduce((sum, t) => sum + t.totalWords, 0),
      },
    });
  } catch (error) {
    console.error('❌ Knowledge graph error:', error);
    res.status(500).json({
      error: 'Failed to build knowledge graph',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get single topic details
app.get('/api/knowledge-graph/topics/:id', async (req: Request, res: Response) => {
  try {
    const topics = await extractTopicsFromDocuments();
    const topic = topics.find(t => t.id === req.params.id);

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get documents in this topic
    const documents = topic.documentIds.map(id => getDocumentById(id)).filter(Boolean);

    // Get related topics
    const connections = findTopicConnections(topics);
    const relatedTopics = connections
      .filter(c => c.topic1 === topic.id || c.topic2 === topic.id)
      .map(c => {
        const relatedId = c.topic1 === topic.id ? c.topic2 : c.topic1;
        const relatedTopic = topics.find(t => t.id === relatedId);
        return {
          ...relatedTopic,
          connectionStrength: c.strength,
          sharedDocuments: c.sharedDocuments,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b.connectionStrength || 0) - (a.connectionStrength || 0));

    res.json({
      topic,
      documents,
      relatedTopics,
    });
  } catch (error) {
    console.error('❌ Topic details error:', error);
    res.status(500).json({ error: 'Failed to get topic details' });
  }
});

/**
 * Generate AI insights about the knowledge graph
 */
function generateKnowledgeInsights(topics: Topic[], connections: any[]): any[] {
  const insights = [];

  // Largest topic
  const largestTopic = topics.sort((a, b) => b.documentCount - a.documentCount)[0];
  if (largestTopic) {
    insights.push({
      type: 'largest_topic',
      title: 'Your Biggest Interest',
      description: `You have ${largestTopic.documentCount} documents about ${largestTopic.name}`,
      data: largestTopic,
      icon: '🎯',
    });
  }

  // Most connected topic
  const topicConnectionCounts = new Map<string, number>();
  connections.forEach(conn => {
    topicConnectionCounts.set(conn.topic1, (topicConnectionCounts.get(conn.topic1) || 0) + 1);
    topicConnectionCounts.set(conn.topic2, (topicConnectionCounts.get(conn.topic2) || 0) + 1);
  });

  const [mostConnectedId, connectionCount] = Array.from(topicConnectionCounts.entries())
    .sort((a, b) => b[1] - a[1])[0] || [];

  if (mostConnectedId) {
    const topic = topics.find(t => t.id === mostConnectedId);
    if (topic) {
      insights.push({
        type: 'most_connected',
        title: 'Hub of Knowledge',
        description: `${topic.name} connects to ${connectionCount} other topics`,
        data: topic,
        icon: '🕸️',
      });
    }
  }

  // Category diversity
  const categories = new Set(topics.map(t => t.category));
  insights.push({
    type: 'diversity',
    title: 'Knowledge Diversity',
    description: `You're exploring ${categories.size} different areas of knowledge`,
    data: { categories: Array.from(categories) },
    icon: '🌈',
  });

  // Recent growth
  const lastMonth = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentTopics = topics.filter(t => t.lastUpdated > lastMonth);
  
  if (recentTopics.length > 0) {
    insights.push({
      type: 'recent_growth',
      title: 'Active Learning',
      description: `${recentTopics.length} topics updated in the last 30 days`,
      data: { recentTopics: recentTopics.map(t => t.name) },
      icon: '📈',
    });
  }

  return insights;
}

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

app.get('/api/concept-graph', async (_req: Request, res: Response) => {
  try {
    console.log('🧠 Building concept graph with NLP...');

    const conceptGraph = await extractEntitiesFromDocuments();

    // Generate advanced insights
    const insights = generateConceptInsights(conceptGraph);

    console.log(`✅ Concept graph built: ${conceptGraph.entities.length} entities, ${conceptGraph.relationships.length} relationships`);

    res.json({
      ...conceptGraph,
      insights,
      stats: {
        totalEntities: conceptGraph.entities.length,
        totalRelationships: conceptGraph.relationships.length,
        totalClusters: conceptGraph.clusters.length,
        entityTypes: getEntityTypeDistribution(conceptGraph.entities),
      },
    });
  } catch (error) {
    console.error('❌ Concept graph error:', error);
    res.status(500).json({
      error: 'Failed to build concept graph',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
app.get('/api/profile', (req: Request, res: Response) => {
  try {
    const userId = 'user_default'; // TODO: Replace with real auth
    let profile = getUserProfile(userId);

    if (!profile) {
      // Create default profile
      profile = {
        user_id: userId,
        username: 'anonymous',
        display_name: 'Anonymous User',
        avatar: null,
        bio: null,
        level: 1,
        xp: 0,
        coins: 0,
        streak_days: 0,
        last_active: null,
        total_documents: 0,
        total_words_read: 0,
        achievements: null,
        preferences: null,
        is_public: 1,
        created_at: Date.now(),
      };
      upsertUserProfile(profile);
    }

    res.json({ profile });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
app.put('/api/profile', (req: Request, res: Response) => {
  try {
    const userId = 'user_default';
    const updates = req.body;

    const profile = getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const updatedProfile = {
      ...profile,
      ...updates,
    };

    upsertUserProfile(updatedProfile);

    res.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get unlocked achievements
app.get('/api/achievements/unlocked', (req: Request, res: Response) => {
  try {
    const userId = 'user_default';
    
    const result = db.exec(`
      SELECT a.*, ua.unlocked_at, ua.progress
      FROM achievements a
      INNER JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC
    `, [userId]);

    if (result.length === 0) {
      return res.json({ achievements: [] });
    }

    const columns = result[0].columns;
    const achievements = result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    res.json({ achievements });
  } catch (error) {
    console.error('❌ Get achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

// Get all achievements (locked and unlocked)
app.get('/api/achievements', (req: Request, res: Response) => {
  try {
    const userId = 'user_default';
    
    // Get all achievements
    const allResult = db.exec('SELECT * FROM achievements ORDER BY rarity DESC, xp_reward DESC');
    
    if (allResult.length === 0) {
      return res.json({ achievements: [] });
    }

    const columns = allResult[0].columns;
    const allAchievements = allResult[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    // Get unlocked achievements
    const unlockedResult = db.exec(
      'SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?',
      [userId]
    );

    const unlocked = new Map();
    if (unlockedResult.length > 0) {
      unlockedResult[0].values.forEach(row => {
        unlocked.set(row[0], row[1]);
      });
    }

    // Merge data
    const achievements = allAchievements.map(ach => ({
      ...ach,
      unlocked: unlocked.has(ach.id),
      unlocked_at: unlocked.get(ach.id) || null,
    }));

    res.json({ achievements });
  } catch (error) {
    console.error('❌ Get all achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', (req: Request, res: Response) => {
  try {
    db.exec('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ============= LEARNING GOALS =============

// Get user goals
app.get('/api/goals', (req: Request, res: Response) => {
  try {
    const userId = 'user_default';
    const goals = getUserGoals(userId);

    res.json({ goals });
  } catch (error) {
    console.error('❌ Get goals error:', error);
    res.status(500).json({ error: 'Failed to get goals' });
  }
});

// Create goal
app.post('/api/goals', (req: Request, res: Response) => {
  try {
    const userId = 'user_default';
    const { title, description, category, target_type, target_value, deadline, difficulty } = req.body;

    if (!title || !target_type || !target_value) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate XP reward based on difficulty and target
    const difficultyMultiplier: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
    const xp_reward = target_value * (difficultyMultiplier[difficulty as string] || 2) * 10;

    const goal: LearningGoal = {
      id: generateId('goal'),
      user_id: userId,
      workspace_id: null,
      title,
      description: description || null,
      category: category || 'general',
      target_type,
      target_value,
      current_value: 0,
      status: 'active',
      difficulty: difficulty || 'medium',
      xp_reward,
      deadline: deadline || null,
      is_public: 0,
      milestones: null,
      resources: null,
      created_at: Date.now(),
      completed_at: null,
    };

    createLearningGoal(goal);

    // Add activity
    addActivityToFeed({
      user_id: userId,
      workspace_id: null,
      action_type: 'captured',
      entity_type: 'goal',
      entity_id: goal.id,
      metadata: JSON.stringify({ title: goal.title }),
      is_public: 1,
      created_at: Date.now(),
    });

    res.json({ success: true, goal });
  } catch (error) {
    console.error('❌ Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update goal progress
app.put('/api/goals/:id/progress', (req: Request, res: Response) => {
  try {
    const { value } = req.body;

    if (typeof value !== 'number') {
      return res.status(400).json({ error: 'Invalid value' });
    }

    updateGoalProgress(req.params.id, value);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// ============= WORKSPACES =============

// Get user workspaces
app.get('/api/workspaces', (req: Request, res: Response) => {
  try {
    const userId = 'user_default';
    const workspaces = getUserWorkspaces(userId);

    res.json({ workspaces });
  } catch (error) {
    console.error('❌ Get workspaces error:', error);
    res.status(500).json({ error: 'Failed to get workspaces' });
  }
});

// Create workspace
app.post('/api/workspaces', (req: Request, res: Response) => {
  try {
    const userId = 'user_default';
    const { name, description, type, is_public } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const workspace: Workspace = {
      id: generateId('workspace'),
      name,
      description: description || null,
      type: type || 'personal',
      owner_id: userId,
      avatar: null,
      is_public: is_public ? 1 : 0,
      member_limit: 5,
      created_at: Date.now(),
      updated_at: null,
    };

    createWorkspace(workspace);

    res.json({ success: true, workspace });
  } catch (error) {
    console.error('❌ Create workspace error:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

import { generateDailyDigest } from './digestGenerator';

// Get daily digest
app.get('/api/digest', (req: Request, res: Response) => {
  try {
    const userId = 'user_default';
    const digest = generateDailyDigest(userId);

    res.json({ digest });
  } catch (error) {
    console.error('❌ Digest generation error:', error);
    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

// Share collection with workspace
app.post('/api/workspaces/:id/share', (req: Request, res: Response) => {
  try {
    const userId = 'user_default';
    const { collection_id, permissions } = req.body;

    if (!collection_id) {
      return res.status(400).json({ error: 'collection_id is required' });
    }

    shareCollectionWithWorkspace(
      collection_id,
      req.params.id,
      userId,
      permissions || 'view'
    );

    // Add activity
    addActivityToFeed({
      user_id: userId,
      workspace_id: req.params.id,
      action_type: 'shared',
      entity_type: 'collection',
      entity_id: collection_id,
      metadata: null,
      is_public: 1,
      created_at: Date.now(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Share collection error:', error);
    res.status(500).json({ error: 'Failed to share collection' });
  }
});

// Get workspace activity
app.get('/api/workspaces/:id/activity', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const activity = getWorkspaceActivity(req.params.id, limit);

    res.json({ activity });
  } catch (error) {
    console.error('❌ Get activity error:', error);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

// ============= SOCIAL FEED =============

// Get public activity feed (Discover page)
app.get('/api/feed', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const activity = getPublicActivity(limit);

    // Enrich with user and entity details
    const enrichedActivity = activity.map(item => {
      const user = getUserProfile(item.user_id);
      let entity = null;

      if (item.entity_type === 'document') {
        entity = getDocumentById(item.entity_id);
      } else if (item.entity_type === 'collection') {
        entity = getCollectionById(item.entity_id);
      }

      return {
        ...item,
        user: user ? {
          username: user.username,
          display_name: user.display_name,
          avatar: user.avatar,
          level: user.level,
        } : null,
        entity,
      };
    });

    res.json({ activity: enrichedActivity });
  } catch (error) {
    console.error('❌ Get feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// ============= NOTIFICATIONS =============

// Get user notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  try {
    const userId = 'user_default';
    const result = db.exec(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);

    if (result.length === 0) {
      return res.json({ notifications: [] });
    }

    const columns = result[0].columns;
    const notifications = result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    res.json({ notifications });
  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  try {
    db.exec('UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?', [
      Date.now(),
      req.params.id,
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Mark notification error:', error);
    res.status(500).json({ error: 'Failed to mark notification' });
  }
});

// ============= LEADERBOARDS =============

// Get leaderboard
app.get('/api/leaderboard', (req: Request, res: Response) => {
  try {
    const type = req.query.type || 'xp';
    const period = req.query.period || 'all_time';

    let orderBy = 'xp';
    if (type === 'documents') orderBy = 'total_documents';
    else if (type === 'words') orderBy = 'total_words_read';
    else if (type === 'streak') orderBy = 'streak_days';

    const result = db.exec(`
      SELECT 
        user_id, username, display_name, avatar, level, xp,
        total_documents, total_words_read, streak_days
      FROM user_profiles
      WHERE is_public = 1
      ORDER BY ${orderBy} DESC
      LIMIT 100
    `);

    if (result.length === 0) {
      return res.json({ leaderboard: [] });
    }

    const columns = result[0].columns;
    const leaderboard = result[0].values.map((row, index) => {
      const obj: any = { rank: index + 1 };
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    res.json({ leaderboard });
  } catch (error) {
    console.error('❌ Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// ============= HOOK INTO EXISTING ENDPOINTS =============

// Update capture endpoint to track progress
const originalCaptureHandler = app.post('/api/capture', async (req: Request, res: Response) => {
  // ... existing capture logic ...
  
  // After successful capture, add XP and update stats
  const userId = 'user_default';
  addUserXP(userId, 10); // 10 XP per capture

  // Update user stats
  const profile = getUserProfile(userId);
  if (profile) {
    profile.total_documents += 1;
    upsertUserProfile(profile);
  }

  // Add to activity feed
  addActivityToFeed({
    user_id: userId,
    workspace_id: null,
    action_type: 'captured',
    entity_type: 'document',
    entity_id: 'doc_id', // Replace with actual doc ID
    metadata: null,
    is_public: 1,
    created_at: Date.now(),
  });
});

// Get user conversations
app.get('/api/messages/conversations', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const conversations = getUserConversations(currentUserId);

    // Enrich with other participant info and last message
    const enrichedConversations = conversations.map(conv => {
      // Determine other participant
      const otherUserId = conv.participant1_id === currentUserId
        ? conv.participant2_id
        : conv.participant1_id;

      const otherUser = getUserProfile(otherUserId);

      // Get last message - FIX TYPE HERE
      let lastMessage: any = null;
      if (conv.last_message_id) {
        const msgResult = db.exec('SELECT * FROM messages WHERE id = ?', [conv.last_message_id]);
        if (msgResult.length > 0 && msgResult[0].values.length > 0) {
          const msgColumns = msgResult[0].columns;
          const msgRow = msgResult[0].values[0];
          const messageObj: any = {};
          msgColumns.forEach((col: string, idx: number) => {
            messageObj[col] = msgRow[idx];
          });
          lastMessage = messageObj;
        }
      }

      // Get unread count for this conversation
      const unreadResult = db.exec(`
        SELECT COUNT(*) as count FROM messages
        WHERE conversation_id = ? AND sender_id = ? AND is_read = 0
      `, [conv.id, otherUserId]);
      const unreadCount = unreadResult.length > 0 ? unreadResult[0].values[0][0] : 0;

      return {
        ...conv,
        otherUser: otherUser ? {
          user_id: otherUser.user_id,
          username: otherUser.username,
          display_name: otherUser.display_name,
          avatar: otherUser.avatar,
          level: otherUser.level,
        } : null,
        lastMessage,
        unreadCount,
      };
    });

    res.json({ conversations: enrichedConversations });
  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get or create conversation with user
app.post('/api/messages/conversations', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const conversationId = getOrCreateConversation(currentUserId, user_id);

    res.json({ conversation_id: conversationId });
  } catch (error) {
    console.error('❌ Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages in conversation
app.get('/api/messages/conversations/:conversationId', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const { conversationId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify user is participant
    const convResult = db.exec(`
      SELECT * FROM conversations
      WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
    `, [conversationId, currentUserId, currentUserId]);

    if (convResult.length === 0 || convResult[0].values.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const messages = getConversationMessages(conversationId, limit);

    // Mark messages as read
    markMessagesAsRead(conversationId, currentUserId);

    res.json({ messages });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
app.post('/api/messages/send', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const { conversation_id, content } = req.body;

    if (!conversation_id || !content?.trim()) {
      return res.status(400).json({ error: 'conversation_id and content are required' });
    }

    // Verify user is participant
    const convResult = db.exec(`
      SELECT * FROM conversations
      WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
    `, [conversation_id, currentUserId, currentUserId]);

    if (convResult.length === 0 || convResult[0].values.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const message = sendMessage(conversation_id, currentUserId, content.trim());

    // Get other participant to notify
    const convColumns = convResult[0].columns;
    const convRow = convResult[0].values[0];
    const conv: any = {};
    convColumns.forEach((col, idx) => {
      conv[col] = convRow[idx];
    });

    const otherUserId = conv.participant1_id === currentUserId
      ? conv.participant2_id
      : conv.participant1_id;

    // Create notification
    const currentUser = getUserProfile(currentUserId);
    createNotification({
      user_id: otherUserId,
      type: 'message',
      title: 'New Message',
      message: `${currentUser?.display_name || 'Someone'} sent you a message`,
      action_url: `/messages/${conversation_id}`,
      icon: '💬',
      priority: 'high',
    });

    res.json({ message });
  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get unread message count
app.get('/api/messages/unread-count', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const count = getUnreadCount(currentUserId);

    res.json({ count });
  } catch (error) {
    console.error('❌ Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Delete conversation
app.delete('/api/messages/conversations/:conversationId', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const { conversationId } = req.params;

    // Verify user is participant
    const convResult = db.exec(`
      SELECT * FROM conversations
      WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)
    `, [conversationId, currentUserId, currentUserId]);

    if (convResult.length === 0 || convResult[0].values.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.exec('DELETE FROM conversations WHERE id = ?', [conversationId]);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Update typing indicator
app.post('/api/messages/typing', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const { conversation_id, typing } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id is required' });
    }

    if (typing) {
      const id = `typing_${currentUserId}_${conversation_id}`;
      db.exec(`
        INSERT OR REPLACE INTO typing_indicators (id, conversation_id, user_id, started_at)
        VALUES (?, ?, ?, ?)
      `, [id, conversation_id, currentUserId, Date.now()]);
    } else {
      db.exec(`
        DELETE FROM typing_indicators
        WHERE conversation_id = ? AND user_id = ?
      `, [conversation_id, currentUserId]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Typing indicator error:', error);
    res.status(500).json({ error: 'Failed to update typing' });
  }
});

// Get entity details
app.get('/api/concept-graph/entities/:id', async (req: Request, res: Response) => {
  try {
    const conceptGraph = await extractEntitiesFromDocuments();
    const entity = conceptGraph.entities.find(e => e.id === req.params.id);

    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Get related entities
    const relatedRelationships = conceptGraph.relationships.filter(
      r => r.source === entity.id || r.target === entity.id
    );

    const relatedEntityIds = new Set<string>();
    relatedRelationships.forEach(r => {
      if (r.source === entity.id) relatedEntityIds.add(r.target);
      if (r.target === entity.id) relatedEntityIds.add(r.source);
    });

    const relatedEntities = conceptGraph.entities.filter(e =>
      relatedEntityIds.has(e.id)
    );

    // Get documents
    const documents = entity.documentIds.map(id => getDocumentById(id)).filter(Boolean);

    res.json({
      entity,
      relatedEntities,
      relationships: relatedRelationships,
      documents,
    });
  } catch (error) {
    console.error('❌ Entity details error:', error);
    res.status(500).json({ error: 'Failed to get entity details' });
  }
});

/**
 * Generate insights about the concept graph
 */
function generateConceptInsights(graph: ConceptGraph): any[] {
  const insights = [];

  // Most important entity
  const topEntity = graph.entities[0];
  if (topEntity) {
    insights.push({
      type: 'key_entity',
      title: 'Key Concept',
      description: `${topEntity.name} appears ${topEntity.count} times across ${topEntity.documentIds.length} documents`,
      data: topEntity,
      icon: '🎯',
      importance: 10,
    });
  }

  // Most connected entity
  const connectionCounts = new Map<string, number>();
  graph.relationships.forEach(r => {
    connectionCounts.set(r.source, (connectionCounts.get(r.source) || 0) + 1);
    connectionCounts.set(r.target, (connectionCounts.get(r.target) || 0) + 1);
  });

  const [mostConnectedId, connectionCount] = Array.from(connectionCounts.entries())
    .sort((a, b) => b[1] - a[1])[0] || [];

  if (mostConnectedId) {
    const entity = graph.entities.find(e => e.id === mostConnectedId);
    if (entity) {
      insights.push({
        type: 'hub',
        title: 'Knowledge Hub',
        description: `${entity.name} connects to ${connectionCount} other concepts`,
        data: entity,
        icon: '🕸️',
        importance: 9,
      });
    }
  }

  // Entity diversity
  const typeDistribution = getEntityTypeDistribution(graph.entities);
  insights.push({
    type: 'diversity',
    title: 'Concept Diversity',
    description: `${Object.keys(typeDistribution).length} types of entities discovered`,
    data: typeDistribution,
    icon: '🌈',
    importance: 8,
  });

  // Strong relationships
  const strongRelationships = graph.relationships
    .filter(r => r.strength >= 3)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3);

  if (strongRelationships.length > 0) {
    insights.push({
      type: 'connections',
      title: 'Strong Connections',
      description: `Found ${strongRelationships.length} strong concept connections`,
      data: strongRelationships,
      icon: '🔗',
      importance: 7,
    });
  }

  // Recent entities
  const recentThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentEntities = graph.entities.filter(e => {
    const recentDocs = e.documentIds.filter(docId => {
      const doc = getDocumentById(docId);
      return doc && doc.created_at > recentThreshold;
    });
    return recentDocs.length > 0;
  });

  if (recentEntities.length > 0) {
    insights.push({
      type: 'recent',
      title: 'New Discoveries',
      description: `${recentEntities.length} new concepts in the last 30 days`,
      data: recentEntities.slice(0, 5),
      icon: '✨',
      importance: 6,
    });
  }

  return insights.sort((a, b) => b.importance - a.importance);
}

function getEntityTypeDistribution(entities: any[]): Record<string, number> {
  return entities.reduce((acc, entity) => {
    acc[entity.type] = (acc[entity.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}


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

import { generateDailyChallenges } from './challengeGenerator';

// Get daily challenges
app.get('/api/challenges/daily', (req: Request, res: Response) => {
  try {
    const challenges = generateDailyChallenges();
    
    // TODO: Get user progress from database
    const challengesWithProgress = challenges.map(challenge => ({
      ...challenge,
      progress: 0,
      completed: false,
    }));

    res.json({ challenges: challengesWithProgress });
  } catch (error) {
    console.error('❌ Daily challenges error:', error);
    res.status(500).json({ error: 'Failed to get challenges' });
  }
});

// Get public user profile
app.get('/api/users/:userId/profile', (req: Request, res: Response) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = 'user_default'; // TODO: Get from auth

    const profile = getUserProfile(targetUserId);

    if (!profile || !profile.is_public) {
      return res.status(404).json({ error: 'Profile not found or private' });
    }

    // Check if current user is following target user
    const isFollowing = false; // TODO: Implement following check

    res.json({
      profile,
      isOwnProfile: currentUserId === targetUserId,
      isFollowing,
    });
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get user achievements
app.get('/api/users/:userId/achievements', (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const result = db.exec(`
      SELECT a.*, ua.unlocked_at
      FROM achievements a
      INNER JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC
      LIMIT 20
    `, [userId]);

    if (result.length === 0) {
      return res.json({ achievements: [] });
    }

    const columns = result[0].columns;
    const achievements = result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    res.json({ achievements });
  } catch (error) {
    console.error('❌ Get user achievements error:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

// Get user activity
app.get('/api/users/:userId/activity', (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = db.exec(`
      SELECT * FROM activity_feed
      WHERE user_id = ? AND is_public = 1
      ORDER BY created_at DESC
      LIMIT ?
    `, [userId, limit]);

    if (result.length === 0) {
      return res.json({ activity: [] });
    }

    const columns = result[0].columns;
    const activity = result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    res.json({ activity });
  } catch (error) {
    console.error('❌ Get user activity error:', error);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

// Follow user
app.post('/api/follow', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default'; // TODO: Get from auth
    const { user_id: targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const id = `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    db.exec(`
      INSERT OR IGNORE INTO follows (id, follower_id, following_id, created_at)
      VALUES (?, ?, ?, ?)
    `, [id, currentUserId, targetUserId, Date.now()]);

    // Create notification for target user
    createNotification({
      user_id: targetUserId,
      type: 'follow',
      title: 'New Follower',
      message: 'Someone started following you!',
      icon: '👋',
      priority: 'normal',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Follow error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow user
app.post('/api/unfollow', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default'; // TODO: Get from auth
    const { user_id: targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    db.exec(`
      DELETE FROM follows
      WHERE follower_id = ? AND following_id = ?
    `, [currentUserId, targetUserId]);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Unfollow error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});
// Get workspace details
app.get('/api/workspaces/:id', (req: Request, res: Response) => {
  try {
    const result = db.exec('SELECT * FROM workspaces WHERE id = ?', [req.params.id]);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const columns = result[0].columns;
    const row = result[0].values[0];
    const workspace: any = {};
    columns.forEach((col, idx) => {
      workspace[col] = row[idx];
    });

    res.json({ workspace });
  } catch (error) {
    console.error('❌ Get workspace error:', error);
    res.status(500).json({ error: 'Failed to get workspace' });
  }
});

// Get workspace members
app.get('/api/workspaces/:id/members', (req: Request, res: Response) => {
  try {
    const result = db.exec(`
      SELECT 
        wm.id, wm.user_id, wm.role, wm.joined_at,
        up.username, up.display_name, up.avatar
      FROM workspace_members wm
      LEFT JOIN user_profiles up ON wm.user_id = up.user_id
      WHERE wm.workspace_id = ?
      ORDER BY 
        CASE wm.role 
          WHEN 'owner' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'member' THEN 3 
          ELSE 4 
        END,
        wm.joined_at ASC
    `, [req.params.id]);

    if (result.length === 0) {
      return res.json({ members: [] });
    }

    const columns = result[0].columns;
    const members = result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    res.json({ members });
  } catch (error) {
    console.error('❌ Get members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

// Get workspace collections
app.get('/api/workspaces/:id/collections', (req: Request, res: Response) => {
  try {
    const result = db.exec(`
      SELECT 
        sc.id, sc.collection_id, sc.shared_by, sc.permissions, sc.shared_at,
        c.name as collection_name,
        (SELECT COUNT(*) FROM collection_documents WHERE collection_id = c.id) as document_count
      FROM shared_collections sc
      INNER JOIN collections c ON sc.collection_id = c.id
      WHERE sc.workspace_id = ?
      ORDER BY sc.shared_at DESC
    `, [req.params.id]);

    if (result.length === 0) {
      return res.json({ collections: [] });
    }

    const columns = result[0].columns;
    const collections = result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    res.json({ collections });
  } catch (error) {
    console.error('❌ Get workspace collections error:', error);
    res.status(500).json({ error: 'Failed to get collections' });
  }
});

// Invite member to workspace
app.post('/api/workspaces/:id/invite', (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // TODO: Send invitation email
    // TODO: Create pending invitation record

    res.json({ success: true, message: 'Invitation sent' });
  } catch (error) {
    console.error('❌ Invite error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Remove member from workspace
app.delete('/api/workspaces/:workspaceId/members/:memberId', (req: Request, res: Response) => {
  try {
    db.exec('DELETE FROM workspace_members WHERE id = ?', [req.params.memberId]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Update member role
app.put('/api/workspaces/:workspaceId/members/:memberId/role', (req: Request, res: Response) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    db.exec('UPDATE workspace_members SET role = ? WHERE id = ?', [role, req.params.memberId]);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Get enriched feed with likes and comments count
// Get enriched feed with likes and comments count
app.get('/api/feed', async (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const filter = req.query.filter || 'all';
    const limit = parseInt(req.query.limit as string) || 50;

    let activityResult;

    if (filter === 'following') {
      // Get activity from followed users
      activityResult = db.exec(`
        SELECT DISTINCT af.* FROM activity_feed af
        INNER JOIN follows f ON af.user_id = f.following_id
        WHERE f.follower_id = ? AND af.is_public = 1
        ORDER BY af.created_at DESC
        LIMIT ?
      `, [currentUserId, limit]);
    } else if (filter === 'trending') {
      // Get trending activity (most liked/commented in last 7 days)
      activityResult = db.exec(`
        SELECT af.* FROM activity_feed af
        LEFT JOIN activity_likes al ON af.id = al.activity_id
        WHERE af.is_public = 1 AND af.created_at > ?
        GROUP BY af.id
        ORDER BY COUNT(al.id) DESC, af.created_at DESC
        LIMIT ?
      `, [Date.now() - 7 * 24 * 60 * 60 * 1000, limit]);
    } else {
      // Get all public activity
      activityResult = db.exec(`
        SELECT * FROM activity_feed
        WHERE is_public = 1
        ORDER BY created_at DESC
        LIMIT ?
      `, [limit]);
    }

    if (activityResult.length === 0) {
      return res.json({ activity: [] });
    }

    const columns = activityResult[0].columns;
    const activityItems = activityResult[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    // Enrich with user info, entity data, likes, comments
    const enrichedActivity = activityItems.map(item => {
      // Get user info
      const user = getUserProfile(item.user_id);

      // Get entity (document, collection, etc) - FIX TYPE HERE
      let entity: any = null;
      
      if (item.entity_type === 'document') {
        entity = getDocumentById(item.entity_id);
      } else if (item.entity_type === 'collection') {
        entity = getCollectionById(item.entity_id);
      } else if (item.entity_type === 'goal') {
        // Get goal info
        const goalResult = db.exec('SELECT * FROM learning_goals WHERE id = ?', [item.entity_id]);
        if (goalResult.length > 0 && goalResult[0].values.length > 0) {
          const goalColumns = goalResult[0].columns;
          const goalRow = goalResult[0].values[0];
          const goalEntity: any = {};
          goalColumns.forEach((col, idx) => {
            goalEntity[col] = goalRow[idx];
          });
          entity = goalEntity;
        }
      }

      // Get likes count
      const likesResult = db.exec(
        'SELECT COUNT(*) as count FROM activity_likes WHERE activity_id = ?',
        [item.id]
      );
      const likes_count = likesResult.length > 0 ? likesResult[0].values[0][0] : 0;

      // Check if current user liked
      const userLikeResult = db.exec(
        'SELECT id FROM activity_likes WHERE activity_id = ? AND user_id = ?',
        [item.id, currentUserId]
      );
      const is_liked = userLikeResult.length > 0 && userLikeResult[0].values.length > 0;

      // Get comments count
      const commentsResult = db.exec(
        'SELECT COUNT(*) as count FROM activity_comments WHERE activity_id = ?',
        [item.id]
      );
      const comments_count = commentsResult.length > 0 ? commentsResult[0].values[0][0] : 0;

      return {
        ...item,
        user: user ? {
          username: user.username,
          display_name: user.display_name,
          avatar: user.avatar,
          level: user.level,
        } : null,
        entity,
        likes_count,
        comments_count,
        is_liked,
      };
    });

    res.json({ activity: enrichedActivity });
  } catch (error) {
    console.error('❌ Feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// Like/Unlike activity
app.post('/api/activity/like', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const { activity_id, action } = req.body;

    if (!activity_id || !action) {
      return res.status(400).json({ error: 'activity_id and action are required' });
    }

    if (action === 'like') {
      const id = `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      db.exec(`
        INSERT OR IGNORE INTO activity_likes (id, activity_id, user_id, created_at)
        VALUES (?, ?, ?, ?)
      `, [id, activity_id, currentUserId, Date.now()]);

      // Get activity owner to notify
      const activityResult = db.exec('SELECT user_id FROM activity_feed WHERE id = ?', [activity_id]);
      if (activityResult.length > 0 && activityResult[0].values.length > 0) {
        const ownerId = activityResult[0].values[0][0];
        
        if (ownerId !== currentUserId) {
          createNotification({
            user_id: ownerId as string,
            type: 'like',
            title: 'New Like',
            message: 'Someone liked your activity!',
            action_url: `/feed/${activity_id}`,
            icon: '❤️',
            priority: 'normal',
          });
        }
      }

      res.json({ success: true, action: 'liked' });
    } else if (action === 'unlike') {
      db.exec(`
        DELETE FROM activity_likes
        WHERE activity_id = ? AND user_id = ?
      `, [activity_id, currentUserId]);

      res.json({ success: true, action: 'unliked' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('❌ Like error:', error);
    res.status(500).json({ error: 'Failed to like activity' });
  }
});

// Get comments for activity
app.get('/api/activity/:activityId/comments', (req: Request, res: Response) => {
  try {
    const { activityId } = req.params;

    const result = db.exec(`
      SELECT 
        ac.id, ac.activity_id, ac.user_id, ac.content, ac.likes, ac.created_at,
        up.username, up.display_name, up.avatar
      FROM activity_comments ac
      LEFT JOIN user_profiles up ON ac.user_id = up.user_id
      WHERE ac.activity_id = ? AND ac.parent_comment_id IS NULL
      ORDER BY ac.created_at DESC
    `, [activityId]);

    if (result.length === 0) {
      return res.json({ comments: [] });
    }

    const columns = result[0].columns;
    const comments = result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    res.json({ comments });
  } catch (error) {
    console.error('❌ Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// Add comment to activity
app.post('/api/activity/comment', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const { activity_id, content, parent_comment_id } = req.body;

    if (!activity_id || !content?.trim()) {
      return res.status(400).json({ error: 'activity_id and content are required' });
    }

    const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    db.exec(`
      INSERT INTO activity_comments (id, activity_id, user_id, parent_comment_id, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, activity_id, currentUserId, parent_comment_id || null, content.trim(), Date.now()]);

    // Get user info
    const user = getUserProfile(currentUserId);

    // Notify activity owner
    const activityResult = db.exec('SELECT user_id FROM activity_feed WHERE id = ?', [activity_id]);
    if (activityResult.length > 0 && activityResult[0].values.length > 0) {
      const ownerId = activityResult[0].values[0][0];
      
      if (ownerId !== currentUserId) {
        createNotification({
          user_id: ownerId as string,
          type: 'comment',
          title: 'New Comment',
          message: `${user?.display_name || 'Someone'} commented on your activity`,
          action_url: `/feed/${activity_id}`,
          icon: '💬',
          priority: 'normal',
        });
      }
    }

    res.json({
      success: true,
      comment: {
        id,
        activity_id,
        user_id: currentUserId,
        content: content.trim(),
        created_at: Date.now(),
        username: user?.username || 'anonymous',
        display_name: user?.display_name || 'Anonymous',
        avatar: user?.avatar || null,
        likes: 0,
      },
    });
  } catch (error) {
    console.error('❌ Comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Track share
app.post('/api/activity/share', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const { activity_id, platform } = req.body;

    if (!activity_id) {
      return res.status(400).json({ error: 'activity_id is required' });
    }

    const id = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    db.exec(`
      INSERT INTO activity_shares (id, activity_id, user_id, platform, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, activity_id, currentUserId, platform || 'unknown', Date.now()]);

    // Notify activity owner
    const activityResult = db.exec('SELECT user_id FROM activity_feed WHERE id = ?', [activity_id]);
    if (activityResult.length > 0 && activityResult[0].values.length > 0) {
      const ownerId = activityResult[0].values[0][0];
      
      if (ownerId !== currentUserId) {
        createNotification({
          user_id: ownerId as string,
          type: 'share',
          title: 'Activity Shared',
          message: 'Someone shared your activity!',
          icon: '🔗',
          priority: 'normal',
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Share error:', error);
    res.status(500).json({ error: 'Failed to track share' });
  }
});

// Delete comment
app.delete('/api/activity/comment/:commentId', (req: Request, res: Response) => {
  try {
    const currentUserId = 'user_default';
    const { commentId } = req.params;

    // Check if user owns the comment
    const result = db.exec('SELECT user_id FROM activity_comments WHERE id = ?', [commentId]);
    
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentOwnerId = result[0].values[0][0];

    if (commentOwnerId !== currentUserId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.exec('DELETE FROM activity_comments WHERE id = ?', [commentId]);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Like comment
app.post('/api/activity/comment/:commentId/like', (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;

    db.exec(`
      UPDATE activity_comments 
      SET likes = likes + 1 
      WHERE id = ?
    `, [commentId]);

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Like comment error:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Get activity statistics
app.get('/api/activity/:activityId/stats', (req: Request, res: Response) => {
  try {
    const { activityId } = req.params;

    // Get likes count
    const likesResult = db.exec(
      'SELECT COUNT(*) as count FROM activity_likes WHERE activity_id = ?',
      [activityId]
    );
    const likes = likesResult.length > 0 ? likesResult[0].values[0][0] : 0;

    // Get comments count
    const commentsResult = db.exec(
      'SELECT COUNT(*) as count FROM activity_comments WHERE activity_id = ?',
      [activityId]
    );
    const comments = commentsResult.length > 0 ? commentsResult[0].values[0][0] : 0;

    // Get shares count
    const sharesResult = db.exec(
      'SELECT COUNT(*) as count FROM activity_shares WHERE activity_id = ?',
      [activityId]
    );
    const shares = sharesResult.length > 0 ? sharesResult[0].values[0][0] : 0;

    res.json({
      likes,
      comments,
      shares,
      total_engagement: (likes as number) + (comments as number) + (shares as number),
    });
  } catch (error) {
    console.error('❌ Activity stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
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