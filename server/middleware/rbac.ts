/**
 * Role-Based Access Control (RBAC) and Permission Matrix Middleware
 * Defines roles: Provider, NGO, Volunteer, and Admin with strict capability gating.
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.ts';
import { UserRole } from '../models/index.ts';

export type Permission =
  | 'LISTINGS_CREATE'
  | 'LISTINGS_EDIT_OWN'
  | 'LISTINGS_DELETE_OWN'
  | 'REQUESTS_CREATE'
  | 'REQUESTS_APPROVE_OWN'
  | 'REQUESTS_CANCEL_OWN'
  | 'PICKUPS_CLAIM'
  | 'PICKUPS_VERIFY'
  | 'VERIFICATIONS_MANAGE'
  | 'USERS_MANAGE_ROLES'
  | 'SAFETY_REPORTS_RESOLVE'
  | 'AUDIT_LOGS_VIEW'
  | 'ANALYTICS_VIEW';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'LISTINGS_CREATE',
    'LISTINGS_EDIT_OWN',
    'LISTINGS_DELETE_OWN',
    'REQUESTS_CREATE',
    'REQUESTS_APPROVE_OWN',
    'REQUESTS_CANCEL_OWN',
    'PICKUPS_CLAIM',
    'PICKUPS_VERIFY',
    'VERIFICATIONS_MANAGE',
    'USERS_MANAGE_ROLES',
    'SAFETY_REPORTS_RESOLVE',
    'AUDIT_LOGS_VIEW',
    'ANALYTICS_VIEW',
  ],
  provider: [
    'LISTINGS_CREATE',
    'LISTINGS_EDIT_OWN',
    'LISTINGS_DELETE_OWN',
    'REQUESTS_APPROVE_OWN',
    'PICKUPS_VERIFY',
    'ANALYTICS_VIEW',
  ],
  ngo: [
    'REQUESTS_CREATE',
    'REQUESTS_CANCEL_OWN',
    'PICKUPS_VERIFY',
    'ANALYTICS_VIEW',
  ],
  volunteer: [
    'PICKUPS_CLAIM',
    'PICKUPS_VERIFY',
    'ANALYTICS_VIEW',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized for this action. Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      res.status(403).json({
        error: `Permission denied. Role '${req.user.role}' lacks capability '${permission}'.`,
      });
      return;
    }

    next();
  };
}

export function requireVerifiedOrganization(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Admins always bypass organization verification
  if (req.user.role === 'admin') {
    return next();
  }

  if ((req.user.role === 'ngo' || req.user.role === 'provider') && !req.user.isVerified) {
    res.status(403).json({
      error: 'Organization verification required before performing this action. Please check your verification status.',
      verificationStatus: 'pending',
    });
    return;
  }

  next();
}
