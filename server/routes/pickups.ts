/**
 * Pickup Tasks and QR Verification Routes
 * Single-use code verification, QR code generation, volunteer assignment, and handover lifecycle.
 */

import { Router, Response } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { db } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requireRole } from '../middleware/rbac.ts';

const router = Router();

// GET all pickup tasks (filtered by role)
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let tasks = db.pickups.find();

  if (user.role === 'volunteer') {
    // Show tasks assigned to this volunteer or unassigned tasks available for claim
    tasks = tasks.filter((t) => t.volunteerId === user.id || !t.volunteerId);
  } else if (user.role === 'provider') {
    tasks = tasks.filter((t) => t.providerId === user.id);
  } else if (user.role === 'ngo') {
    tasks = tasks.filter((t) => t.ngoId === user.id);
  }
  // Admin sees all

  res.json({ tasks });
});

// GET single pickup task detail
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const task = db.pickups.findById(id);
  if (!task) {
    return res.status(404).json({ error: 'Pickup task not found.' });
  }
  res.json({ task });
});

// POST claim or assign volunteer to task
router.post('/:id/assign', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const task = db.pickups.findById(id);

  if (!task) {
    return res.status(404).json({ error: 'Pickup task not found.' });
  }

  let volunteerId = user.id;
  let volunteerName = user.name;

  // If NGO or Admin assigning a specific volunteer
  if (req.body.volunteerId && (user.role === 'admin' || user.role === 'ngo')) {
    const volUser = db.users.findById(req.body.volunteerId);
    if (!volUser) return res.status(404).json({ error: 'Volunteer not found.' });
    volunteerId = volUser.id;
    volunteerName = volUser.name;
  } else if (user.role !== 'volunteer' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Only volunteers or administrators can claim or assign pickup tasks.' });
  }

  const updated = db.pickups.updateOne(id, {
    volunteerId,
    volunteerName,
    status: 'assigned',
  });

  // Notify volunteer
  db.notifications.create({
    userId: volunteerId,
    title: 'Pickup Task Assigned',
    message: `You are assigned to collect "${task.foodName}" from ${task.providerName}.`,
    type: 'assignment',
    read: false,
    relatedEntityId: task.id,
  });

  res.json({ message: 'Volunteer assigned successfully.', task: updated });
});

// GET QR code and verification payload for a task
router.get('/:id/qr', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const task = db.pickups.findById(id);

  if (!task) {
    return res.status(404).json({ error: 'Pickup task not found.' });
  }

  // Generate QR code data URL
  const qrPayload = JSON.stringify({
    taskId: task.id,
    code: task.verificationCodePlain,
    foodName: task.foodName,
    provider: task.providerName,
    quantity: `${task.quantity} ${task.unit}`,
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#1e3a24', // forest green tone
        light: '#ffffff',
      },
    });

    res.json({
      taskId: task.id,
      code: task.verificationCodePlain,
      status: task.status,
      qrDataUrl,
      instructions: 'Provider presents this QR or 6-character code upon physical handover. Volunteer verifies in app.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// POST verify pickup code (completes handover securely)
router.post('/:id/verify-code', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { code, targetStatus } = req.body; // targetStatus can be 'picked_up' or 'delivered'
  const user = req.user!;

  if (!code) {
    return res.status(400).json({ error: 'Verification code is required.' });
  }

  const task = db.pickups.findById(id);
  if (!task) {
    return res.status(404).json({ error: 'Pickup task not found.' });
  }

  // Authorization check: volunteer assigned, ngo recipient, provider, or admin
  const isAuthorized =
    user.role === 'admin' ||
    user.id === task.volunteerId ||
    user.id === task.ngoId ||
    user.id === task.providerId;

  if (!isAuthorized) {
    return res.status(403).json({ error: 'You are not authorized to verify handover for this task.' });
  }

  // Check state machine
  if (task.status === 'delivered') {
    return res.status(400).json({ error: 'This task has already been completed and delivered.' });
  }

  // Verify hash
  const inputCodeClean = code.trim().toUpperCase();
  const inputHash = crypto.createHash('sha256').update(inputCodeClean).digest('hex');

  if (inputHash !== task.verificationCodeHash) {
    return res.status(400).json({
      error: 'Invalid verification code. Please check the code provided by the food provider.',
    });
  }

  const nextStatus = targetStatus === 'delivered' ? 'delivered' : 'picked_up';
  const now = new Date().toISOString();

  const updatedTask = db.pickups.updateOne(id, {
    status: nextStatus,
    verifiedAt: now,
    verifiedBy: user.name,
  });

  // Update associated DonationRequest status
  db.requests.updateOne(task.requestId, {
    status: nextStatus,
  });

  // If completed / delivered, generate permanent ImpactRecord
  if (nextStatus === 'delivered' || nextStatus === 'picked_up') {
    const listing = db.listings.findById(task.listingId);
    const servings = listing ? Math.round((task.quantity / listing.quantity) * listing.estimatedServings) : task.quantity * 2;
    const co2e = Math.round(task.quantity * 2.5 * 10) / 10;

    db.impactRecords.create({
      listingId: task.listingId,
      providerId: task.providerId,
      providerName: task.providerName,
      ngoId: task.ngoId,
      ngoName: task.ngoName,
      volunteerId: task.volunteerId,
      quantityKg: task.quantity,
      servingsCount: servings,
      category: listing?.category || 'Cooked Meals',
      co2eAvoidedKg: co2e,
    });

    // Check if listing has any remaining inventory; if 0, mark listing completed
    if (listing && listing.remainingQuantity === 0) {
      db.listings.updateOne(listing.id, { status: 'completed' });
    }
  }

  // Notify Provider and NGO
  db.notifications.create({
    userId: task.providerId,
    title: 'Food Handover Verified!',
    message: `Surplus donation "${task.foodName}" has been successfully verified and ${nextStatus}.`,
    type: 'pickup',
    read: false,
  });

  db.notifications.create({
    userId: task.ngoId,
    title: 'Delivery Confirmation',
    message: `Surplus donation "${task.foodName}" has been successfully marked as ${nextStatus}.`,
    type: 'pickup',
    read: false,
  });

  // Audit log
  db.auditLogs.create({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: `VERIFY_HANDOVER_${nextStatus.toUpperCase()}`,
    resourceType: 'PickupTask',
    resourceId: id,
    details: { code: 'VERIFIED_HASH_MATCH', verifiedBy: user.name, newStatus: nextStatus },
  });

  res.json({
    message: `Pickup handover verified successfully! Status updated to ${nextStatus}.`,
    task: updatedTask,
  });
});

// PUT update status manually (e.g. accepted before pickup)
router.put('/:id/status', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const task = db.pickups.findById(id);

  if (!task) {
    return res.status(404).json({ error: 'Pickup task not found.' });
  }

  const validTransitions: Record<string, string[]> = {
    assigned: ['accepted', 'cancelled'],
    accepted: ['picked_up', 'cancelled'],
    picked_up: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  if (!validTransitions[task.status]?.includes(status)) {
    return res.status(400).json({
      error: `Invalid transition from '${task.status}' to '${status}'. Pickups require verification code to advance to picked_up or delivered.`,
    });
  }

  const updated = db.pickups.updateOne(id, { status, notes: notes || task.notes });
  res.json({ message: `Task status updated to ${status}.`, task: updated });
});

export default router;
