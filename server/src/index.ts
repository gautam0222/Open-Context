import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CapturedData } from '@open-context/shared';

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
    version: '0.1.0',
  });
});

// Capture endpoint (from extension)
app.post('/api/capture', (req: Request, res: Response) => {
  try {
    const capturedData: CapturedData = req.body;
    
    console.log('Received capture:', {
      url: capturedData.url,
      title: capturedData.title,
      hasSelectedText: !!capturedData.selectedText,
    });
    
    // TODO: Process captured data (Phase 1)
    // - Fetch page content
    // - Extract text
    // - Chunk text
    // - Generate embeddings
    // - Store in database
    
    res.json({
      success: true,
      message: 'Content captured successfully',
      id: `doc_${Date.now()}`,
    });
  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to capture content',
    });
  }
});

// Search endpoint (placeholder for Phase 2)
app.post('/api/search', (req: Request, res: Response) => {
  const { query } = req.body;
  
  console.log('Search query:', query);
  
  // TODO: Implement semantic search (Phase 2)
  res.json({
    results: [],
    query,
    total: 0,
  });
});

// Get all documents (placeholder)
app.get('/api/documents', (_req: Request, res: Response) => {
  // TODO: Implement document listing (Phase 2)
  res.json({
    documents: [],
    total: 0,
  });
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
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Server error:', err);
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
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🧠 Open Context Server Running      ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║   Port: ${PORT.toString().padEnd(30)} ║`);
  console.log(`║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(22)} ║`);
  console.log('╠════════════════════════════════════════╣');
  console.log('║   Endpoints:                           ║');
  console.log(`║   GET  /health                         ║`);
  console.log(`║   POST /api/capture                    ║`);
  console.log(`║   POST /api/search                     ║`);
  console.log(`║   GET  /api/documents                  ║`);
  console.log(`║   GET  /api/graph                      ║`);
  console.log('╚════════════════════════════════════════╝');
});

export default app;