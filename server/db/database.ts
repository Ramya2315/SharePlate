/**
 * SharePlate Database Engine
 * Production-ready persistent document storage with atomic inventory locking,
 * concurrency safety, and full Mongoose-compatible schema concepts.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  IUser,
  IOrganizationVerification,
  IFoodListing,
  IDonationRequest,
  IPickupTask,
  IImpactRecord,
  INotification,
  IAuditLog,
  ISafetyReport,
  IRestaurant,
} from '../models/index.ts';

interface DatabaseSchema {
  users: IUser[];
  verifications: IOrganizationVerification[];
  listings: IFoodListing[];
  requests: IDonationRequest[];
  pickups: IPickupTask[];
  impactRecords: IImpactRecord[];
  notifications: INotification[];
  auditLogs: IAuditLog[];
  safetyReports: ISafetyReport[];
  restaurants: IRestaurant[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'shareplate_db.json');

class DatabaseEngine {
  private data: DatabaseSchema = {
    users: [],
    verifications: [],
    listings: [],
    requests: [],
    pickups: [],
    impactRecords: [],
    notifications: [],
    auditLogs: [],
    safetyReports: [],
    restaurants: [],
  };

  private lock = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.restaurants) this.data.restaurants = [];
      } else {
        this.persist();
      }
    } catch (err) {
      console.error('[DB] Failed to load data file, initializing in-memory:', err);
    }
  }

  public persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Persistence error:', err);
    }
  }

  // --- Collection Accessors ---

  public get users() {
    return {
      find: (predicate?: (u: IUser) => boolean) =>
        predicate ? this.data.users.filter(predicate) : [...this.data.users],
      findById: (id: string) => this.data.users.find((u) => u.id === id),
      findOne: (predicate: (u: IUser) => boolean) => this.data.users.find(predicate),
      create: (user: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): IUser => {
        const now = new Date().toISOString();
        const doc: IUser = {
          ...user,
          id: 'usr_' + crypto.randomBytes(6).toString('hex'),
          createdAt: now,
          updatedAt: now,
        };
        this.data.users.push(doc);
        this.persist();
        return doc;
      },
      updateOne: (id: string, updates: Partial<IUser>): IUser | null => {
        const idx = this.data.users.findIndex((u) => u.id === id);
        if (idx === -1) return null;
        this.data.users[idx] = {
          ...this.data.users[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        this.persist();
        return this.data.users[idx];
      },
    };
  }

  public get listings() {
    return {
      find: (predicate?: (l: IFoodListing) => boolean) =>
        predicate ? this.data.listings.filter(predicate) : [...this.data.listings],
      findById: (id: string) => this.data.listings.find((l) => l.id === id),
      create: (listing: Omit<IFoodListing, 'id' | 'createdAt' | 'updatedAt'>): IFoodListing => {
        const now = new Date().toISOString();
        const doc: IFoodListing = {
          ...listing,
          id: 'list_' + crypto.randomBytes(6).toString('hex'),
          createdAt: now,
          updatedAt: now,
        };
        this.data.listings.push(doc);
        this.persist();
        return doc;
      },
      updateOne: (id: string, updates: Partial<IFoodListing>): IFoodListing | null => {
        const idx = this.data.listings.findIndex((l) => l.id === id);
        if (idx === -1) return null;
        this.data.listings[idx] = {
          ...this.data.listings[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        this.persist();
        return this.data.listings[idx];
      },
      deleteOne: (id: string): boolean => {
        const idx = this.data.listings.findIndex((l) => l.id === id);
        if (idx === -1) return false;
        this.data.listings.splice(idx, 1);
        this.persist();
        return true;
      },
    };
  }

  public get requests() {
    return {
      find: (predicate?: (r: IDonationRequest) => boolean) =>
        predicate ? this.data.requests.filter(predicate) : [...this.data.requests],
      findById: (id: string) => this.data.requests.find((r) => r.id === id),
      create: (req: Omit<IDonationRequest, 'id' | 'createdAt' | 'updatedAt'>): IDonationRequest => {
        const now = new Date().toISOString();
        const doc: IDonationRequest = {
          ...req,
          id: 'req_' + crypto.randomBytes(6).toString('hex'),
          createdAt: now,
          updatedAt: now,
        };
        this.data.requests.push(doc);
        this.persist();
        return doc;
      },
      updateOne: (id: string, updates: Partial<IDonationRequest>): IDonationRequest | null => {
        const idx = this.data.requests.findIndex((r) => r.id === id);
        if (idx === -1) return null;
        this.data.requests[idx] = {
          ...this.data.requests[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        this.persist();
        return this.data.requests[idx];
      },
    };
  }

  public get pickups() {
    return {
      find: (predicate?: (p: IPickupTask) => boolean) =>
        predicate ? this.data.pickups.filter(predicate) : [...this.data.pickups],
      findById: (id: string) => this.data.pickups.find((p) => p.id === id),
      create: (pickup: Omit<IPickupTask, 'id' | 'createdAt' | 'updatedAt'>): IPickupTask => {
        const now = new Date().toISOString();
        const doc: IPickupTask = {
          ...pickup,
          id: 'pick_' + crypto.randomBytes(6).toString('hex'),
          createdAt: now,
          updatedAt: now,
        };
        this.data.pickups.push(doc);
        this.persist();
        return doc;
      },
      updateOne: (id: string, updates: Partial<IPickupTask>): IPickupTask | null => {
        const idx = this.data.pickups.findIndex((p) => p.id === id);
        if (idx === -1) return null;
        this.data.pickups[idx] = {
          ...this.data.pickups[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        this.persist();
        return this.data.pickups[idx];
      },
    };
  }

  public get verifications() {
    return {
      find: (predicate?: (v: IOrganizationVerification) => boolean) =>
        predicate ? this.data.verifications.filter(predicate) : [...this.data.verifications],
      findById: (id: string) => this.data.verifications.find((v) => v.id === id),
      create: (
        verif: Omit<IOrganizationVerification, 'id' | 'submittedAt'>
      ): IOrganizationVerification => {
        const doc: IOrganizationVerification = {
          ...verif,
          id: 'verif_' + crypto.randomBytes(6).toString('hex'),
          submittedAt: new Date().toISOString(),
        };
        this.data.verifications.push(doc);
        this.persist();
        return doc;
      },
      updateOne: (
        id: string,
        updates: Partial<IOrganizationVerification>
      ): IOrganizationVerification | null => {
        const idx = this.data.verifications.findIndex((v) => v.id === id);
        if (idx === -1) return null;
        this.data.verifications[idx] = {
          ...this.data.verifications[idx],
          ...updates,
          reviewedAt: new Date().toISOString(),
        };
        this.persist();
        return this.data.verifications[idx];
      },
    };
  }

  public get impactRecords() {
    return {
      find: (predicate?: (i: IImpactRecord) => boolean) =>
        predicate ? this.data.impactRecords.filter(predicate) : [...this.data.impactRecords],
      create: (record: Omit<IImpactRecord, 'id' | 'completedAt'>): IImpactRecord => {
        const doc: IImpactRecord = {
          ...record,
          id: 'imp_' + crypto.randomBytes(6).toString('hex'),
          completedAt: new Date().toISOString(),
        };
        this.data.impactRecords.push(doc);
        this.persist();
        return doc;
      },
    };
  }

  public get notifications() {
    return {
      find: (predicate?: (n: INotification) => boolean) =>
        predicate ? this.data.notifications.filter(predicate) : [...this.data.notifications],
      create: (n: Omit<INotification, 'id' | 'createdAt'>): INotification => {
        const doc: INotification = {
          ...n,
          id: 'notif_' + crypto.randomBytes(6).toString('hex'),
          createdAt: new Date().toISOString(),
        };
        this.data.notifications.push(doc);
        this.persist();
        return doc;
      },
      updateOne: (id: string, updates: Partial<INotification>): INotification | null => {
        const idx = this.data.notifications.findIndex((n) => n.id === id);
        if (idx === -1) return null;
        this.data.notifications[idx] = { ...this.data.notifications[idx], ...updates };
        this.persist();
        return this.data.notifications[idx];
      },
      markAllReadForUser: (userId: string) => {
        let changed = false;
        this.data.notifications.forEach((n) => {
          if (n.userId === userId && !n.read) {
            n.read = true;
            changed = true;
          }
        });
        if (changed) this.persist();
      },
    };
  }

  public get auditLogs() {
    return {
      find: (predicate?: (a: IAuditLog) => boolean) =>
        predicate ? this.data.auditLogs.filter(predicate) : [...this.data.auditLogs],
      create: (log: Omit<IAuditLog, 'id' | 'createdAt'>): IAuditLog => {
        const doc: IAuditLog = {
          ...log,
          id: 'audit_' + crypto.randomBytes(6).toString('hex'),
          createdAt: new Date().toISOString(),
        };
        this.data.auditLogs.push(doc);
        this.persist();
        return doc;
      },
    };
  }

  public get safetyReports() {
    return {
      find: (predicate?: (s: ISafetyReport) => boolean) =>
        predicate ? this.data.safetyReports.filter(predicate) : [...this.data.safetyReports],
      findById: (id: string) => this.data.safetyReports.find((s) => s.id === id),
      create: (rep: Omit<ISafetyReport, 'id' | 'createdAt'>): ISafetyReport => {
        const doc: ISafetyReport = {
          ...rep,
          id: 'rep_' + crypto.randomBytes(6).toString('hex'),
          createdAt: new Date().toISOString(),
        };
        this.data.safetyReports.push(doc);
        this.persist();
        return doc;
      },
      updateOne: (id: string, updates: Partial<ISafetyReport>): ISafetyReport | null => {
        const idx = this.data.safetyReports.findIndex((s) => s.id === id);
        if (idx === -1) return null;
        this.data.safetyReports[idx] = {
          ...this.data.safetyReports[idx],
          ...updates,
          resolvedAt: new Date().toISOString(),
        };
        this.persist();
        return this.data.safetyReports[idx];
      },
    };
  }

  public get restaurants() {
    return {
      find: (predicate?: (r: IRestaurant) => boolean) =>
        predicate ? this.data.restaurants.filter(predicate) : [...this.data.restaurants],
      findById: (id: string) => this.data.restaurants.find((r) => r.id === id),
      findOne: (predicate: (r: IRestaurant) => boolean) => this.data.restaurants.find(predicate),
      create: (rest: Omit<IRestaurant, 'id' | 'createdAt' | 'updatedAt'>): IRestaurant => {
        const now = new Date().toISOString();
        const doc: IRestaurant = {
          ...rest,
          id: 'rest_' + crypto.randomBytes(6).toString('hex'),
          createdAt: now,
          updatedAt: now,
        };
        this.data.restaurants.push(doc);
        this.persist();
        return doc;
      },
      updateOne: (id: string, updates: Partial<IRestaurant>): IRestaurant | null => {
        const idx = this.data.restaurants.findIndex((r) => r.id === id);
        if (idx === -1) return null;
        this.data.restaurants[idx] = {
          ...this.data.restaurants[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        this.persist();
        return this.data.restaurants[idx];
      },
      deleteOne: (id: string): boolean => {
        const idx = this.data.restaurants.findIndex((r) => r.id === id);
        if (idx === -1) return false;
        this.data.restaurants.splice(idx, 1);
        this.persist();
        return true;
      },
    };
  }

  /**
   * Concurrency-safe atomic reservation of food listing inventory.
   * Prevents two simultaneous approvals from claiming more than remaining available.
   */
  public atomicApproveRequest(requestId: string): {
    success: boolean;
    error?: string;
    request?: IDonationRequest;
    listing?: IFoodListing;
  } {
    // Acquire simple mutex lock
    while (this.lock) {
      // Synchronous spin wait
    }
    this.lock = true;

    try {
      const request = this.data.requests.find((r) => r.id === requestId);
      if (!request) {
        return { success: false, error: 'Request not found' };
      }
      if (request.status !== 'pending') {
        return { success: false, error: `Request cannot be approved from status '${request.status}'` };
      }

      const listing = this.data.listings.find((l) => l.id === request.listingId);
      if (!listing) {
        return { success: false, error: 'Associated food listing not found' };
      }

      // Check expiry
      if (new Date(listing.collectionDeadline).getTime() < Date.now()) {
        listing.status = 'expired';
        this.persist();
        return { success: false, error: 'Food listing has expired. Cannot approve donation.' };
      }

      // Check available quantity
      if (listing.remainingQuantity < request.requestedQuantity) {
        return {
          success: false,
          error: `Insufficient remaining inventory (${listing.remainingQuantity} ${listing.unit} available, requested ${request.requestedQuantity})`,
        };
      }

      // Decrement inventory atomically
      listing.remainingQuantity -= request.requestedQuantity;
      if (listing.remainingQuantity === 0) {
        listing.status = 'reserved';
      } else {
        listing.status = 'partially_reserved';
      }
      listing.updatedAt = new Date().toISOString();

      request.status = 'approved';
      request.updatedAt = new Date().toISOString();

      this.persist();
      return { success: true, request, listing };
    } finally {
      this.lock = false;
    }
  }

  /**
   * Release reserved inventory if request is cancelled or rejected before pickup.
   */
  public releaseReservedInventory(listingId: string, quantity: number) {
    const listing = this.data.listings.find((l) => l.id === listingId);
    if (!listing) return;

    listing.remainingQuantity = Math.min(listing.quantity, listing.remainingQuantity + quantity);
    if (listing.remainingQuantity === listing.quantity) {
      listing.status = 'available';
    } else if (listing.remainingQuantity > 0) {
      listing.status = 'partially_reserved';
    }
    listing.updatedAt = new Date().toISOString();
    this.persist();
  }
}

export const db = new DatabaseEngine();
