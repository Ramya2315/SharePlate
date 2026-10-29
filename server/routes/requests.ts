/**
 * Donation Requests Routes
 * Handles request creation by NGOs and concurrency-safe approval/rejection by Providers.
 */

import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requireRole, requireVerifiedOrganization } from '../middleware/rbac.ts';
import { PythonClient } from '../services/pythonClient.ts';

const router = Router();

// GET all requests (filtered by user role)
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let requests = db.requests.find();

  if (user.role === 'provider') {
    requests = requests.filter((r) => r.providerId === user.id);
  } else if (user.role === 'ngo') {
    requests = requests.filter((r) => r.ngoId === user.id);
  } else if (user.role === 'volunteer') {
    // Volunteers see requests for tasks they are assigned to
    const myTasks = db.pickups.find((p) => p.volunteerId === user.id);
    const reqIds = new Set(myTasks.map((t) => t.requestId));
    requests = requests.filter((r) => reqIds.has(r.id));
  }
  // Admin sees all

  res.json({ requests });
});

// POST submit donation request (NGO only, must be verified)
router.post(
  '/',
  authenticate,
  requireRole(['ngo', 'admin']),
  requireVerifiedOrganization,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { listingId, requestedQuantity, requestedServings, pickupNotes } = req.body;

      if (!listingId || !requestedQuantity) {
        return res.status(400).json({ error: 'Listing ID and requested quantity are required.' });
      }

      const listing = db.listings.findById(listingId);
      if (!listing) {
        return res.status(404).json({ error: 'Food listing not found.' });
      }

      // Check expiry
      if (new Date(listing.collectionDeadline).getTime() < Date.now()) {
        db.listings.updateOne(listing.id, { status: 'expired' });
        return res.status(400).json({ error: 'This listing has expired and cannot receive new requests.' });
      }

      if (listing.status !== 'available' && listing.status !== 'partially_reserved') {
        return res.status(400).json({ error: `Listing is currently ${listing.status}.` });
      }

      const numQuantity = parseFloat(requestedQuantity);
      if (numQuantity <= 0) {
        return res.status(400).json({ error: 'Requested quantity must be greater than zero.' });
      }

      if (numQuantity > listing.remainingQuantity) {
        return res.status(400).json({
          error: `Requested quantity (${numQuantity} ${listing.unit}) exceeds remaining available inventory (${listing.remainingQuantity} ${listing.unit}).`,
        });
      }

      // Get urgency score
      let urgencyScore = 50;
      try {
        const u = await PythonClient.scoreUrgency(listing.collectionDeadline);
        urgencyScore = u.urgency_score || 50;
      } catch {
        // fallback
      }

      const newRequest = db.requests.create({
        listingId: listing.id,
        foodName: listing.foodName,
        providerId: listing.providerId,
        providerName: listing.providerName,
        ngoId: req.user!.id,
        ngoName: req.user!.organizationName || req.user!.name,
        ngoPhone: req.user!.phone,
        requestedQuantity: numQuantity,
        requestedServings: requestedServings
          ? parseInt(requestedServings, 10)
          : Math.round((numQuantity / listing.quantity) * listing.estimatedServings),
        pickupNotes: pickupNotes?.trim(),
        urgencyScore,
        status: 'pending',
      });

      // Send in-app notification to Provider
      db.notifications.create({
        userId: listing.providerId,
        title: 'New Donation Request Received',
        message: `${req.user!.organizationName || req.user!.name} requested ${numQuantity} ${listing.unit} of "${listing.foodName}".`,
        type: 'request',
        read: false,
        relatedEntityId: newRequest.id,
      });

      res.status(201).json({ message: 'Donation request submitted to provider.', request: newRequest });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to submit request' });
    }
  }
);

