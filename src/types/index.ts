/**
 * SharePlate Frontend Type Definitions
 */

export type UserRole = 'provider' | 'ngo' | 'volunteer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  organizationName?: string;
  organizationType?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isVerified: boolean;
  dailyCapacityServings?: number;
  acceptedCategories?: string[];
  dietaryPreferences?: string[];
  createdAt: string;
}

export interface FoodListing {
  id: string;
  providerId: string;
  providerName: string;
  providerPhone?: string;
  foodName: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedServings: number;
  remainingQuantity: number;
  preparationTime: string;
  collectionStartTime: string;
  collectionDeadline: string;
  storageCondition: string;
  allergens: string[];
  dietary: string;
  pickupAddress: string;
  latitude?: number;
  longitude?: number;
  contactInstructions?: string;
  foodSafetyDeclaration: boolean;
  status: 'available' | 'partially_reserved' | 'reserved' | 'completed' | 'cancelled' | 'expired';
  imageUrl?: string;
  createdAt: string;
  urgency?: {
    urgency_score: number;
    priority: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'EXPIRED';
    hours_remaining: number;
    is_expired: boolean;
    description: string;
  };
}

export interface DonationRequest {
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
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'picked_up' | 'delivered';
  rejectionReason?: string;
  createdAt: string;
}

export interface PickupTask {
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
  status: 'assigned' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';
  verificationCodePlain?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface OrganizationVerification {
  id: string;
  userId: string;
  organizationName: string;
  organizationType: string;
  registrationNumber: string;
  contactPerson: string;
  phone: string;
  address: string;
  documentsDescription: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNotes?: string;
  submittedAt: string;
}

export interface PlatformAnalytics {
  metrics: {
    totalKgRescued: number;
    totalServings: number;
    totalCo2eAvoidedKg: number;
    activeListings: number;
    expiredListings: number;
    completedDonations: number;
    pickupSuccessRate: number;
    registeredOrganizations: number;
    activeVolunteers: number;
  };
  categoryData: { name: string; value: number }[];
  trendData: { day: string; servings: number; kg: number }[];
  methodology: {
    servingsAssumption: string;
    carbonBaseline: string;
    dataStatus: string;
  };
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  relatedEntityId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  reporterEmail: string;
  reportedEntityType: string;
  reportedEntityId: string;
  reportedEntityTitle: string;
  issueType: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolutionNotes?: string;
  createdAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  tagline?: string;
  cuisine: string;
  organizationType: string;
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
  hygieneGrade: string;
  pickupHours: string;
  dietaryOfferings: string[];
  description: string;
  isVerified: boolean;
  liveListings?: {
    id: string;
    foodName: string;
    category: string;
    remainingQuantity: number;
    unit: string;
    collectionDeadline: string;
  }[];
  createdAt: string;
}

