import { Router } from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Strictly enforce Administrator role on all admin routes
router.use(authenticateToken);
router.use(requireRole(['Administrator']));

/**
 * GET /api/admin/users
 * Returns list of all registered users in the database
 */
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, college_id, role, user_type, department, status, created_at, last_login
      FROM users
      ORDER BY id ASC
    `).all();

    return res.json({ success: true, users });
  } catch (err) {
    console.error('[Admin Users Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve users' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Allows an Administrator to securely change/promote a user's role.
 * Satisfies Requirement 8: Privileged roles must be granted through a secure administrative process.
 */
router.patch('/users/:id/role', (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { newRole } = req.body;

    const validRoles = ['Reporter', 'Technician', 'Administrator'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({
        error: 'INVALID_ROLE',
        message: `Role must be one of: ${validRoles.join(', ')}`,
      });
    }

    const targetUser = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Target user not found.' });
    }

    // Prevent removing the last administrator
    if (targetUser.role === 'Administrator' && newRole !== 'Administrator') {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Administrator'").get();
      if (adminCount.count <= 1) {
        return res.status(400).json({
          error: 'CANNOT_DEMOTE_LAST_ADMIN',
          message: 'Cannot demote the sole remaining Administrator account.',
        });
      }
    }

    // Update role
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, targetUserId);

    // Record in audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, ?, ?)
    `).run(
      req.user.id,
      'ROLE_CHANGE',
      `Administrator ${req.user.name} changed role of ${targetUser.name} (${targetUser.email}) from ${targetUser.role} to ${newRole}`
    );

    return res.json({
      success: true,
      message: `Successfully updated ${targetUser.name}'s role to ${newRole}.`,
      updatedUser: {
        id: targetUserId,
        role: newRole,
      },
    });
  } catch (err) {
    console.error('[Admin Role Update Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update user role.' });
  }
});

/**
 * GET /api/admin/stats
 * Overview stats for the Administrator dashboard
 */
router.get('/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const reporters = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Reporter'").get().count;
    const technicians = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Technician'").get().count;
    const administrators = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Administrator'").get().count;
    const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        reporters,
        technicians,
        administrators,
        categoriesCount,
        systemHealth: 'Optimal',
        uptime: '99.98%',
      },
    });
  } catch (err) {
    console.error('[Admin Stats Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch admin stats' });
  }
});

export default router;
