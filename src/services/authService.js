/**
 * CampusFix Authentication Service
 * Seamlessly interfaces with the real Express + SQLite backend (/api/auth),
 * with an integrated, fully-functional mock authentication service fallback
 * if the backend server is offline or unreachable.
 */

const STORAGE_USERS_KEY = 'campusfix_mock_users';
const STORAGE_RESETS_KEY = 'campusfix_mock_resets';

// Initial preloaded accounts representing all 4 campus roles
const INITIAL_MOCK_USERS = [
  {
    id: 1,
    name: 'Alex Rivera',
    email: 'alex.student@campus.edu',
    collegeId: 'STU-8821',
    password: 'campus2026!',
    role: 'Reporter',
    userType: 'Student',
    department: 'Computer Science',
    status: 'active',
  },
  {
    id: 2,
    name: 'Dr. Elena Rostova',
    email: 'elena.faculty@campus.edu',
    collegeId: 'FAC-1044',
    password: 'faculty2026!',
    role: 'Reporter',
    userType: 'Faculty',
    department: 'Department of Computer Science',
    status: 'active',
  },
  {
    id: 3,
    name: 'Marcus Vance',
    email: 'm.vance.tech@campus.edu',
    collegeId: 'TECH-4402',
    password: 'infraOps99#',
    role: 'Technician',
    userType: 'IT Staff',
    department: 'Network & Systems Infrastructure',
    status: 'active',
  },
  {
    id: 4,
    name: 'Sarah Chen',
    email: 's.chen.tech@campus.edu',
    collegeId: 'TECH-5120',
    password: 'tech2026!',
    role: 'Technician',
    userType: 'IT Staff',
    department: 'Classroom & Hardware Support',
    status: 'active',
  },
  {
    id: 5,
    name: 'Director Nathan Drake',
    email: 'admin@campus.edu',
    collegeId: 'ADM-0001',
    password: 'adminPass123!',
    role: 'Administrator',
    userType: 'Staff',
    department: 'Campus Infrastructure & Security',
    status: 'active',
  },
];

function getMockUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Fallback to default
  }
  return [...INITIAL_MOCK_USERS];
}

function saveMockUsers(users) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage errors
  }
}

function getMockResets() {
  try {
    const raw = localStorage.getItem(STORAGE_RESETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

function saveMockResets(resets) {
  try {
    localStorage.setItem(STORAGE_RESETS_KEY, JSON.stringify(resets));
  } catch {
    // Ignore
  }
}

/**
 * Generate a mock JWT-like token for offline development
 */
function createMockToken(user) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      userType: user.userType,
      exp: Math.floor(Date.now() / 1000) + 86400,
    })
  );
  return `mock.${header}.${payload}`;
}

/**
 * MOCK: Authenticate credentials
 */
function mockLogin(identifier, password) {
  const cleanId = identifier.trim().toLowerCase();
  const users = getMockUsers();

  const user = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      u.collegeId.toLowerCase() === cleanId
  );

  if (!user || user.password !== password) {
    throw new Error('Invalid campus email/ID or password. Please verify your credentials.');
  }

  if (user.status !== 'active') {
    throw new Error('This account is suspended. Please contact the campus IT department.');
  }

  const token = createMockToken(user);
  return {
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
  };
}

/**
 * MOCK: Register new user with strict security enforcement
 */
