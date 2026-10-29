/**
 * Demo Seed Data for SharePlate
 * Clearly labelled as demo data for testing and development environments.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './database.ts';

export async function seedInitialData() {
  const existingUsers = db.users.find();
  if (existingUsers.length > 0) {
    if (db.restaurants.find().length === 0) {
      seedRestaurants();
    }
    return; // Already initialized
  }

  console.log('[Seed] Seeding initial SharePlate demo dataset...');
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('SharePlate@2026', salt);
  const adminPasswordHash = await bcrypt.hash('Admin@1234', salt);

  const now = new Date();
  const todayPlusHours = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
  const todayMinusHours = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

  // 1. Users
  const admin = db.users.create({
    name: 'Eleanor Vance (Admin)',
    email: 'admin@shareplate.org',
    passwordHash: adminPasswordHash,
    role: 'admin',
    phone: '+1-555-0100',
    isVerified: true,
  });

  const provider1 = db.users.create({
    name: 'Chef Marcus Thorne',
    email: 'baker@greenharvest.com',
    passwordHash: commonPasswordHash,
    role: 'provider',
    phone: '+1-555-0211',
    organizationName: 'Green Harvest Artisanal Bakery & Cafe',
    organizationType: 'restaurant',
    address: '42 Market Street, San Francisco, CA',
    latitude: 37.7935,
    longitude: -122.3995,
    isVerified: true,
  });

  const provider2 = db.users.create({
    name: 'Sonia Patel (Banquet Mgr)',
    email: 'catering@grandplaza.com',
    passwordHash: commonPasswordHash,
    role: 'provider',
    phone: '+1-555-0212',
    organizationName: 'Grand Plaza Hotel & Catering',
    organizationType: 'hotel',
    address: '780 Mission Street, San Francisco, CA',
    latitude: 37.7858,
    longitude: -122.4042,
    isVerified: true,
  });

  const ngo1 = db.users.create({
    name: 'David Chen',
    email: 'director@hopekitchen.org',
    passwordHash: commonPasswordHash,
    role: 'ngo',
    phone: '+1-555-0321',
    organizationName: 'Hope Community Kitchen & Food Bank',
    organizationType: 'community_kitchen',
    address: '1150 Folsom Street, San Francisco, CA',
    latitude: 37.7774,
    longitude: -122.4085,
    isVerified: true,
    dailyCapacityServings: 450,
    acceptedCategories: ['Cooked Meals', 'Bakery & Bread', 'Fresh Produce', 'Dairy & Refrigerated'],
    dietaryPreferences: ['Any'],
  });

  const ngo2 = db.users.create({
    name: 'Maria Santos',
    email: 'coordinator@sheltercare.org',
    passwordHash: commonPasswordHash,
    role: 'ngo',
    phone: '+1-555-0322',
    organizationName: 'ShelterCare Outreach Foundation',
    organizationType: 'ngo',
    address: '340 9th Street, San Francisco, CA',
    latitude: 37.7725,
    longitude: -122.4116,
    isVerified: false, // Pending verification demo
    dailyCapacityServings: 180,
    acceptedCategories: ['Cooked Meals', 'Packaged Goods'],
    dietaryPreferences: ['Vegetarian', 'Vegan'],
  });

  const volunteer1 = db.users.create({
    name: 'Alex Rivera',
    email: 'volunteer@shareplate.org',
    passwordHash: commonPasswordHash,
    role: 'volunteer',
    phone: '+1-555-0431',
    address: 'SOMA District, San Francisco, CA',
    isVerified: true,
  });

  // 2. Organization Verifications
  db.verifications.create({
    userId: ngo1.id,
    organizationName: 'Hope Community Kitchen & Food Bank',
    organizationType: 'community_kitchen',
    registrationNumber: 'EIN-84-9382101',
    contactPerson: 'David Chen',
    phone: '+1-555-0321',
    address: '1150 Folsom Street, San Francisco, CA',
    documentsDescription: '501(c)(3) determination letter and food handling permit #SF-9921',
    status: 'approved',
    reviewedBy: admin.id,
    reviewNotes: 'Verified IRS charity status and SF Department of Public Health certified permit.',
  });

  db.verifications.create({
    userId: ngo2.id,
    organizationName: 'ShelterCare Outreach Foundation',
    organizationType: 'ngo',
    registrationNumber: 'EIN-91-4402918',
    contactPerson: 'Maria Santos',
    phone: '+1-555-0322',
    address: '340 9th Street, San Francisco, CA',
    documentsDescription: 'Pending incorporation charter and local non-profit registry excerpt.',
    status: 'pending',
  });

  // 3. Food Listings (with real generated imagery!)
  const listing1 = db.listings.create({
    providerId: provider1.id,
    providerName: provider1.organizationName || 'Green Harvest Bakery',
    providerPhone: provider1.phone,
    foodName: 'Artisanal Sourdough & Fresh Croissants',
    description: 'Freshly baked surplus rustic loaves, whole grain batards, and butter croissants baked this morning.',
    category: 'Bakery & Bread',
    quantity: 35,
    unit: 'boxes',
    estimatedServings: 70,
    remainingQuantity: 35,
    preparationTime: todayMinusHours(4),
    collectionStartTime: todayPlusHours(0.5),
    collectionDeadline: todayPlusHours(5),
    storageCondition: 'Room Temperature',
    allergens: ['Gluten', 'Dairy'],
    dietary: 'Vegetarian',
    pickupAddress: '42 Market Street, San Francisco, CA',
    latitude: 37.7935,
    longitude: -122.3995,
    contactInstructions: 'Ring service bell at alley entrance, ask for Marcus.',
    foodSafetyDeclaration: true,
    status: 'available',
    imageUrl: '/src/assets/images/hero_food_redistribution_1793275539454.jpg',
  });

  const listing2 = db.listings.create({
    providerId: provider2.id,
    providerName: provider2.organizationName || 'Grand Plaza Catering',
    providerPhone: provider2.phone,
    foodName: 'Individual Roasted Chicken & Mediterranean Veg Bowls',
    description: 'Chilled banquet catering surplus. High protein roasted chicken breast, quinoa, steamed broccoli, and roasted bell peppers in tamper-evident sealed meal trays.',
    category: 'Cooked Meals',
    quantity: 50,
    unit: 'servings',
    estimatedServings: 50,
    remainingQuantity: 25, // 25 requested & approved
    preparationTime: todayMinusHours(3),
    collectionStartTime: todayPlusHours(0.5),
    collectionDeadline: todayPlusHours(3.5),
    storageCondition: 'Refrigerated',
    allergens: ['None reported'],
    dietary: 'Non-Vegetarian',
    pickupAddress: '780 Mission Street, Loading Dock 2, SF, CA',
    latitude: 37.7858,
    longitude: -122.4042,
    contactInstructions: 'Report to security desk at Loading Dock 2 on Minna St.',
    foodSafetyDeclaration: true,
    status: 'partially_reserved',
    imageUrl: '/src/assets/images/safety_inspected_meals_1793275541061.jpg',
  });

  const listing3 = db.listings.create({
    providerId: provider2.id,
    providerName: provider2.organizationName || 'Grand Plaza Catering',
    providerPhone: provider2.phone,
    foodName: 'Warm Vegetable Lentil Curry & Jasmine Rice',
    description: 'Large thermal warming chafers of vegan lentil dal curry with cumin jasmine rice from private conference luncheon.',
    category: 'Cooked Meals',
    quantity: 40,
    unit: 'servings',
    estimatedServings: 40,
    remainingQuantity: 40,
    preparationTime: todayMinusHours(2),
    collectionStartTime: todayPlusHours(0.2),
    collectionDeadline: todayPlusHours(2.5), // High urgency!
    storageCondition: 'Heated Container',
    allergens: ['Legumes'],
    dietary: 'Vegan',
    pickupAddress: '780 Mission Street, Loading Dock 2, SF, CA',
    latitude: 37.7858,
    longitude: -122.4042,
    contactInstructions: 'Bring insulated cambro / thermal totes for handover.',
    foodSafetyDeclaration: true,
    status: 'available',
    imageUrl: '/src/assets/images/community_ngo_pickup_1793275540565.jpg',
  });

  // 4. Donation Request
  const request1 = db.requests.create({
    listingId: listing2.id,
    foodName: listing2.foodName,
    providerId: provider2.id,
    providerName: provider2.organizationName || 'Grand Plaza Catering',
    ngoId: ngo1.id,
    ngoName: ngo1.organizationName || 'Hope Community Kitchen',
    ngoPhone: ngo1.phone,
    requestedQuantity: 25,
    requestedServings: 25,
    pickupNotes: 'Hope Kitchen mobile dispatch van will pick up with insulated thermal carriers.',
    urgencyScore: 82,
    status: 'approved',
  });

  // 5. Pickup Task with secure verification code
  const secretCode = 'SP-8942';
  const hashedCode = crypto.createHash('sha256').update(secretCode).digest('hex');

  db.pickups.create({
    requestId: request1.id,
    listingId: listing2.id,
    providerId: provider2.id,
    providerName: provider2.organizationName || 'Grand Plaza Catering',
    providerAddress: listing2.pickupAddress,
    ngoId: ngo1.id,
    ngoName: ngo1.organizationName || 'Hope Community Kitchen',
    destinationAddress: ngo1.address || '1150 Folsom Street, SF',
    volunteerId: volunteer1.id,
    volunteerName: volunteer1.name,
    foodName: listing2.foodName,
    quantity: 25,
    unit: 'servings',
    collectionDeadline: listing2.collectionDeadline,
    status: 'assigned',
    verificationCodeHash: hashedCode,
    verificationCodePlain: secretCode,
    notes: 'Please verify packaging seals and temperature (< 4°C for refrigerated meals).',
  });

  // 6. Impact Records (completed historical donations)
  db.impactRecords.create({
    listingId: 'hist_01',
    providerId: provider1.id,
    providerName: provider1.organizationName || 'Green Harvest Bakery',
    ngoId: ngo1.id,
    ngoName: ngo1.organizationName || 'Hope Community Kitchen',
    volunteerId: volunteer1.id,
    quantityKg: 65,
    servingsCount: 130,
    category: 'Bakery & Bread',
    co2eAvoidedKg: 162.5,
  });

  db.impactRecords.create({
    listingId: 'hist_02',
    providerId: provider2.id,
    providerName: provider2.organizationName || 'Grand Plaza Catering',
    ngoId: ngo1.id,
    ngoName: ngo1.organizationName || 'Hope Community Kitchen',
    quantityKg: 90,
    servingsCount: 180,
    category: 'Cooked Meals',
    co2eAvoidedKg: 225.0,
  });

  // 7. Notifications
  db.notifications.create({
    userId: provider2.id,
    title: 'Donation Request Approved',
    message: 'You approved Hope Community Kitchen for 25 servings of Roasted Chicken & Veg Bowls.',
    type: 'approval',
    read: false,
  });

  db.notifications.create({
    userId: ngo1.id,
    title: 'Request Approved for Pickup',
    message: 'Grand Plaza Catering approved your request. Task assigned to volunteer Alex Rivera.',
    type: 'assignment',
    read: false,
  });

  db.notifications.create({
    userId: volunteer1.id,
    title: 'New Pickup Task Assigned',
    message: 'Pickup scheduled at Grand Plaza Catering (780 Mission Street) before deadline.',
    type: 'pickup',
    read: false,
  });

  // 8. Seed Partner Restaurants
  seedRestaurants();

  console.log('[Seed] Data seeding complete.');
}

export function seedRestaurants() {
  if (db.restaurants.find().length > 0) return;

  console.log('[Seed] Seeding verified partner restaurants...');

  db.restaurants.create({
    name: 'Green Harvest Artisanal Bakery & Cafe',
    tagline: 'Artisanal organic breads, morning viennoiserie, and daily deli sandwiches',
    cuisine: 'Bakery & Deli',
    organizationType: 'restaurant',
    photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1200&q=80',
    address: '42 Market Street, San Francisco, CA 94105',
    latitude: 37.7935,
    longitude: -122.3995,
    phone: '+1 (555) 246-8100',
    email: 'contact@greenharvestcafe.com',
    rating: 4.9,
    totalDonationsKg: 285.5,
    totalServingsDonated: 570,
    activeSurplusCount: 2,
    hygieneGrade: 'Grade A - ServSafe Certified',
    pickupHours: '15:00 - 20:30 Daily',
    dietaryOfferings: ['Vegetarian', 'Vegan', 'Gluten-Free Options'],
    description: 'Baking stoneground artisanal sourdough loaves, morning croissants, and baguettes with certified organic non-GMO flours. Dedicated zero-food-waste partner donating daily unsold baked goods in pristine condition.',
    isVerified: true,
  });

  db.restaurants.create({
    name: 'Grand Plaza Hotel & Banquet Catering',
    tagline: 'Executive hotel kitchen, banquet buffets, and conference dining',
    cuisine: 'Continental & Banquet Buffet',
    organizationType: 'hotel',
    photoUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    address: '780 Mission Street, Loading Dock 2, San Francisco, CA 94103',
    latitude: 37.7858,
    longitude: -122.4042,
    phone: '+1 (555) 349-9200',
    email: 'banquets@grandplazaresort.com',
    rating: 4.8,
    totalDonationsKg: 420.0,
    totalServingsDonated: 840,
    activeSurplusCount: 2,
    hygieneGrade: 'Grade A - HACCP Compliant',
    pickupHours: '14:30 - 22:00 Daily',
    dietaryOfferings: ['Halal Certified', 'High Protein', 'Gluten-Conscious'],
    description: 'Premier convention hotel and luxury event caterer. All surplus conference meals are packaged rapidly in food-grade insulated cambros with tamper-evident hygiene seals immediately after luncheon service.',
    isVerified: true,
  });

  db.restaurants.create({
    name: 'Spice Symphony Gourmet Indian Kitchen',
    tagline: 'Authentic slow-simmered curries, biryanis, and tandoori specialties',
    cuisine: 'North & South Indian',
    organizationType: 'restaurant',
    photoUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    address: '520 4th Street, San Francisco, CA 94107',
    latitude: 37.7812,
    longitude: -122.3989,
    phone: '+1 (555) 781-4320',
    email: 'kitchen@spicesymphonysf.com',
    rating: 4.9,
    totalDonationsKg: 195.0,
    totalServingsDonated: 390,
    activeSurplusCount: 1,
    hygieneGrade: 'Grade A - Clean Shield Verified',
    pickupHours: '15:00 - 23:00 Daily',
    dietaryOfferings: ['Vegetarian', 'Vegan', 'Halal'],
    description: 'Celebrated Indian culinary destination crafting fragrant yellow dal tadka, vegetable biryani, chickpea chana masala, and freshly baked garlic naans with wholesome natural spices.',
    isVerified: true,
  });

  db.restaurants.create({
    name: 'Olive & Thyme Mediterranean Kitchen',
    tagline: 'Heart-healthy grain bowls, roasted vegetable platters, and house pita',
    cuisine: 'Mediterranean & Greek',
    organizationType: 'restaurant',
    photoUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    address: '230 Brannan Street, San Francisco, CA 94107',
    latitude: 37.7824,
    longitude: -122.3921,
    phone: '+1 (555) 438-9921',
    email: 'nourish@olivethymekitchen.com',
    rating: 4.7,
    totalDonationsKg: 160.0,
    totalServingsDonated: 320,
    activeSurplusCount: 1,
    hygieneGrade: 'Grade A - Public Health Inspected',
    pickupHours: '13:30 - 21:00 Daily',
    dietaryOfferings: ['Vegetarian', 'Vegan', 'Dairy-Free'],
    description: 'Fresh Mediterranean cafe using cold-pressed olive oils, wild greens, roasted eggplant, and organic quinoa bowls. Regularly redistributes wholesome surplus portions to nearby food rescue pantries.',
    isVerified: true,
  });

  db.restaurants.create({
    name: 'Campus Dining Hall & Central Student Hostel',
    tagline: 'Institutional bulk student dining serving balanced nutritious meals',
    cuisine: 'Institutional & Campus Kitchen',
    organizationType: 'hostel',
    photoUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=1200&q=80',
    address: '850 Parnassus Avenue, San Francisco, CA 94143',
    latitude: 37.7631,
    longitude: -122.4578,
    phone: '+1 (555) 674-1190',
    email: 'dining@campusfoodrecovery.edu',
    rating: 4.8,
    totalDonationsKg: 530.0,
    totalServingsDonated: 1060,
    activeSurplusCount: 2,
    hygieneGrade: 'Grade A - Institutional Standard',
    pickupHours: '19:00 - 22:30 Daily',
    dietaryOfferings: ['Nut-Free', 'Vegetarian', 'Balanced Nutrition'],
    description: 'Serving thousands of university residents and hostel guests daily. Surplus bulk prepared dinner portions are transferred directly to verified community kitchens each evening under strict thermal monitoring.',
    isVerified: true,
  });

  db.restaurants.create({
    name: 'The Green Sprout Organic Salad & Juice Bar',
    tagline: 'Organic farm salads, cold-pressed juices, and fresh produce bowls',
    cuisine: 'Organic Farm-to-Table',
    organizationType: 'restaurant',
    photoUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    coverImageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    address: '145 2nd Street, San Francisco, CA 94105',
    latitude: 37.7885,
    longitude: -122.3998,
    phone: '+1 (555) 892-7711',
    email: 'orders@greensproutsf.com',
    rating: 4.9,
    totalDonationsKg: 140.0,
    totalServingsDonated: 280,
    activeSurplusCount: 1,
    hygieneGrade: 'Grade A - USDA Organic Handled',
    pickupHours: '17:00 - 20:00 Daily',
    dietaryOfferings: ['Vegan', 'Gluten-Free', 'Raw Organic'],
    description: 'Locally sourced California organic vegetables, freshly washed microgreens, cold-pressed citrus juices, and healthy protein bowls prepared every morning.',
    isVerified: true,
  });
}

