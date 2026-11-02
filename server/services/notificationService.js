import db from '../db.js';

/**
 * In-memory map of active SSE client streams:
 * Key: userId (number)
 * Value: Set of express Response objects
 */
const sseClients = new Map();

/**
 * Register a client Response stream for real-time Server-Sent Events
 */
export function registerSSEClient(userId, res) {
  const uid = Number(userId);
  if (!sseClients.has(uid)) {
    sseClients.set(uid, new Set());
  }
  sseClients.get(uid).add(res);

  // Send initial handshake event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', userId: uid, timestamp: new Date().toISOString() })}\n\n`);

  // Handle client disconnect
  res.on('close', () => {
    const userStreams = sseClients.get(uid);
    if (userStreams) {
      userStreams.delete(res);
      if (userStreams.size === 0) {
        sseClients.delete(uid);
      }
    }
  });
}

/**
 * Send heartbeat ping every 25 seconds to keep SSE connections open through proxies
 */
setInterval(() => {
  for (const [userId, streams] of sseClients.entries()) {
    for (const res of streams) {
      try {
        res.write(':ping\n\n');
      } catch {
        streams.delete(res);
      }
    }
    if (streams.size === 0) {
      sseClients.delete(userId);
    }
  }
}, 25000);

/**
 * Broadcast an event to a user's active SSE streams
 */
function broadcastToUser(userId, payload) {
  const uid = Number(userId);
  const streams = sseClients.get(uid);
  if (streams && streams.size > 0) {
    const dataStr = `data: ${JSON.stringify(payload)}\n\n`;
    for (const res of streams) {
      try {
        res.write(dataStr);
      } catch (err) {
        console.error('[SSE Broadcast Error]:', err);
        streams.delete(res);
      }
    }
  }
}

/**
 * Get or initialize user notification preferences
 */
export function getUserPreferences(userId) {
  let prefs = db.prepare('SELECT * FROM notification_preferences WHERE user_id = ?').get(userId);
  if (!prefs) {
    try {
      db.prepare(`
        INSERT INTO notification_preferences (user_id, email_enabled, in_app_enabled, sound_enabled)
        VALUES (?, 1, 1, 1)
      `).run(userId);
      prefs = { user_id: userId, email_enabled: 1, in_app_enabled: 1, sound_enabled: 1 };
    } catch {
      prefs = { user_id: userId, email_enabled: 1, in_app_enabled: 1, sound_enabled: 1 };
    }
  }
  return prefs;
}

/**
 * Update user notification preferences
 */
export function updateUserPreferences(userId, { emailEnabled, inAppEnabled, soundEnabled }) {
  const existing = getUserPreferences(userId);
  const nextEmail = emailEnabled !== undefined ? (emailEnabled ? 1 : 0) : existing.email_enabled;
  const nextInApp = inAppEnabled !== undefined ? (inAppEnabled ? 1 : 0) : existing.in_app_enabled;
  const nextSound = soundEnabled !== undefined ? (soundEnabled ? 1 : 0) : existing.sound_enabled;

  db.prepare(`
    INSERT INTO notification_preferences (user_id, email_enabled, in_app_enabled, sound_enabled, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      email_enabled = excluded.email_enabled,
      in_app_enabled = excluded.in_app_enabled,
      sound_enabled = excluded.sound_enabled,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, nextEmail, nextInApp, nextSound);

  return {
    userId,
    emailEnabled: !!nextEmail,
    inAppEnabled: !!nextInApp,
    soundEnabled: !!nextSound,
  };
}

/**
 * Calculate unread notifications count for a user
 */
export function getUnreadCount(userId) {
  const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(userId);
  return row ? row.count : 0;
}

/**
 * Create and persist a single notification record, with optional email delivery simulation and real-time SSE push
 */
export function createNotification({
  userId,
  ticketId = null,
  eventType,
  title,
  message,
  roleTarget = null,
  priority = 'normal',
  metadata = null,
  sendEmail = true,
}) {
  try {
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(userId);
    if (!user) return null;

    const prefs = getUserPreferences(userId);
    if (prefs && prefs.in_app_enabled === 0) {
      // In-app notifications turned off for this user
      return null;
    }

    const metadataStr = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;

    let emailSent = 0;
    if (sendEmail && prefs && prefs.email_enabled === 1) {
      emailSent = 1;
      // Institutional Simulated Email Dispatch Log
      console.log(`[Email Dispatch Simulation] 📧 To: ${user.name} <${user.email}> | Subject: [CampusFix] ${title} | Priority: ${priority.toUpperCase()}`);
    }

    const insertResult = db.prepare(`
      INSERT INTO notifications (
        user_id, ticket_id, event_type, title, message, role_target, priority, is_read, email_sent, email_recipient, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      userId,
      ticketId,
      eventType,
      title,
      message,
      roleTarget || user.role,
      priority,
      emailSent,
      user.email,
      metadataStr
    );

    const createdNotif = db.prepare(`
      SELECT n.*, t.ticket_number, t.title as ticket_title, t.status as ticket_status, t.priority as ticket_priority, t.building, t.room
      FROM notifications n
      LEFT JOIN tickets t ON n.ticket_id = t.id
      WHERE n.id = ?
    `).get(insertResult.lastInsertRowid);

    const unreadCount = getUnreadCount(userId);

    // Push real-time event to SSE client if connected
    broadcastToUser(userId, {
      type: 'NOTIFICATION_RECEIVED',
      notification: createdNotif,
      unreadCount,
    });

    return createdNotif;
  } catch (err) {
    console.error('[Create Notification Error]:', err);
    return null;
  }
}

