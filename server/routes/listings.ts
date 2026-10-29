/**
 * Food Listings Routes
 * Safe, expiry-aware food surplus listings management.
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requireRole, requireVerifiedOrganization } from '../middleware/rbac.ts';
import { PythonClient } from '../services/pythonClient.ts';

const router = Router();

// GET all food listings (with filtering by category, search, dietary, and available status)
router.get('/', async (req: Request, res: Response) => {
  const { category, dietary, search, status, providerId } = req.query;

  // Auto-expire listings whose collection deadline has passed
  const nowTime = Date.now();
  const allListings = db.listings.find();
  allListings.forEach((item) => {
    if (item.status === 'available' || item.status === 'partially_reserved') {
      if (new Date(item.collectionDeadline).getTime() < nowTime) {
        db.listings.updateOne(item.id, { status: 'expired' });
      }
    }
  });

  let listings = db.listings.find();

  if (providerId) {
    listings = listings.filter((l) => l.providerId === providerId);
  }

  if (status) {
    listings = listings.filter((l) => l.status === status);
  } else if (!providerId) {
    // Default public/NGO feed: show available or partially_reserved only
    listings = listings.filter((l) => l.status === 'available' || l.status === 'partially_reserved');
  }

  if (category && category !== 'All') {
    listings = listings.filter((l) => l.category === category);
  }

  if (dietary && dietary !== 'All') {
    listings = listings.filter((l) => l.dietary === dietary);
  }

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    listings = listings.filter(
      (l) =>
        l.foodName.toLowerCase().includes(s) ||
        l.description.toLowerCase().includes(s) ||
        l.providerName.toLowerCase().includes(s) ||
        l.pickupAddress.toLowerCase().includes(s)
    );
  }

  // Calculate urgency metadata for listings
  const enriched = await Promise.all(
    listings.map(async (l) => {
      try {
        const urgency = await PythonClient.scoreUrgency(l.collectionDeadline);
        return { ...l, urgency };
      } catch {
        return l;
      }
    })
  );

  res.json({ listings: enriched, count: enriched.length });
});

// GET single listing detail
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const listing = db.listings.findById(id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  const urgency = await PythonClient.scoreUrgency(listing.collectionDeadline);
  res.json({ listing: { ...listing, urgency } });
});

// POST create food listing (Provider only, requires verified organization)
router.post(
  '/',
  authenticate,
  requireRole(['provider', 'admin']),
  requireVerifiedOrganization,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        foodName,
        description,
        category,
        quantity,
        unit,
        estimatedServings,
        preparationTime,
        collectionStartTime,
        collectionDeadline,
        storageCondition,
        allergens,
        dietary,
        pickupAddress,
        latitude,
        longitude,
        contactInstructions,
        foodSafetyDeclaration,
        imageUrl,
      } = req.body;

      if (!foodName || !quantity || !collectionDeadline) {
        return res.status(400).json({ error: 'Food name, quantity, and collection deadline are required.' });
      }

      if (!foodSafetyDeclaration) {
        return res.status(400).json({
          error: 'You must confirm the food safety declaration stating accurate preparation, storage, and handling compliance.',
        });
      }

      // Check deadline validity
      const deadlineEpoch = new Date(collectionDeadline).getTime();
      if (isNaN(deadlineEpoch) || deadlineEpoch <= Date.now()) {
        return res.status(400).json({ error: 'Collection deadline must be a future date and time.' });
      }

      const numQuantity = parseFloat(quantity);
      if (numQuantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than zero.' });
      }

      const listing = db.listings.create({
        providerId: req.user!.id,
        providerName: req.user!.organizationName || req.user!.name,
        providerPhone: req.user!.phone,
        foodName: foodName.trim(),
        description: description?.trim() || '',
        category: category || 'Cooked Meals',
        quantity: numQuantity,
        unit: unit || 'kg',
        estimatedServings: estimatedServings ? parseInt(estimatedServings, 10) : Math.round(numQuantity * 2),
        remainingQuantity: numQuantity,
        preparationTime: preparationTime || new Date().toISOString(),
        collectionStartTime: collectionStartTime || new Date().toISOString(),
        collectionDeadline,
        storageCondition: storageCondition || 'Room Temperature',
        allergens: Array.isArray(allergens) ? allergens : [],
        dietary: dietary || 'Vegetarian',
        pickupAddress: pickupAddress || req.user!.address || 'Pickup location provided upon approval',
        latitude: latitude ? parseFloat(latitude) : req.user!.latitude,
        longitude: longitude ? parseFloat(longitude) : req.user!.longitude,
        contactInstructions: contactInstructions?.trim() || 'Please contact directly upon arrival.',
        foodSafetyDeclaration: true,
        status: 'available',
        imageUrl: imageUrl || '/src/assets/images/hero_food_redistribution_1793275539454.jpg',
      });

      // Audit log
      db.auditLogs.create({
        actorId: req.user!.id,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'CREATE_FOOD_LISTING',
        resourceType: 'FoodListing',
        resourceId: listing.id,
        details: { foodName, quantity: numQuantity, category },
      });

      res.status(201).json({ message: 'Surplus food listing published successfully.', listing });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create listing' });
    }
  }
);

// PUT edit listing (Owner provider or admin)
router.put('/:id', authenticate, requireRole(['provider', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const listing = db.listings.findById(id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  // Check ownership
  if (req.user!.role !== 'admin' && listing.providerId !== req.user!.id) {
    return res.status(403).json({ error: 'You are not authorized to edit this listing.' });
  }

  if (listing.status === 'reserved' || listing.status === 'completed') {
    return res.status(400).json({ error: `Cannot edit listing with status '${listing.status}'` });
  }

  const { foodName, description, category, storageCondition, allergens, dietary, pickupAddress, contactInstructions } =
    req.body;

  const updated = db.listings.updateOne(id, {
    foodName: foodName !== undefined ? foodName : listing.foodName,
    description: description !== undefined ? description : listing.description,
    category: category !== undefined ? category : listing.category,
    storageCondition: storageCondition !== undefined ? storageCondition : listing.storageCondition,
    allergens: allergens !== undefined ? allergens : listing.allergens,
    dietary: dietary !== undefined ? dietary : listing.dietary,
    pickupAddress: pickupAddress !== undefined ? pickupAddress : listing.pickupAddress,
    contactInstructions: contactInstructions !== undefined ? contactInstructions : listing.contactInstructions,
  });

  res.json({ message: 'Listing updated successfully.', listing: updated });
});

// DELETE cancel listing
router.delete('/:id', authenticate, requireRole(['provider', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const listing = db.listings.findById(id);

  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  if (req.user!.role !== 'admin' && listing.providerId !== req.user!.id) {
    return res.status(403).json({ error: 'You are not authorized to cancel this listing.' });
  }

  // Mark status cancelled
  db.listings.updateOne(id, { status: 'cancelled' });

  // Cancel any pending requests
  const pendingRequests = db.requests.find((r) => r.listingId === id && r.status === 'pending');
  pendingRequests.forEach((reqItem) => {
    db.requests.updateOne(reqItem.id, {
      status: 'cancelled',
      rejectionReason: 'Listing was cancelled by the food provider.',
    });
    db.notifications.create({
      userId: reqItem.ngoId,
      title: 'Donation Listing Cancelled',
      message: `The food listing for "${listing.foodName}" was cancelled by the provider.`,
      type: 'request',
      read: false,
    });
  });

  res.json({ message: 'Listing and pending requests cancelled successfully.' });
});

export default router;
