import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const STORAGE_KEY = 'campusfix_auth_token';
const SESSION_KEY = 'campusfix_session_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(SESSION_KEY) || null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Determine user's effective application role
   */
  const effectiveRole = useMemo(() => {
    if (!user) return null;
    if (user.role === 'Administrator') return 'Administrator';
    if (user.role === 'Technician') return 'Technician';
    if (user.userType === 'Faculty' || user.userType === 'Staff' || user.role === 'Faculty / Staff') {
      return 'Faculty / Staff';
    }
    return 'Student';
  }, [user]);

  /**
   * Verify authenticated user session
   */
  const checkAuth = useCallback(async () => {
    const activeToken = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const verifiedUser = await authService.verifySession(activeToken);
      if (verifiedUser) {
        setUser(verifiedUser);
        setToken(activeToken);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        setToken(null);
        setUser(null);
      }
    } catch {
      // Keep state clean on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Log In with Remember Me support
   */
  const login = async (identifier, password, rememberMe = true) => {
    setAuthError(null);
    try {
      const data = await authService.login(identifier, password);

      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY, data.token);
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.setItem('campusfix_remembered_identifier', identifier.trim());
      } else {
        sessionStorage.setItem(SESSION_KEY, data.token);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('campusfix_remembered_identifier');
      }

      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  /**
   * Register new user (strictly student/faculty)
   */
  const register = async ({ fullName, email, collegeId, password, roleRequested }) => {
    setAuthError(null);
    try {
      const data = await authService.register({
        fullName,
        email,
        collegeId,
        password,
        roleRequested,
      });

      localStorage.setItem(STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  /**
   * Forgot Password Request
   */
  const forgotPassword = async (identifier) => {
    return authService.forgotPassword(identifier);
  };

  /**
   * Reset Password Execution
   */
  const resetPassword = async ({ identifier, resetCode, newPassword }) => {
    return authService.resetPassword({ identifier, resetCode, newPassword });
  };

  /**
   * Google OAuth sign-in
   */
  const googleLogin = async (authData) => {
    setAuthError(null);
    try {
      const data = await authService.googleAuth(authData);
      localStorage.setItem(STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  /**
   * Sign Out
   */
  const logout = async () => {
    const activeToken = token || localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (activeToken) {
      await authService.logout(activeToken);
    }
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  /**
   * Helper for authenticated API calls
   */
  const authFetch = useCallback(async (url, options = {}) => {
    const activeToken = token || localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(SESSION_KEY);
    const headers = {
      ...options.headers,
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      setToken(null);
      setUser(null);
      throw new Error('Your session has expired. Please sign in again.');
    }

    return response;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        authError,
        isAuthenticated: !!user,
        role: user?.role || null,
        userType: user?.userType || null,
        effectiveRole,
        login,
        register,
        forgotPassword,
        resetPassword,
        googleLogin,
        logout,
        authFetch,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
