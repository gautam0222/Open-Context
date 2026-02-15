import { Request, Response, NextFunction } from 'express';

// Extract user ID from Clerk JWT token
export function getUserIdFromToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    // Decode JWT (simplified - in production, verify signature with Clerk)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    
    return payload.sub || null; // Clerk user ID is in 'sub' field
  } catch (error) {
    console.error('❌ Token decode error:', error);
    return null;
  }
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getUserIdFromToken(req.headers.authorization);
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Valid authentication token required' 
    });
  }
  
  // Attach to request
  (req as any).userId = userId;
  next();
}

// Middleware to optionally get user (doesn't fail if not authenticated)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const userId = getUserIdFromToken(req.headers.authorization);
  (req as any).userId = userId || 'user_default';
  next();
}