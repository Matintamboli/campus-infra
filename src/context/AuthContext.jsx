import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'campusfix_auth_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Fetch authenticated user profile using stored JWT token
   */
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(storedToken);
      } else {
        // Expired or invalid token
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('[AuthContext] Session verification failed (offline or server starting):', err);
      // Keep state clean on network error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Log In
   */
  const login = async (identifier, password) => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMessage = data.message || 'Authentication failed. Please verify your credentials.';
        setAuthError(errMessage);
        throw new Error(errMessage);
      }

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
   * Register new user (Enforces Reporter role per Requirement 8)
   */
  const register = async ({ fullName, email, collegeId, password, roleRequested }) => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, collegeId, password, roleRequested }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMessage = data.message || 'Registration failed.';
        setAuthError(errMessage);
        throw new Error(errMessage);
      }

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
    const activeToken = token || localStorage.getItem(STORAGE_KEY);
    if (activeToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });
      } catch {
        // Silently continue client-side sign out
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  /**
   * Helper to perform authenticated API calls with automatic Bearer token
   */
  const authFetch = useCallback(async (url, options = {}) => {
    const activeToken = token || localStorage.getItem(STORAGE_KEY);
    const headers = {
      ...options.headers,
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      // Session has expired
      localStorage.removeItem(STORAGE_KEY);
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
        login,
        register,
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