// PUT approve donation request (Provider only - concurrency-safe atomic inventory reservation)
router.put('/:id/approve', authenticate, requireRole(['provider', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const request = db.requests.findById(id);

  if (!request) {
    return res.status(404).json({ error: 'Donation request not found.' });
  }

  // Authorization check
  if (req.user!.role !== 'admin' && request.providerId !== req.user!.id) {
    return res.status(403).json({ error: 'You are not authorized to approve this request.' });
  }

  // Perform atomic reservation check and decrement
  const result = db.atomicApproveRequest(id);
  if (!result.success) {
    return res.status(409).json({ error: result.error });
  }

  const listing = result.listing!;
  const approvedReq = result.request!;

  // Generate unique pickup verification token (e.g. SP-4819)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const secretCode = `SP-${randomSuffix}`;
  const hashedCode = crypto.createHash('sha256').update(secretCode).digest('hex');

  // Create corresponding PickupTask
  const pickupTask = db.pickups.create({
    requestId: approvedReq.id,
    listingId: listing.id,
    providerId: listing.providerId,
    providerName: listing.providerName,
    providerAddress: listing.pickupAddress,
    ngoId: approvedReq.ngoId,
    ngoName: approvedReq.ngoName,
    destinationAddress: 'NGO Distribution Center',
    foodName: listing.foodName,
    quantity: approvedReq.requestedQuantity,
    unit: listing.unit,
    collectionDeadline: listing.collectionDeadline,
    status: 'assigned',
    verificationCodeHash: hashedCode,
    verificationCodePlain: secretCode,
    notes: approvedReq.pickupNotes || 'Handle in accordance with food hygiene standards.',
  });

  // Notify NGO
  db.notifications.create({
    userId: approvedReq.ngoId,
    title: 'Donation Request Approved!',
    message: `${listing.providerName} approved your request for ${approvedReq.requestedQuantity} ${listing.unit} of "${listing.foodName}". Pickup code: ${secretCode}`,
    type: 'approval',
    read: false,
    relatedEntityId: pickupTask.id,
  });

  // Audit log
  db.auditLogs.create({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: req.user!.role,
    action: 'APPROVE_DONATION_REQUEST',
    resourceType: 'DonationRequest',
    resourceId: id,
    details: {
      listingId: listing.id,
      quantityApproved: approvedReq.requestedQuantity,
      remainingListingQuantity: listing.remainingQuantity,
    },
  });

  res.json({
    message: 'Request approved successfully and pickup task scheduled.',
    request: approvedReq,
    listing,
    pickupTask,
  });
});

// PUT reject donation request
router.put('/:id/reject', authenticate, requireRole(['provider', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;
  const request = db.requests.findById(id);

  if (!request) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  if (req.user!.role !== 'admin' && request.providerId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to reject this request.' });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ error: `Cannot reject request with status '${request.status}'` });
  }

  const updated = db.requests.updateOne(id, {
    status: 'rejected',
    rejectionReason: rejectionReason?.trim() || 'Declined by provider.',
  });

  // Notify NGO
  db.notifications.create({
    userId: request.ngoId,
    title: 'Donation Request Declined',
    message: `Your request for "${request.foodName}" was declined: ${rejectionReason || 'No reason provided.'}`,
    type: 'request',
    read: false,
  });

  res.json({ message: 'Request rejected.', request: updated });
});

// PUT cancel request (by NGO or Admin)
router.put('/:id/cancel', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const request = db.requests.findById(id);

  if (!request) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  if (req.user!.role !== 'admin' && request.ngoId !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized to cancel this request.' });
  }

  if (request.status === 'picked_up' || request.status === 'delivered') {
    return res.status(400).json({ error: 'Cannot cancel request that has already been picked up or delivered.' });
  }

  // If was approved, release inventory back!
  if (request.status === 'approved') {
    db.releaseReservedInventory(request.listingId, request.requestedQuantity);
    // Cancel associated pickup task
    const task = db.pickups.find((p) => p.requestId === id)[0];
    if (task) {
      db.pickups.updateOne(task.id, { status: 'cancelled' });
    }
  }

  const updated = db.requests.updateOne(id, {
    status: 'cancelled',
    rejectionReason: 'Cancelled by requester.',
  });

  res.json({ message: 'Donation request cancelled and any reserved inventory released.', request: updated });
});

export default router;
