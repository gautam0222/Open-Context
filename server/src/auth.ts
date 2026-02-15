import { Request } from 'express';

export function getUserIdFromRequest(req: Request): string {
  // Get from Authorization header (Clerk JWT)
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In production, verify JWT with Clerk
    // For now, extract user_id from token
    const token = authHeader.substring(7);
    
    // TODO: Verify token with Clerk
    // For development, use default
    return 'user_default';
  }
  
  // Fallback
  return 'user_default';
}

export function requireAuth(req: Request): string {
  const userId = getUserIdFromRequest(req);
  
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  return userId;
}