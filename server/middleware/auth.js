import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'campusfix_jwt_secret_key_2026_infrastructure_access_token_secure';

/**
 * Middleware: Verify Bearer JWT Token and attach active user
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication token missing. Please sign in.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        collegeId: true,
        role: true,
        userType: true,
        department: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'USER_NOT_FOUND',
        message: 'Account no longer exists.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: 'This account has been deactivated by an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please sign in again.',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Invalid session token. Please sign in again.',
      });
    }
    console.error('[Auth Middleware Error]:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to verify account session' });
  }
}

/**
 * Middleware: Restrict access to designated roles
 * @param {string[]} allowedRoles Array of allowed role names (e.g. ['Technician', 'Administrator'])
 */
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Access denied. Requires one of [${allowedRoles.join(', ')}], but your role is '${req.user.role}'.`,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
}
