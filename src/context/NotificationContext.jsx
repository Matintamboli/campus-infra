import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    inAppEnabled: true,
    soundEnabled: true,
  });

  // State for 1-click incident opening across dashboards
  const [activeIncidentToOpen, setActiveIncidentToOpen] = useState(null);

  // State for opening the complete Notification Center page/modal
  const [isCenterModalOpen, setIsCenterModalOpen] = useState(false);

  // SSE event source reference
  const eventSourceRef = useRef(null);

  // Web Audio chime generator for pleasant notification alert
  const playNotificationSound = useCallback(() => {
    if (!preferences.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context may require prior user interaction
    }
  }, [preferences.soundEnabled]);

  // Fetch all notifications from database
  const fetchNotifications = useCallback(async (filters = {}) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.unreadOnly) params.append('unreadOnly', 'true');
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      params.append('limit', '50');

      const res = await fetch(`/api/notifications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error('[Notification Context Fetch Error]:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch user notification preferences
  const fetchPreferences = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/preferences', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch {
      // Keep defaults
    }
  }, [token]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    if (!token) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('[Mark Read Error]:', err);
    }
  }, [token]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('[Mark All Read Error]:', err);
    }
  }, [token]);

  // Delete a specific notification
  const deleteNotification = useCallback(async (id) => {
    if (!token) return;
    const target = notifications.find((n) => n.id === id);
    const wasUnread = target && !target.is_read;

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('[Delete Notification Error]:', err);
    }
  }, [token, notifications]);

  // Clear all read notifications
  const clearReadNotifications = useCallback(async () => {
    if (!token) return;
    setNotifications((prev) => prev.filter((n) => !n.is_read));

    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('[Clear Read Error]:', err);
    }
  }, [token]);

  // Update notification preferences
  const updatePreferences = useCallback(async (newPrefs) => {
    if (!token) return;
    setPreferences((prev) => ({ ...prev, ...newPrefs }));

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPrefs),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (err) {
      console.error('[Update Preferences Error]:', err);
    }
  }, [token]);

  // Trigger opening of a specific incident
  const openIncident = useCallback((ticketId, ticketNumber) => {
    setActiveIncidentToOpen({ ticketId, ticketNumber });
  }, []);

  const clearActiveIncident = useCallback(() => {
    setActiveIncidentToOpen(null);
  }, []);

  // Connect to real-time Server-Sent Events stream
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      setUnreadCount(0);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    fetchNotifications();
    fetchPreferences();

    // Setup SSE connection
    try {
      const sseUrl = `/api/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NOTIFICATION_RECEIVED' && payload.notification) {
            setNotifications((prev) => {
              // Avoid duplicates
              if (prev.some((n) => n.id === payload.notification.id)) {
                return prev;
              }
              return [payload.notification, ...prev];
            });
            setUnreadCount(payload.unreadCount ?? ((c) => c + 1));
            playNotificationSound();
          }
        } catch {
          // Ignore ping or heartbeat payloads
        }
      };

      es.onerror = () => {
        // EventSource automatically attempts reconnection
      };
    } catch (err) {
      console.error('[SSE Setup Error]:', err);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isAuthenticated, token, fetchNotifications, fetchPreferences, playNotificationSound]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        preferences,
        activeIncidentToOpen,
        isCenterModalOpen,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearReadNotifications,
        updatePreferences,
        openIncident,
        clearActiveIncident,
        openCenterModal: () => setIsCenterModalOpen(true),
        closeCenterModal: () => setIsCenterModalOpen(false),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