function mockRegister({ fullName, email, collegeId, password, roleRequested }) {
  // SECURITY CHECK:
  if (roleRequested === 'Technician' || roleRequested === 'Administrator') {
    throw new Error(
      'Security policy: Technician and Administrator privileges cannot be self-assigned. They must be designated by an authorized Campus Administrator.'
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanCollegeId = collegeId.trim().toUpperCase();
  const users = getMockUsers();

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error('This email is already registered in the campus directory. Please sign in.');
  }
  if (users.some((u) => u.collegeId.toUpperCase() === cleanCollegeId)) {
    throw new Error('This College ID is already registered. If this is yours, please sign in.');
  }

  const isFaculty = roleRequested === 'Faculty / Staff' || cleanEmail.includes('fac') || cleanEmail.includes('prof');
  const newUser = {
    id: users.length + 1,
    name: fullName.trim(),
    email: cleanEmail,
    collegeId: cleanCollegeId,
    password,
    role: 'Reporter',
    userType: isFaculty ? 'Faculty' : 'Student',
    department: isFaculty ? 'Academic Faculty & Staff' : 'Student Body',
    status: 'active',
  };

  users.push(newUser);
  saveMockUsers(users);

  const token = createMockToken(newUser);
  return {
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
  };
}

/**
 * MOCK: Forgot password request
 */
function mockForgotPassword(identifier) {
  const cleanId = identifier.trim().toLowerCase();
  const users = getMockUsers();

  const user = users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      u.collegeId.toLowerCase() === cleanId
  );

  if (!user) {
    throw new Error('No registered campus account found matching that email or College ID.');
  }

  const resetCode = `RESET-${Math.floor(100000 + Math.random() * 900000)}`;
  const resets = getMockResets();
  resets.push({
    userId: user.id,
    identifier: cleanId,
    resetCode,
    expiresAt: Date.now() + 15 * 60 * 1000,
    used: false,
  });
  saveMockResets(resets);

  return {
    success: true,
    message: `Password reset authorization generated. In production, this code is emailed to ${user.email}.`,
    resetCode,
    email: user.email,
    collegeId: user.collegeId,
  };
}

/**
 * MOCK: Reset password execution
 */
function mockResetPassword({ identifier, resetCode, newPassword }) {
  const cleanId = identifier.trim().toLowerCase();
  const cleanCode = resetCode.trim().toUpperCase();
  const users = getMockUsers();

  const userIndex = users.findIndex(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      u.collegeId.toLowerCase() === cleanId
  );

  if (userIndex === -1) {
    throw new Error('Campus account not found.');
  }

  const resets = getMockResets();
  const resetRecord = resets.find(
    (r) =>
      r.userId === users[userIndex].id &&
      r.resetCode === cleanCode &&
      !r.used &&
      r.expiresAt > Date.now()
  );

  if (!resetRecord) {
    throw new Error('Invalid or expired recovery code. Please request a new code.');
  }

  resetRecord.used = true;
  users[userIndex].password = newPassword;
  saveMockUsers(users);
  saveMockResets(resets);

  return {
    success: true,
    message: 'Password successfully updated! You can now log in with your new credentials.',
  };
}

/**
 * Primary API Service: Transparently calls Backend API with automatic Mock Service fallback
 */
export const authService = {
  async login(identifier, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        // Backend offline: invoke isolated mock service
        return mockLogin(identifier, password);
      }
      throw err;
    }
  },

  async register(registrationData) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        return mockRegister(registrationData);
      }
      throw err;
    }
  },

  async forgotPassword(identifier) {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        return mockForgotPassword(identifier);
      }
      throw err;
    }
  },

  async resetPassword({ identifier, resetCode, newPassword }) {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, resetCode, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Password update failed');
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        return mockResetPassword({ identifier, resetCode, newPassword });
      }
      throw err;
    }
  },

  async googleAuth(authData) {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Google sign-in failed');
      }
      return data;
    } catch (err) {
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        // Fallback for mock environment
        const mockStudent = INITIAL_MOCK_USERS[0];
        return {
          success: true,
          token: createMockToken(mockStudent),
          user: mockStudent,
          message: `Signed in as ${mockStudent.name} (Google Demo)`,
        };
      }
      throw err;
    }
  },

  async verifySession(token) {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.user;
    } catch {
      // Mock validation
      if (token && token.startsWith('mock.')) {
        try {
          const parts = token.split('.');
          const payload = JSON.parse(atob(parts[2]));
          const users = getMockUsers();
          const found = users.find((u) => u.id === payload.id);
          return found || null;
        } catch {
          return null;
        }
      }
      return null;
    }
  },

  async logout(token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Offline fallback
    }
  },
};

