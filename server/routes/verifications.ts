/**
 * Organization Verification Routes
 * Admin review, approval, and rejection of NGOs and Providers.
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requireRole } from '../middleware/rbac.ts';

const router = Router();

// GET all verification requests (Admin only)
router.get('/', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const verifs = db.verifications.find();
  res.json({ verifications: verifs });
});

// GET my verification status
router.get('/my-status', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const verif = db.verifications.find((v) => v.userId === req.user?.id)[0];
  res.json({ verification: verif || null, isVerified: req.user.isVerified });
});

// SUBMIT new verification application
router.post('/submit', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { organizationName, organizationType, registrationNumber, contactPerson, phone, address, documentsDescription } = req.body;

  if (!organizationName || !registrationNumber) {
    return res.status(400).json({ error: 'Organization name and registration number are required.' });
  }

  // Check if existing record
  const existing = db.verifications.find((v) => v.userId === req.user?.id)[0];
  if (existing) {
    const updated = db.verifications.updateOne(existing.id, {
      organizationName,
      organizationType: organizationType || existing.organizationType,
      registrationNumber,
      contactPerson: contactPerson || req.user.name,
      phone: phone || req.user.phone || '',
      address: address || req.user.address || '',
      documentsDescription: documentsDescription || '',
      status: 'pending',
    });
    return res.json({ message: 'Verification details re-submitted for review.', verification: updated });
  }

  const newVerif = db.verifications.create({
    userId: req.user.id,
    organizationName,
    organizationType: organizationType || 'ngo',
    registrationNumber,
    contactPerson: contactPerson || req.user.name,
    phone: phone || req.user.phone || '',
    address: address || req.user.address || '',
    documentsDescription: documentsDescription || '',
    status: 'pending',
  });

  res.status(201).json({ message: 'Verification request submitted successfully.', verification: newVerif });
});

// REVIEW verification request (Admin only)
router.put('/:id/review', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, reviewNotes } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
  }

  const verif = db.verifications.findById(id);
  if (!verif) {
    return res.status(404).json({ error: 'Verification record not found' });
  }

  const updated = db.verifications.updateOne(id, {
    status,
    reviewNotes: reviewNotes || (status === 'approved' ? 'Verified by Administrator' : 'Application declined'),
    reviewedBy: req.user?.id,
  });

  // Update User isVerified field
  const user = db.users.findById(verif.userId);
  if (user) {
    db.users.updateOne(user.id, { isVerified: status === 'approved' });

    // Send in-app notification to organization
    db.notifications.create({
      userId: user.id,
      title: status === 'approved' ? 'Organization Verified!' : 'Verification Application Update',
      message:
        status === 'approved'
          ? 'Your organization has been officially verified by administrators. You can now request or publish food donations.'
          : `Your verification application was rejected: ${reviewNotes || 'Please contact support with valid documentation.'}`,
      type: 'verification',
      read: false,
    });
  }

  // Record audit log
  db.auditLogs.create({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'admin',
    action: `VERIFICATION_${status.toUpperCase()}`,
    resourceType: 'OrganizationVerification',
    resourceId: id,
    details: { organizationName: verif.organizationName, status, notes: reviewNotes },
  });

  res.json({ message: `Verification status updated to ${status}`, verification: updated });
});

export default router;
