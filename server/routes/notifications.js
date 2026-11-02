import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  registerSSEClient,
  getUnreadCount,
  getUserPreferences,
  updateUserPreferences,
  checkSlaBreaches,
} from '../services/notificationService.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campusfix_jwt_secret_dev_key_2026';

/**
 * GET /api/notifications/stream
 * Real-time Server-Sent Events (SSE) stream
 * Supports token via query parameter or Authorization header
 */
router.get('/stream', (req, res) => {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Token required for SSE stream' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    // Set headers for SSE stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    registerSSEClient(userId, res);
  } catch {
    return res.status(403).json({ error: 'INVALID_TOKEN', message: 'Token validation failed' });
  }
});

// All subsequent routes require standard Authorization header
router.use(authenticateToken);

/**
 * GET /api/notifications
 * Retrieve notification history for the authenticated user with filters & search
 */
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { unreadOnly, search, limit = 50, offset = 0, priority } = req.query;

    let query = `
      SELECT n.*, 
             t.ticket_number, 
             t.title as ticket_title, 
             t.status as ticket_status, 
             t.priority as ticket_priority, 
             t.building, 
             t.room
      FROM notifications n
      LEFT JOIN tickets t ON n.ticket_id = t.id
      WHERE n.user_id = ?
    `;
    const params = [userId];

    if (unreadOnly === 'true' || unreadOnly === '1') {
      query += ' AND n.is_read = 0';
    }

    if (priority && priority !== 'all') {
      query += ' AND n.priority = ?';
      params.push(priority);
    }

    if (search && search.trim()) {
      const s = `%${search.trim().toLowerCase()}%`;
      query += ' AND (LOWER(n.title) LIKE ? OR LOWER(n.message) LIKE ? OR LOWER(t.ticket_number) LIKE ?)';
      params.push(s, s, s);
    }

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const notifications = db.prepare(query).all(...params);
    const unreadCount = getUnreadCount(userId);

    // Also run periodic SLA breach detection in the background when active
    if (req.user.role === 'Administrator') {
      setTimeout(() => checkSlaBreaches(), 0);
    }

    return res.json({
      success: true,
      unreadCount,
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    console.error('[Get Notifications Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve notifications' });
  }
});

/**
 * GET /api/notifications/unread-count
 * Lightweight polling/badging endpoint
 */
router.get('/unread-count', (req, res) => {
  try {
    const count = getUnreadCount(req.user.id);
    return res.json({ success: true, unreadCount: count });
  } catch (err) {
    console.error('[Get Unread Count Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to get unread count' });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
router.patch('/:id/read', (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const notif = db.prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?').get(notifId, userId);
    if (!notif) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' });
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notifId);
    const unreadCount = getUnreadCount(userId);

    return res.json({
      success: true,
      message: 'Notification marked as read',
      unreadCount,
    });
  } catch (err) {
    console.error('[Mark Read Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update notification' });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications for the authenticated user as read
 */
router.patch('/read-all', (req, res) => {
  try {
    const userId = req.user.id;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(userId);

    return res.json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (err) {
    console.error('[Mark All Read Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to mark all as read' });
  }
});

/**
 * DELETE /api/notifications/:id
 * Remove or dismiss a specific notification
 */
router.delete('/:id', (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const result = db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(notifId, userId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' });
    }

    const unreadCount = getUnreadCount(userId);
    return res.json({
      success: true,
      message: 'Notification deleted',
      unreadCount,
    });
  } catch (err) {
    console.error('[Delete Notification Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete notification' });
  }
});

/**
 * DELETE /api/notifications
 * Clear all read notifications for current user
 */
router.delete('/', (req, res) => {
  try {
    const userId = req.user.id;
    const result = db.prepare('DELETE FROM notifications WHERE user_id = ? AND is_read = 1').run(userId);

    return res.json({
      success: true,
      message: `Cleared ${result.changes} read notification(s)`,
      unreadCount: getUnreadCount(userId),
    });
  } catch (err) {
    console.error('[Clear Read Notifications Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to clear read notifications' });
  }
});

/**
 * GET /api/notifications/preferences
 * Retrieve notification preferences for current user
 */
router.get('/preferences', (req, res) => {
  try {
    const prefs = getUserPreferences(req.user.id);
    return res.json({
      success: true,
      preferences: {
        emailEnabled: !!prefs.email_enabled,
        inAppEnabled: !!prefs.in_app_enabled,
        soundEnabled: !!prefs.sound_enabled,
      },
    });
  } catch (err) {
    console.error('[Get Preferences Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to get preferences' });
  }
});

/**
 * PATCH /api/notifications/preferences
 * Update email or in-app notification toggles
 */
router.patch('/preferences', (req, res) => {
  try {
    const { emailEnabled, inAppEnabled, soundEnabled } = req.body;
    const updated = updateUserPreferences(req.user.id, { emailEnabled, inAppEnabled, soundEnabled });

    return res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: updated,
    });
  } catch (err) {
    console.error('[Update Preferences Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update preferences' });
  }
});

/**
 * POST /api/notifications/simulate-sla-check
 * Trigger SLA breach and recurring issue scanning (Admin only)
 */
router.post('/simulate-sla-check', (req, res) => {
  try {
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin access required' });
    }
    const breaches = checkSlaBreaches();
    return res.json({
      success: true,
      message: `SLA breach scan completed. ${breaches} alert(s) dispatched.`,
    });
  } catch (err) {
    console.error('[SLA Check Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to run SLA check' });
  }
});

export default router;

