/**
 * Audit Logs Routes (Admin only)
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requireRole } from '../middleware/rbac.ts';

const router = Router();

router.get('/', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const logs = db.auditLogs
    .find()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ auditLogs: logs });
});

export default router;
