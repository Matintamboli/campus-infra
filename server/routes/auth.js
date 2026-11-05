import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prismaClient.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

const router = Router();

// Email validation helper regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Public registration: strictly provisions accounts with 'Reporter' role.
 */
router.post('/register', async (req, res) => {
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
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingEmail) {
      return res.status(409).json({
        error: 'DUPLICATE_EMAIL',
        message: 'This email is already registered in the campus directory. Please sign in.',
      });
    }

    // Check if college ID already registered
    const existingId = await prisma.user.findUnique({
      where: { collegeId: cleanCollegeId },
    });

    if (existingId) {
      return res.status(409).json({
        error: 'DUPLICATE_COLLEGE_ID',
        message: 'This College ID is already registered. If this is yours, please sign in or recover your account.',
      });
    }

    // SECURITY ENFORCEMENT
    if (roleRequested === 'Technician' || roleRequested === 'Administrator') {
      return res.status(403).json({
        error: 'PRIVILEGE_VIOLATION',
        message: 'Security policy: Technician and Administrator privileges cannot be self-assigned.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isFaculty = roleRequested === 'Faculty / Staff' || cleanEmail.includes('fac') || cleanEmail.includes('prof');
    const userType = isFaculty ? 'Faculty' : 'Student';
    const department = isFaculty ? 'Academic Faculty & Staff' : 'Student Body';

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        collegeId: cleanCollegeId,
        passwordHash,
        role: 'Reporter',
        userType,
        department,
        status: 'active',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'USER_REGISTERED',
        details: `Registered as ${userType} (Reporter). Requested: ${roleRequested || 'Student'}`,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        collegeId: newUser.collegeId,
        role: newUser.role,
        userType: newUser.userType,
        department: newUser.department,
      },
      message: 'Registration complete! Welcome to CampusFix.',
    });
  } catch (err) {
    console.error('[Register Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error processing registration.' });
  }
});

/**
 * POST /api/auth/login
 * Validates identifier (email or college ID) and password
 */
router.post('/login', async (req, res) => {
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
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: 'insensitive' } },
          { collegeId: { equals: cleanIdentifier, mode: 'insensitive' } },
        ],
      },
    });

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
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid campus email/ID or password. Please verify your credentials.',
      });
    }

    // Update last_login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: `Logged in via credentials (${user.role})`,
      },
    });

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
        collegeId: user.collegeId,
        role: user.role,
        userType: user.userType,
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
      collegeId: req.user.collegeId,
      role: req.user.role,
      userType: req.user.userType,
      department: req.user.department,
    },
  });
});

/**
 * POST /api/auth/logout
 * Logs the sign out action
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_LOGOUT',
        details: 'User signed out',
      },
    });
  } catch {
    // Ignore logging error on logout
  }
  return res.json({ success: true, message: 'Signed out successfully.' });
});

/**
 * POST /api/auth/forgot-password
 * Generates a secure password reset token
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'College email or College ID is required to initiate password reset.',
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: 'insensitive' } },
          { collegeId: { equals: cleanIdentifier, mode: 'insensitive' } },
        ],
      },
    });

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

    const resetToken = `RESET-${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: expiresAt,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FORGOT_PASSWORD_REQUEST',
        details: `Password recovery initiated for ${user.email} (${user.collegeId})`,
      },
    });

    return res.json({
      success: true,
      message: `Password reset authorization generated. In production, this code is emailed to ${user.email}.`,
      resetCode: resetToken,
      email: user.email,
      collegeId: user.collegeId,
    });
  } catch (err) {
    console.error('[Forgot Password Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to process password reset request.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Validates recovery token and updates user password
 */
router.post('/reset-password', async (req, res) => {
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

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanIdentifier, mode: 'insensitive' } },
          { collegeId: { equals: cleanIdentifier, mode: 'insensitive' } },
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Campus account not found.' });
    }

    // Validate reset code
    if (!user.resetToken || user.resetToken !== cleanCode) {
      return res.status(400).json({
        error: 'INVALID_RESET_CODE',
        message: 'Invalid or expired recovery code. Please generate a new code.',
      });
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({
        error: 'EXPIRED_RESET_CODE',
        message: 'Recovery code has expired. Please generate a new code.',
      });
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        details: `Password successfully reset for account ${user.email}`,
      },
    });

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
 * Google Identity Services authentication endpoint
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, profile } = req.body;

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

    // Check if account exists
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Auto-provision account for Google sign-in
      const generatedId = `STU-G-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomPasswordHash = await bcrypt.hash(Math.random().toString(36), 10);
      const isFaculty = cleanEmail.includes('fac') || cleanEmail.includes('prof');

      user = await prisma.user.create({
        data: {
          name: googleName,
          email: cleanEmail,
          collegeId: generatedId,
          passwordHash: randomPasswordHash,
          role: 'Reporter',
          userType: isFaculty ? 'Faculty' : 'Student',
          department: isFaculty ? 'Academic Faculty' : 'Undergraduate Student Body',
          status: 'active',
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'GOOGLE_USER_CREATED',
          details: `Created new account for Google user ${cleanEmail}`,
        },
      });
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
        collegeId: user.collegeId,
        role: user.role,
        userType: user.userType,
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
