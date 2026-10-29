/**
 * In-app Notification Routes
 */

import { Router, Response } from 'express';
import { db } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET notifications for current user
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifs = db.notifications
    .find((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifs.filter((n) => !n.read).length;
  res.json({ notifications: notifs, unreadCount });
});

// PUT mark single notification as read
router.put('/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const updated = db.notifications.updateOne(id, { read: true });
  res.json({ notification: updated });
});

// PUT mark all notifications as read for current user
router.put('/read-all', authenticate, (req: AuthenticatedRequest, res: Response) => {
  db.notifications.markAllReadForUser(req.user!.id);
  res.json({ message: 'All notifications marked as read.' });
});

export default router;
