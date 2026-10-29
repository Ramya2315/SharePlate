/**
 * Python Intelligence Service API Routes
 * Exposes rule-based matching, deadline urgency scoring, and surplus trend analytics.
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import { PythonClient } from '../services/pythonClient.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET health of Python service
router.get('/health', async (req: Request, res: Response) => {
  const health = await PythonClient.checkHealth();
  res.json(health);
});

// POST recommend best recipient NGOs for a food listing
router.post('/recommend-recipients', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ error: 'listingId is required' });
    }

    const listing = db.listings.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Food listing not found' });
    }

    // Retrieve all NGOs from DB
    const ngos = db.users.find((u) => u.role === 'ngo');

    const result = await PythonClient.matchDonation(listing, ngos);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to match recipients' });
  }
});

// GET urgency score for a listing
router.get('/urgency/:listingId', async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    const listing = db.listings.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const urgency = await PythonClient.scoreUrgency(listing.collectionDeadline);
    res.json(urgency);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to score urgency' });
  }
});

// GET surplus historical summary
router.get('/surplus-summary', async (req: Request, res: Response) => {
  try {
    const impactRecords = db.impactRecords.find();
    const records = impactRecords.map((r) => ({
      status: 'delivered',
      quantity: r.quantityKg,
      estimated_servings: r.servingsCount,
      category: r.category,
      provider_name: r.providerName,
      completed_at: r.completedAt,
    }));

    const summary = await PythonClient.getSurplusSummary(records);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate surplus summary' });
  }
});

export default router;
