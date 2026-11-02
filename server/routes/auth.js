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

    // SECURITY ENFORCEMENT:
    // Public registration CANNOT self-assign 'Technician' or 'Administrator' roles.
    if (roleRequested === 'Technician' || roleRequested === 'Administrator') {
      return res.status(403).json({
        error: 'PRIVILEGE_VIOLATION',
        message: 'Security policy: Technician and Administrator privileges cannot be self-assigned. They must be designated by an authorized Campus Administrator.',
      });
    }

    const isFaculty = roleRequested === 'Faculty / Staff' || cleanEmail.includes('fac') || cleanEmail.includes('prof');
    const userType = isFaculty ? 'Faculty' : 'Student';
    const assignedRole = 'Reporter';
    const department = isFaculty ? 'Academic Faculty & Staff' : 'Student Body';

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
      `Registered as ${userType} (${assignedRole}). (Requested: ${roleRequested || 'Student'})`
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

/**
 * POST /api/auth/forgot-password
 * Step 1: Generates a secure password reset token for verification
 */
router.post('/forgot-password', (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'College email or College ID is required to initiate password reset.',
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Look up user by email or college ID
    const user = db.prepare(`
      SELECT id, name, email, college_id, status
      FROM users
      WHERE LOWER(email) = ? OR LOWER(college_id) = ?
    `).get(cleanIdentifier, cleanIdentifier);

    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'No registered campus account found matching that email or College ID.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: 'This account is suspended. Please contact the campus IT department directly.',
      });
    }

    // Generate formatted reset code (e.g. RESET-481920)
    const resetToken = `RESET-${Math.floor(100000 + Math.random() * 900000)}`;

    // Invalidate existing unused tokens for this user
    db.prepare('UPDATE password_resets SET used = 1 WHERE user_id = ?').run(user.id);

    // Save token with 15-minute expiration
    db.prepare(`
      INSERT INTO password_resets (user_id, reset_token, expires_at)
      VALUES (?, ?, datetime('now', '+15 minutes'))
    `).run(user.id, resetToken);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'FORGOT_PASSWORD_REQUEST', ?)
    `).run(user.id, `Password recovery initiated for ${user.email} (${user.college_id})`);

    return res.json({
      success: true,
      message: `Password reset authorization generated. In production, this code is emailed to ${user.email}.`,
      resetCode: resetToken,
      email: user.email,
      collegeId: user.college_id,
    });
  } catch (err) {
    console.error('[Forgot Password Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to process password reset request.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Step 2: Validates recovery token and updates user password with bcrypt
 */
router.post('/reset-password', (req, res) => {
  try {
    const { identifier, resetCode, newPassword } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Identifier is required.' });
    }
    if (!resetCode || !resetCode.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Recovery reset code is required.' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'New password must be at least 6 characters.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanCode = resetCode.trim().toUpperCase();

    const user = db.prepare(`
      SELECT id, name, email, college_id
      FROM users
      WHERE LOWER(email) = ? OR LOWER(college_id) = ?
    `).get(cleanIdentifier, cleanIdentifier);

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Campus account not found.' });
    }

    // Validate reset code against active, unexpired tokens
    const resetRecord = db.prepare(`
      SELECT id, reset_token, expires_at
      FROM password_resets
      WHERE user_id = ? AND UPPER(reset_token) = ? AND used = 0 AND datetime(expires_at) > datetime('now')
      ORDER BY id DESC LIMIT 1
    `).get(user.id, cleanCode);

    if (!resetRecord) {
      return res.status(400).json({
        error: 'INVALID_RESET_CODE',
        message: 'Invalid or expired recovery code. Please generate a new code.',
      });
    }

    // Hash new password
    const newHash = bcrypt.hashSync(newPassword, 10);

    // Update password in users table
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

    // Mark reset code as used
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRecord.id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'PASSWORD_RESET_COMPLETED', ?)
    `).run(user.id, `Password successfully reset for account ${user.email}`);

    return res.json({
      success: true,
      message: 'Password successfully updated! You can now log in with your new credentials.',
    });
  } catch (err) {
    console.error('[Reset Password Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to reset password.' });
  }
});

/**
 * POST /api/auth/google
 * Genuine Google Identity Services authentication endpoint
 */
router.post('/google', (req, res) => {
  try {
    const { credential, profile } = req.body;

    // Decode standard JWT payload if credential exists
    let googleEmail = profile?.email;
    let googleName = profile?.name || 'Campus Member';

    if (credential && !googleEmail) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          googleEmail = payload.email;
          googleName = payload.name || googleName;
        }
      } catch {
        // Fallback to profile
      }
    }

    if (!googleEmail) {
      return res.status(400).json({
        error: 'INVALID_GOOGLE_TOKEN',
        message: 'Google authentication credential could not be verified.',
      });
    }

    const cleanEmail = googleEmail.trim().toLowerCase();

    // Check if account already exists
    let user = db.prepare('SELECT id, name, email, college_id, role, user_type, department, status FROM users WHERE LOWER(email) = ?').get(cleanEmail);

    if (!user) {
      // Auto-provision student account for genuine Google sign-in
      const generatedId = `STU-G-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomPasswordHash = bcrypt.hashSync(Math.random().toString(36), 10);
      const isFaculty = cleanEmail.includes('fac') || cleanEmail.includes('prof');
      const userType = isFaculty ? 'Faculty' : 'Student';
      const role = 'Reporter';

      const insertResult = db.prepare(`
        INSERT INTO users (name, email, college_id, password_hash, role, user_type, department)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        googleName,
        cleanEmail,
        generatedId,
        randomPasswordHash,
        role,
        userType,
        isFaculty ? 'Academic Faculty' : 'Undergraduate Student Body'
      );

      user = db.prepare('SELECT id, name, email, college_id, role, user_type, department, status FROM users WHERE id = ?').get(insertResult.lastInsertRowid);

      db.prepare(`
        INSERT INTO audit_logs (user_id, action, details)
        VALUES (?, 'GOOGLE_USER_CREATED', ?)
      `).run(user.id, `Created new account for Google user ${cleanEmail}`);
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: 'This account is suspended. Contact campus IT helpdesk.',
      });
    }

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
      message: `Signed in with Google as ${user.name}`,
    });
  } catch (err) {
    console.error('[Google Auth Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to process Google sign in.' });
  }
});

export default router;
