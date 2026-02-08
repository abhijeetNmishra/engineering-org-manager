import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: string | jwt.JwtPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  // Public routes that don't need auth
  const publicPaths = [
    '/api/send-code',
    '/api/verify',
    '/api/health', // Health check
  ];

  if (publicPaths.includes(req.path)) {
    return next();
  }

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[Auth Error] Invalid token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
