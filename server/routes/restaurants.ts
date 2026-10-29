/**
 * Restaurants & Food Donors Routes
 * Manage and list verified partner restaurants, caterers, bakeries, hostels, and cafes.
 */

import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET all restaurants with optional search, cuisine, and verified filters
router.get('/', (req: Request, res: Response) => {
  const { search, cuisine, verifiedOnly } = req.query;

  // Auto-seed if empty
  if (db.restaurants.find().length === 0) {
    const { seedRestaurants } = require('../db/seedData.ts');
    seedRestaurants();
  }

  let restaurants = db.restaurants.find();

  if (verifiedOnly === 'true') {
    restaurants = restaurants.filter((r) => r.isVerified);
  }

  if (cuisine && cuisine !== 'All') {
    restaurants = restaurants.filter((r) =>
      r.cuisine.toLowerCase().includes(String(cuisine).toLowerCase())
    );
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    restaurants = restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        (r.tagline && r.tagline.toLowerCase().includes(q)) ||
        r.description.toLowerCase().includes(q)
    );
  }

  // Enrich with live active surplus count from listings
  const activeListings = db.listings.find(
    (l) => l.status === 'available' || l.status === 'partially_reserved'
  );

  const enriched = restaurants.map((rest) => {
    const liveSurplus = activeListings.filter(
      (l) =>
        l.providerName.toLowerCase().includes(rest.name.toLowerCase().slice(0, 10)) ||
        l.pickupAddress.toLowerCase().includes(rest.address.toLowerCase().slice(0, 15))
    );
    return {
      ...rest,
      activeSurplusCount: Math.max(rest.activeSurplusCount, liveSurplus.length),
      liveListings: liveSurplus.map((item) => ({
        id: item.id,
        foodName: item.foodName,
        category: item.category,
        remainingQuantity: item.remainingQuantity,
        unit: item.unit,
        collectionDeadline: item.collectionDeadline,
      })),
    };
  });

  return res.json({
    success: true,
    count: enriched.length,
    restaurants: enriched,
  });
});

// GET single restaurant by ID
router.get('/:id', (req: Request, res: Response) => {
  const restaurant = db.restaurants.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  // Fetch associated active listings
  const activeListings = db.listings.find(
    (l) =>
      (l.status === 'available' || l.status === 'partially_reserved') &&
      (l.providerName.toLowerCase().includes(restaurant.name.toLowerCase().slice(0, 10)) ||
        l.pickupAddress.toLowerCase().includes(restaurant.address.toLowerCase().slice(0, 15)))
  );

  return res.json({
    success: true,
    restaurant: {
      ...restaurant,
      activeSurplusCount: Math.max(restaurant.activeSurplusCount, activeListings.length),
      activeListings,
    },
  });
});

// POST register/list a new restaurant (with photo, cuisine, address, etc.)
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    tagline,
    cuisine,
    organizationType = 'restaurant',
    photoUrl,
    coverImageUrl,
    address,
    latitude = 37.7749,
    longitude = -122.4194,
    phone,
    email,
    hygieneGrade = 'Grade A - Certified',
    pickupHours = '15:00 - 21:00 Daily',
    dietaryOfferings = ['Vegetarian', 'Vegan'],
    description,
  } = req.body;

  if (!name || !cuisine || !address || !phone) {
    return res.status(400).json({
      error: 'Restaurant name, cuisine, address, and phone number are required.',
    });
  }

  // Fallback high-resolution food/restaurant image if none provided
  const resolvedPhoto =
    photoUrl && photoUrl.trim() !== ''
      ? photoUrl.trim()
      : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';

  const newRestaurant = db.restaurants.create({
    name,
    tagline: tagline || `${cuisine} · Zero Food Waste Partner`,
    cuisine,
    organizationType,
    ownerId: req.user?.id,
    photoUrl: resolvedPhoto,
    coverImageUrl:
      coverImageUrl ||
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    address,
    latitude: Number(latitude) || 37.7749,
    longitude: Number(longitude) || -122.4194,
    phone,
    email: email || req.user?.email || 'contact@restaurant.com',
    rating: 4.8,
    totalDonationsKg: 0,
    totalServingsDonated: 0,
    activeSurplusCount: 0,
    hygieneGrade,
    pickupHours,
    dietaryOfferings: Array.isArray(dietaryOfferings) ? dietaryOfferings : [dietaryOfferings],
    description: description || `Verified food donor providing surplus edible food rescue.`,
    isVerified: true,
  });

  // Log in audit trail
  if (req.user) {
    db.auditLogs.create({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'RESTAURANT_REGISTERED',
      resourceType: 'restaurant',
      resourceId: newRestaurant.id,
      details: { name: newRestaurant.name, cuisine: newRestaurant.cuisine },
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Restaurant successfully registered and listed on SharePlate!',
    restaurant: newRestaurant,
  });
});

// PUT update restaurant
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const restaurant = db.restaurants.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant not found' });
  }

  // Only owner or admin can update
  if (req.user?.role !== 'admin' && restaurant.ownerId && restaurant.ownerId !== req.user?.id) {
    return res.status(403).json({ error: 'Unauthorized to update this restaurant' });
  }

  const updated = db.restaurants.updateOne(req.params.id, req.body);
  return res.json({
    success: true,
    message: 'Restaurant profile updated successfully',
    restaurant: updated,
  });
});

export default router;
