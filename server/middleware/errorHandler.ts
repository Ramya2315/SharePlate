/**
 * Centralized Error Handling & Rate Limiting Helpers
 */

import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('[API Error]', req.method, req.path, err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
}

// Lightweight rate limiting tracker for sensitive endpoints like login
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(limit: number = 30, windowMs: number = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const key = `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    const record = requestCounts.get(key);
    if (!record || now > record.resetAt) {
      requestCounts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      res.status(429).json({
        error: 'Too many requests. Please wait a moment before trying again.',
        retryAfterMs: record.resetAt - now,
      });
      return;
    }

    record.count++;
    next();
  };
}
