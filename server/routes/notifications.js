import { Router } from 'express';
import prisma from '../prismaClient.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/notifications
 * Get notifications for current user
 */
router.get('/', async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const user = req.user;

    const where = { userId: user.id };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error('[Get Notifications Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve notifications' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    const user = req.user;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' });
    }

    if (notification.userId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('[Mark Read Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to mark notification as read' });
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.post('/mark-all-read', async (req, res) => {
  try {
    const user = req.user;

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[Mark All Read Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to mark all as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id, 10);
    const user = req.user;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' });
    }

    if (notification.userId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('[Delete Notification Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete notification' });
  }
});

export default router;