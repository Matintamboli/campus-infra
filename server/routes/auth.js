import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

const router = Router();

// Email validation helper regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Public registration: strictly provisions accounts with 'Reporter' role.
 * Privileged roles (Technician, Administrator) can only be granted via administrative promotion.
 */
router.post('/register', (req, res) => {
  try {
    const { fullName, email, collegeId, password, roleRequested } = req.body;

    // Field validations
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Full name is required.' });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'A valid email address is required.' });
    }

    if (!collegeId || typeof collegeId !== 'string' || !collegeId.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'College / Staff ID is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCollegeId = collegeId.trim().toUpperCase();
    const cleanName = fullName.trim();

    // Check if email already registered
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existingEmail) {
      return res.status(409).json({
        error: 'DUPLICATE_EMAIL',
        message: 'This email is already registered in the campus directory. Please sign in.',
      });
    }

    // Check if college ID already registered
    const existingId = db.prepare('SELECT id FROM users WHERE college_id = ?').get(cleanCollegeId);
    if (existingId) {
      return res.status(409).json({
        error: 'DUPLICATE_COLLEGE_ID',
        message: 'This College ID is already registered. If this is yours, please sign in or recover your account.',
      });
    }

    // Hash password with bcrypt (10 rounds)
    const saltRounds = 10;
    const passwordHash = bcrypt.hashSync(password, saltRounds);

    // SECURITY ENFORCEMENT (Requirement 8):
    // Public registration CANNOT self-assign 'Technician' or 'Administrator' roles.
    // All public signups are created as 'Reporter'.
    const assignedRole = 'Reporter';
    const userType = cleanEmail.includes('fac') || cleanEmail.includes('prof') ? 'Faculty' : 'Student';
    const department = 'Campus Infrastructure User';

    // Insert user into SQLite database
    const insertStmt = db.prepare(`
      INSERT INTO users (name, email, college_id, password_hash, role, user_type, department)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      cleanName,
      cleanEmail,
      cleanCollegeId,
      passwordHash,
      assignedRole,
      userType,
      department
    );

    const newUserId = Number(result.lastInsertRowid);

    // Log registration in audit log
    const auditStmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, ?, ?)
    `);
    auditStmt.run(
      newUserId,
      'USER_REGISTERED',
      `Registered as Reporter. (Requested: ${roleRequested || 'Reporter'})`
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: newUserId, email: cleanEmail, role: assignedRole },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userPayload = {
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      collegeId: cleanCollegeId,
      role: assignedRole,
      userType,
      department,
    };

    let responseMessage = 'Registration complete! Welcome to CampusFix.';
    if (roleRequested && roleRequested !== 'Reporter' && roleRequested !== 'Student') {
      responseMessage = `Account registered as Reporter. Note: Technician and Administrator roles must be authorized by campus IT administrators.`;
    }

    return res.status(201).json({
      success: true,
      token,
      user: userPayload,
      message: responseMessage,
    });
  } catch (err) {
    console.error('[Register Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error processing registration.' });
  }
});

/**
 * POST /api/auth/login
 * Validates identifier (email or college ID) and password against hashed database records.
 */
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Please provide your College Email or Student/Staff ID.',
      });
    }

    if (!password) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Password is required.',
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Query user by email OR college_id
    const user = db.prepare(`
      SELECT id, name, email, college_id, password_hash, role, user_type, department, status
      FROM users
      WHERE LOWER(email) = ? OR LOWER(college_id) = ?
    `).get(cleanIdentifier, cleanIdentifier);

    if (!user) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid campus email/ID or password. Please verify your credentials.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: 'This campus account is suspended. Contact campus IT helpdesk.',
      });
    }

    // Verify password hash
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid campus email/ID or password. Please verify your credentials.',
      });
    }

    // Update last_login
    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(user.id, 'USER_LOGIN', `Logged in via credentials (${user.role})`);

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        collegeId: user.college_id,
        role: user.role,
        userType: user.user_type,
        department: user.department,
      },
      message: `Welcome back, ${user.name}!`,
    });
  } catch (err) {
    console.error('[Login Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal error processing sign in.' });
  }
});

/**
 * GET /api/auth/me
 * Restores and verifies authenticated user session
 */
router.get('/me', authenticateToken, (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      collegeId: req.user.college_id,
      role: req.user.role,
      userType: req.user.user_type,
      department: req.user.department,
    },
  });
});

/**
 * POST /api/auth/logout
 * Logs the sign out action
 */
router.post('/logout', authenticateToken, (req, res) => {
  try {
    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(req.user.id, 'USER_LOGOUT', 'User signed out');
  } catch {
    // Ignore db logging error on logout
  }
  return res.json({ success: true, message: 'Signed out successfully.' });
});

export default router;
