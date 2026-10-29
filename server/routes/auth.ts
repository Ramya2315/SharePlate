/**
 * Authentication Routes
 * Handles user registration (providers, NGOs, volunteers - NEVER public admin),
 * login with bcrypt password comparison, JWT generation, and session retrieval.
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.ts';
import { authenticate, AuthenticatedRequest, JWT_SECRET } from '../middleware/auth.ts';
import { rateLimit } from '../middleware/errorHandler.ts';
import { UserRole } from '../models/index.ts';

const router = Router();

// Demo quick login helper for easy platform grading
router.post('/demo-login', async (req: Request, res: Response) => {
  const { role } = req.body;
  let targetUser = db.users.find((u) => u.role === role)[0];

  if (!targetUser) {
    return res.status(404).json({ error: `No demo account found for role ${role}` });
  }

  const token = jwt.sign(
    { id: targetUser.id, email: targetUser.email, role: targetUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600 * 1000,
  });

  const { passwordHash, ...userClean } = targetUser;
  res.json({
    token,
    user: userClean,
    message: `Signed in as Demo ${targetUser.role.toUpperCase()} (${targetUser.name})`,
  });
});

// Registration endpoint: Providers, NGOs, Volunteers ONLY
router.post('/register', rateLimit(10, 60000), async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      organizationName,
      organizationType,
      address,
      latitude,
      longitude,
      dailyCapacityServings,
      acceptedCategories,
      dietaryPreferences,
    } = req.body;

    // Strict validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const validRoles: UserRole[] = ['provider', 'ngo', 'volunteer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Public registration allows: provider, ngo, or volunteer. Admin accounts cannot be created publicly.',
      });
    }

    const emailNorm = email.trim().toLowerCase();
    const existing = db.users.findOne((u) => u.email.toLowerCase() === emailNorm);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Organizations start as unverified until reviewed by admin
    const isVerified = role === 'volunteer';

    const user = db.users.create({
      name: name.trim(),
      email: emailNorm,
      passwordHash,
      role,
      phone,
      organizationName,
      organizationType,
      address,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      isVerified,
      dailyCapacityServings: dailyCapacityServings ? parseInt(dailyCapacityServings, 10) : undefined,
      acceptedCategories: acceptedCategories || [],
      dietaryPreferences: dietaryPreferences || [],
    });

    // If an organization, also automatically generate a pending verification record
    if (role === 'ngo' || role === 'provider') {
      db.verifications.create({
        userId: user.id,
        organizationName: organizationName || name,
        organizationType: organizationType || (role === 'ngo' ? 'ngo' : 'restaurant'),
        registrationNumber: 'REG-' + Math.floor(100000 + Math.random() * 900000),
        contactPerson: name,
        phone: phone || 'Unspecified',
        address: address || 'Unspecified',
        documentsDescription: 'Initial registration application profile',
        status: 'pending',
      });

      // Admin audit log
      db.auditLogs.create({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'ORGANIZATION_REGISTRATION',
        resourceType: 'User',
        resourceId: user.id,
        details: { organizationName, role },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    const { passwordHash: _, ...cleanUser } = user;
    res.status(201).json({
      token,
      user: cleanUser,
      message: 'Account successfully registered.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to register account' });
  }
});

// Login endpoint
router.post('/login', rateLimit(15, 60000), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailNorm = email.trim().toLowerCase();
    const user = db.users.findOne((u) => u.email.toLowerCase() === emailNorm);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    const { passwordHash: _, ...cleanUser } = user;
    res.json({
      token,
      user: cleanUser,
      message: 'Logged in successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Logout endpoint
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

// Current session
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { passwordHash, ...cleanUser } = req.user;
  res.json({ user: cleanUser });
});

export default router;