/**
 * Notify all active users matching a specific role (e.g. 'Administrator', 'Technician')
 */
export function notifyRole(role, notificationData) {
  try {
    const users = db.prepare("SELECT id FROM users WHERE role = ? AND status = 'active'").all(role);
    const created = [];
    for (const u of users) {
      const notif = createNotification({
        ...notificationData,
        userId: u.id,
        roleTarget: role,
      });
      if (notif) created.push(notif);
    }
    return created;
  } catch (err) {
    console.error(`[Notify Role Error - ${role}]:`, err);
    return [];
  }
}

/**
 * Check for tickets exceeding configured SLA resolution targets and alert administrators
 */
export function checkSlaBreaches() {
  try {
    const activeTickets = db.prepare(`
      SELECT t.id, t.ticket_number, t.title, t.priority, t.category, t.status, t.created_at,
             COALESCE(c.sla_hours, 4) as target_sla_hours
      FROM tickets t
      LEFT JOIN categories c ON LOWER(t.category) = LOWER(c.name)
      WHERE t.status NOT IN ('Resolved', 'Closed')
    `).all();

    const now = Date.now();
    let breachesFound = 0;

    for (const t of activeTickets) {
      const createdTime = new Date(t.created_at).getTime();
      const elapsedHours = (now - createdTime) / 3600000;
      const targetHours = t.target_sla_hours || 4;

      if (elapsedHours > targetHours) {
        // Check if an SLA_OVERDUE notification was already recorded for this ticket
        const existing = db.prepare("SELECT id FROM notifications WHERE ticket_id = ? AND event_type = 'SLA_OVERDUE'").get(t.id);
        if (!existing) {
          notifyRole('Administrator', {
            ticketId: t.id,
            eventType: 'SLA_OVERDUE',
            title: `SLA Target Breached: ${t.ticket_number}`,
            message: `Incident ${t.ticket_number} ("${t.title}") has exceeded its target SLA of ${targetHours}h (elapsed: ${elapsedHours.toFixed(1)}h) without resolution.`,
            priority: 'critical',
            metadata: { targetHours, elapsedHours: Number(elapsedHours.toFixed(1)) },
          });
          breachesFound++;
        }
      }
    }
    return breachesFound;
  } catch (err) {
    console.error('[Check SLA Breaches Error]:', err);
    return 0;
  }
}

/**
 * Check if the creation of this ticket reveals a recurring failure hotspot in a building
 */
export function checkRepeatedIssues(ticket) {
  try {
    if (!ticket || !ticket.building || !ticket.category) return false;

    // Check recent tickets with same building and category in the last 7 days
    const recentCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM tickets 
      WHERE building = ? AND category = ? 
      AND datetime(created_at) >= datetime('now', '-7 days')
    `).get(ticket.building, ticket.category).count;

    if (recentCount >= 3) {
      // Check if alert already sent in the last 24 hours for this cluster
      const recentAlert = db.prepare(`
        SELECT id FROM notifications 
        WHERE event_type = 'REPEATED_ISSUE' 
        AND message LIKE ?
        AND datetime(created_at) >= datetime('now', '-1 day')
      `).get(`%${ticket.building}%${ticket.category}%`);

      if (!recentAlert) {
        notifyRole('Administrator', {
          ticketId: ticket.id,
          eventType: 'REPEATED_ISSUE',
          title: `Repeated Issue Cluster: ${ticket.building}`,
          message: `Hotspot detected: ${recentCount} incidents under "${ticket.category}" recorded at ${ticket.building} in the past 7 days.`,
          priority: 'high',
          metadata: { building: ticket.building, category: ticket.category, incidentCount: recentCount },
        });
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('[Check Repeated Issues Error]:', err);
    return false;
  }
}

export default {
  registerSSEClient,
  getUserPreferences,
  updateUserPreferences,
  getUnreadCount,
  createNotification,
  notifyRole,
  checkSlaBreaches,
  checkRepeatedIssues,
};

