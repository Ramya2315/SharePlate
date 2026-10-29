/**
 * Authentication Middleware
 * Validates JWT bearer tokens and cookies, extracts user context.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.ts';
import { IUser } from '../models/index.ts';

export const JWT_SECRET = process.env.JWT_SECRET || 'shareplate-production-secure-jwt-key-2026';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const user = db.users.findById(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'User session invalid or account not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Your session has expired. Please log in again.' });
      return;
    }
    res.status(401).json({ error: 'Invalid authentication credentials.' });
  }
}
