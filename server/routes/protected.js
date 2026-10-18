import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Apply auth token verification to all routes in this file
router.use(authenticateToken);

/**
 * GET /api/protected/reporter-area
 * Accessible by: Reporter, Technician, Administrator
 */
router.get('/reporter-area', requireRole(['Reporter', 'Technician', 'Administrator']), (req, res) => {
  return res.json({
    success: true,
    message: 'Authorized: Access granted to Reporter Incident Center.',
    userRole: req.user.role,
    allowedRoles: ['Reporter', 'Technician', 'Administrator'],
    timestamp: new Date().toISOString(),
    details: {
      actionPermissions: [
        'Submit new infrastructure incident reports',
        'Upload classroom/lab photos or error logs',
        'Track personal incident progress in real-time',
        'Confirm problem resolution and rate technician response'
      ],
      sampleCategories: ['Network', 'Hardware', 'Software', 'Power', 'Classroom Equipment', 'Servers']
    }
  });
});

/**
 * GET /api/protected/technician-queue
 * Accessible by: Technician, Administrator
 * Forbidden to: Reporter (HTTP 403)
 */
router.get('/technician-queue', requireRole(['Technician', 'Administrator']), (req, res) => {
  return res.json({
    success: true,
    message: 'Authorized: Access granted to Technician Operations Queue.',
    userRole: req.user.role,
    allowedRoles: ['Technician', 'Administrator'],
    timestamp: new Date().toISOString(),
    details: {
      actionPermissions: [
        'Inspect assigned campus tickets',
        'Acknowledge incident and update status (Assigned -> In Progress -> Resolved)',
        'Add technical diagnostic notes & hardware parts log',
        'Request administrative re-assignment or priority escalation'
      ]
    }
  });
});

/**
 * GET /api/protected/admin-console
 * Accessible by: Administrator ONLY
 * Forbidden to: Reporter, Technician (HTTP 403)
 */
router.get('/admin-console', requireRole(['Administrator']), (req, res) => {
  return res.json({
    success: true,
    message: 'Authorized: Full access granted to Campus Operations Control Center.',
    userRole: req.user.role,
    allowedRoles: ['Administrator'],
    timestamp: new Date().toISOString(),
    details: {
      actionPermissions: [
        'Manage campus members & grant privileged roles',
        'Assign and balance technician ticket workloads',
        'Configure incident categories and SLA urgency guidelines',
        'Perform official ticket closures and inspect audit trails'
      ]
    }
  });
});

export default router;
