/**
 * User Role Management Routes
 * Admin-governed user role assignment, permissions audit, and account status management.
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { requireRole, requirePermission, ROLE_PERMISSIONS } from '../middleware/rbac.ts';
import { UserRole } from '../models/index.ts';

const router = Router();

// GET all users (Admin only)
router.get('/', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { role, isVerified, search } = req.query;
  let users = db.users.find();

  if (role && typeof role === 'string' && role !== 'all') {
    users = users.filter((u) => u.role === role);
  }

  if (isVerified !== undefined) {
    const boolVal = isVerified === 'true';
    users = users.filter((u) => u.isVerified === boolVal);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.organizationName && u.organizationName.toLowerCase().includes(q))
    );
  }

  const cleanUsers = users.map(({ passwordHash, ...rest }) => rest);
  res.json({ users: cleanUsers, count: cleanUsers.length });
});

// GET role permissions matrix (Public/Authenticated)
router.get('/permissions', authenticate, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    roles: ['admin', 'provider', 'ngo', 'volunteer'],
    matrix: ROLE_PERMISSIONS,
    currentUserRole: req.user?.role,
    currentUserPermissions: req.user ? ROLE_PERMISSIONS[req.user.role] : [],
  });
});

// PUT update user role (Admin only - Secured)
router.put('/:id/role', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles: UserRole[] = ['provider', 'ngo', 'volunteer', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Invalid role. Allowed roles: ${validRoles.join(', ')}` });
  }

  const targetUser = db.users.findById(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const previousRole = targetUser.role;
  const updatedUser = db.users.updateOne(id, { role });

  // Record security audit log
  db.auditLogs.create({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'admin',
    action: 'USER_ROLE_CHANGED',
    resourceType: 'User',
    resourceId: id,
    details: {
      userEmail: targetUser.email,
      fromRole: previousRole,
      toRole: role,
      updatedBy: req.user!.email,
    },
  });

  // Notify user
  db.notifications.create({
    userId: id,
    title: 'Account Role Updated',
    message: `Your SharePlate platform access level has been updated from ${previousRole.toUpperCase()} to ${role.toUpperCase()} by an administrator.`,
    type: 'system',
    read: false,
  });

  const { passwordHash: _, ...clean } = updatedUser!;
  res.json({
    message: `User role successfully updated to ${role}.`,
    user: clean,
  });
});

// PUT toggle or set verification status
router.put('/:id/verification', authenticate, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { isVerified } = req.body;

  if (typeof isVerified !== 'boolean') {
    return res.status(400).json({ error: 'isVerified must be a boolean value.' });
  }

  const targetUser = db.users.findById(id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updatedUser = db.users.updateOne(id, { isVerified });

  db.auditLogs.create({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    actorRole: 'admin',
    action: isVerified ? 'USER_VERIFIED' : 'USER_UNVERIFIED',
    resourceType: 'User',
    resourceId: id,
    details: { userEmail: targetUser.email, isVerified },
  });

  const { passwordHash: _, ...clean } = updatedUser!;
  res.json({
    message: `User verification updated to ${isVerified ? 'VERIFIED' : 'UNVERIFIED'}.`,
    user: clean,
  });
});

export default router;
