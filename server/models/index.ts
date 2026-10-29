/**
 * SharePlate Data Model Interfaces and Enums
 */

export type UserRole = 'provider' | 'ngo' | 'volunteer' | 'admin';

export type OrganizationType = 'restaurant' | 'hotel' | 'hostel' | 'caterer' | 'event_organizer' | 'ngo' | 'food_bank' | 'community_kitchen';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type FoodCategory =
  | 'Cooked Meals'
  | 'Bakery & Bread'
  | 'Fresh Produce'
  | 'Packaged Goods'
  | 'Dairy & Refrigerated'
  | 'Beverages';

export type DietaryType = 'Vegetarian' | 'Non-Vegetarian' | 'Vegan' | 'Halal' | 'Kosher' | 'Any';

export type StorageCondition = 'Room Temperature' | 'Refrigerated' | 'Heated Container' | 'Dry Storage';

// State machine for FoodListing:
// available -> reserved -> completed (or expired, cancelled)
export type FoodListingStatus =
  | 'available'
  | 'partially_reserved'
  | 'reserved'
  | 'completed'
  | 'cancelled'
  | 'expired';

// State machine for DonationRequest:
// pending -> approved -> picked_up -> delivered (or rejected, cancelled)
export type DonationRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'picked_up'
  | 'delivered';

// State machine for PickupTask:
// assigned -> accepted -> picked_up -> delivered (or cancelled)
export type PickupTaskStatus =
  | 'assigned'
  | 'accepted'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  organizationName?: string;
  organizationType?: OrganizationType;
  address?: string;
  latitude?: number;
  longitude?: number;
  isVerified: boolean;
  dailyCapacityServings?: number;
  acceptedCategories?: string[];
  dietaryPreferences?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IOrganizationVerification {
  id: string;
  userId: string;
  organizationName: string;
  organizationType: OrganizationType;
  registrationNumber: string;
  contactPerson: string;
  phone: string;
  address: string;
  documentsDescription: string;
  status: VerificationStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface IFoodListing {
  id: string;
  providerId: string;
  providerName: string;
  providerPhone?: string;
  foodName: string;
  description: string;
  category: FoodCategory;
  quantity: number; // e.g. 25
  unit: string; // e.g. 'kg', 'servings', 'boxes'
  estimatedServings: number;
  remainingQuantity: number;
  preparationTime: string; // ISO
  collectionStartTime: string; // ISO
  collectionDeadline: string; // ISO
  storageCondition: StorageCondition;
  allergens: string[]; // e.g. ['Gluten', 'Dairy', 'Nuts']
  dietary: DietaryType;
  pickupAddress: string;
  latitude?: number;
  longitude?: number;
  contactInstructions?: string;
  foodSafetyDeclaration: boolean;
  status: FoodListingStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDonationRequest {
  id: string;
  listingId: string;
  foodName: string;
  providerId: string;
  providerName: string;
  ngoId: string;
  ngoName: string;
  ngoPhone?: string;
  requestedQuantity: number;
  requestedServings: number;
  pickupNotes?: string;
  urgencyScore?: number;
  status: DonationRequestStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPickupTask {
  id: string;
  requestId: string;
  listingId: string;
  providerId: string;
  providerName: string;
  providerAddress: string;
  ngoId: string;
  ngoName: string;
  destinationAddress: string;
  volunteerId?: string;
  volunteerName?: string;
  foodName: string;
  quantity: number;
  unit: string;
  collectionDeadline: string;
  status: PickupTaskStatus;
  verificationCodeHash: string; // SHA-256 hash of single-use pickup verification code
  verificationCodePlain?: string; // Stored securely for demo/active task display
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IImpactRecord {
  id: string;
  listingId: string;
  providerId: string;
  providerName: string;
  ngoId: string;
  ngoName: string;
  volunteerId?: string;
  quantityKg: number;
  servingsCount: number;
  category: string;
  co2eAvoidedKg: number;
  completedAt: string;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'request' | 'approval' | 'assignment' | 'pickup' | 'verification' | 'system' | 'safety';
  read: boolean;
  relatedEntityId?: string;
  createdAt: string;
}

export interface IAuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface ISafetyReport {
  id: string;
  reporterId: string;
  reporterEmail: string;
  reportedEntityType: 'listing' | 'provider' | 'ngo' | 'volunteer';
  reportedEntityId: string;
  reportedEntityTitle: string;
  issueType: 'food_safety' | 'temperature_abuse' | 'hygiene' | 'no_show' | 'misleading_quantity' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface IRestaurant {
  id: string;
  name: string;
  tagline?: string;
  cuisine: string;
  organizationType: OrganizationType;
  ownerId?: string;
  photoUrl: string;
  coverImageUrl?: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  rating: number;
  totalDonationsKg: number;
  totalServingsDonated: number;
  activeSurplusCount: number;
  hygieneGrade: string; // e.g. "Grade A - Safety Certified"
  pickupHours: string; // e.g. "14:00 - 22:30 Daily"
  dietaryOfferings: string[]; // e.g. ["Vegetarian", "Vegan", "Halal"]
  description: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

