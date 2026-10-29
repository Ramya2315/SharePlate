/**
 * Food Safety Reports Routes
 * Community reporting of food safety, hygiene, or temperature issues, with admin resolution.
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requireRole } from '../middleware/rbac.ts';

const router = Router();

// GET all safety reports (Admin only)
router.get('/', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const reports = db.safetyReports.find();
  res.json({ reports });
});

// POST submit a safety report
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { reportedEntityType, reportedEntityId, reportedEntityTitle, issueType, description } = req.body;

  if (!reportedEntityId || !issueType || !description) {
    return res.status(400).json({ error: 'Reported entity, issue type, and description are required.' });
  }

  const report = db.safetyReports.create({
    reporterId: req.user!.id,
    reporterEmail: req.user!.email,
    reportedEntityType: reportedEntityType || 'listing',
    reportedEntityId,
    reportedEntityTitle: reportedEntityTitle || 'Donation Item',
    issueType,
    description: description.trim(),
    status: 'open',
  });

  // Admin audit log
  db.auditLogs.create({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'FILED_SAFETY_REPORT',
    resourceType: 'SafetyReport',
    resourceId: report.id,
    details: { issueType, reportedEntityId },
  });

  res.status(201).json({
    message: 'Food safety report submitted. An administrator will review this report promptly.',
    report,
  });
});

// PUT resolve safety report (Admin only)
router.put('/:id/resolve', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, resolutionNotes } = req.body;

  const report = db.safetyReports.findById(id);
  if (!report) {
    return res.status(404).json({ error: 'Safety report not found.' });
  }

  const updated = db.safetyReports.updateOne(id, {
    status: status || 'resolved',
    resolutionNotes: resolutionNotes || 'Resolved by administrator.',
  });

  res.json({ message: 'Report updated successfully.', report: updated });
});

export default router;
