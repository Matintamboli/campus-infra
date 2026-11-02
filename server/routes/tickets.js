import { Router } from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All ticket routes require a valid authenticated session
router.use(authenticateToken);

/**
 * Helper: Attach notes and reporter/technician objects to a ticket or list of tickets
 */
function enrichTicket(ticket, user = null) {
  if (!ticket) return null;
  let notesQuery = `
    SELECT tn.id, tn.note, tn.is_internal, tn.created_at, u.id AS author_id, u.name AS author_name, u.role AS author_role, u.college_id AS author_college_id
    FROM ticket_notes tn
    JOIN users u ON tn.user_id = u.id
    WHERE tn.ticket_id = ?
  `;
  if (user && user.role === 'Reporter') {
    notesQuery += ' AND (tn.is_internal IS NULL OR tn.is_internal = 0)';
  }
  notesQuery += ' ORDER BY tn.created_at ASC';
  const notes = db.prepare(notesQuery).all(ticket.id);

  let parsedAttachments = [];
  if (ticket.attachments) {
    try {
      parsedAttachments = typeof ticket.attachments === 'string' ? JSON.parse(ticket.attachments) : ticket.attachments;
    } catch {
      parsedAttachments = [];
    }
  }

  return {
    ...ticket,
    notes: notes || [],
    attachments: parsedAttachments,
  };
}

/**
 * GET /api/tickets
 * Retrieve tickets with role-based access scoping and filtering
 */
router.get('/', (req, res) => {
  try {
    const { status, category, priority, search, view } = req.query;
    const user = req.user;

    let query = `
      SELECT 
        t.*,
        rep.name AS reporter_name,
        rep.email AS reporter_email,
        rep.college_id AS reporter_college_id,
        rep.department AS reporter_department,
        tech.name AS technician_name,
        tech.email AS technician_email,
        tech.college_id AS technician_college_id
      FROM tickets t
      JOIN users rep ON t.reporter_id = rep.id
      LEFT JOIN users tech ON t.technician_id = tech.id
      WHERE 1=1
    `;
    const params = [];

    // Role-based scoping
    if (user.role === 'Reporter') {
      // Reporters can only see tickets they submitted
      query += ' AND t.reporter_id = ?';
      params.push(user.id);
    } else if (user.role === 'Technician') {
      // Technicians: view=all lets them inspect campus-wide incidents; default view shows their assigned queue + open unassigned
      if (view === 'assigned') {
        query += ' AND t.technician_id = ?';
        params.push(user.id);
      } else if (view !== 'all') {
        query += ' AND (t.technician_id = ? OR t.status = "Open")';
        params.push(user.id);
      }
    }
    // Administrator can see everything (no default restriction)

    // Optional query filters
    if (status && status !== 'all') {
      query += ' AND LOWER(t.status) = LOWER(?)';
      params.push(status);
    }
    if (category && category !== 'all') {
      query += ' AND LOWER(t.category) = LOWER(?)';
      params.push(category);
    }
    if (priority && priority !== 'all') {
      query += ' AND LOWER(t.priority) = LOWER(?)';
      params.push(priority);
    }
    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      query += ' AND (LOWER(t.title) LIKE ? OR LOWER(t.ticket_number) LIKE ? OR LOWER(t.building) LIKE ? OR LOWER(t.room) LIKE ?)';
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY t.created_at DESC';

    const rawTickets = db.prepare(query).all(...params);
    const tickets = rawTickets.map((t) => enrichTicket(t, user));

    return res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (err) {
    console.error('[Get Tickets Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve tickets' });
  }
});

/**
 * GET /api/tickets/:id
 * Retrieve a single ticket with full details and history notes
 */
router.get('/:id', (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const user = req.user;

    const rawTicket = db.prepare(`
      SELECT 
        t.*,
        rep.name AS reporter_name,
        rep.email AS reporter_email,
        rep.college_id AS reporter_college_id,
        rep.department AS reporter_department,
        tech.name AS technician_name,
        tech.email AS technician_email,
        tech.college_id AS technician_college_id
      FROM tickets t
      JOIN users rep ON t.reporter_id = rep.id
      LEFT JOIN users tech ON t.technician_id = tech.id
      WHERE t.id = ?
    `).get(ticketId);

    if (!rawTicket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket not found' });
    }

    // Access control check: Reporters can only view their own ticket
    if (user.role === 'Reporter' && rawTicket.reporter_id !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied to this ticket' });
    }

    const ticket = enrichTicket(rawTicket, user);
    return res.json({ success: true, ticket });
  } catch (err) {
    console.error('[Get Ticket Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve ticket' });
  }
});

/**
 * POST /api/tickets
 * Create a new infrastructure incident report
 */
router.post('/', (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      priority = 'Medium', 
      building, 
      floor = 'Ground Floor',
      room, 
      affectedService = 'General Campus Service',
      attachments = []
    } = req.body;
    const user = req.user;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Incident title is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Detailed description is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Infrastructure category is required' });
    }
    if (!building || !building.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Campus building is required' });
    }
    if (!room || !room.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Room / Area location is required' });
    }

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    const chosenPriority = validPriorities.includes(priority) ? priority : 'Medium';

    // Generate unique readable ticket number (e.g. INC-1085)
    const maxIdRow = db.prepare('SELECT MAX(id) as maxId FROM tickets').get();
    const nextSeq = (maxIdRow?.maxId || 0) + 1;
    const ticketNumber = `INC-${1080 + nextSeq}`;

    const attachmentsJson = typeof attachments === 'string' ? attachments : JSON.stringify(attachments);

    const insertResult = db.prepare(`
      INSERT INTO tickets (
        ticket_number, title, description, category, priority, status, 
        building, floor, room, affected_service, attachments, reporter_id
      )
      VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, ?, ?, ?, ?)
    `).run(
      ticketNumber,
      title.trim(),
      description.trim(),
      category.trim(),
      chosenPriority,
      building.trim(),
      floor ? floor.trim() : 'Ground Floor',
      room.trim(),
      affectedService ? affectedService.trim() : 'General Campus Infrastructure',
      attachmentsJson,
      user.id
    );

    const newTicketId = insertResult.lastInsertRowid;

    // Record in Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'CREATE_TICKET', ?)
    `).run(
      user.id,
      `User ${user.name} (${user.role}) reported incident ${ticketNumber}: "${title.trim()}" in ${building} (${room})`
    );

    const createdTicket = db.prepare(`
      SELECT 
        t.*,
        rep.name AS reporter_name,
        rep.email AS reporter_email,
        rep.college_id AS reporter_college_id,
        rep.department AS reporter_department,
        tech.name AS technician_name,
        tech.email AS technician_email,
        tech.college_id AS technician_college_id
      FROM tickets t
      JOIN users rep ON t.reporter_id = rep.id
      LEFT JOIN users tech ON t.technician_id = tech.id
      WHERE t.id = ?
    `).get(newTicketId);

    return res.status(201).json({
      success: true,
      message: `Incident ticket ${ticketNumber} registered successfully`,
      ticket: enrichTicket(createdTicket),
    });
  } catch (err) {
    console.error('[Create Ticket Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create ticket' });
  }
});

/**
 * PATCH /api/tickets/:id/status
 * Update ticket lifecycle status (Open -> Assigned -> In Progress -> Resolved -> Closed)
 * Technicians & Admins can change freely.
 * Reporters who created the ticket can:
 * - Confirm resolution: transition 'Resolved' -> 'Closed'
 * - Reopen ticket: transition 'Resolved'/'Closed' -> 'Open' (with reason)
 */
router.patch('/:id/status', (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { status, note, reopenReason } = req.body;
    const user = req.user;

    const validStatuses = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'INVALID_STATUS',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const existingTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    if (!existingTicket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket not found' });
    }

    // Role-based authorization:
    if (user.role === 'Reporter') {
      if (existingTicket.reporter_id !== user.id) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied: You do not own this ticket' });
      }
      const isConfirming = existingTicket.status === 'Resolved' && status === 'Closed';
      const isReopening = (existingTicket.status === 'Resolved' || existingTicket.status === 'Closed') && status === 'Open';

      if (!isConfirming && !isReopening) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Reporters may only confirm resolution (Resolved -> Closed) or reopen issues (Resolved/Closed -> Open).',
        });
      }
    } else if (user.role === 'Technician') {
      // Technicians can only update tickets that are assigned to them or unassigned
      if (existingTicket.technician_id && existingTicket.technician_id !== user.id) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Access denied: Only the assigned technician or an administrator can update this incident.',
        });
      }
    }

    const { resolutionDetails } = req.body;

    // If a technician claims or starts work on an unassigned ticket, assign them automatically
    let updatedTechnicianId = existingTicket.technician_id;
    if (user.role === 'Technician' && !existingTicket.technician_id) {
      updatedTechnicianId = user.id;
    }

    let resDetails = existingTicket.resolution_details;
    if (resolutionDetails !== undefined) {
      resDetails = resolutionDetails;
    }

    db.prepare(`
      UPDATE tickets 
      SET status = ?, technician_id = ?, resolution_details = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, updatedTechnicianId, resDetails, ticketId);

    // If a note, resolutionDetails, or reopenReason was provided, record it in ticket_notes
    let noteText = reopenReason ? `[REOPENED BY REPORTER]: ${reopenReason}` : note;
    if (resolutionDetails && resolutionDetails.trim()) {
      noteText = noteText ? `${noteText}\n[RESOLUTION DETAILS]: ${resolutionDetails.trim()}` : `[RESOLUTION DETAILS]: ${resolutionDetails.trim()}`;
    }

    if (noteText && noteText.trim()) {
      db.prepare(`
        INSERT INTO ticket_notes (ticket_id, user_id, note, is_internal)
        VALUES (?, ?, ?, 0)
      `).run(ticketId, user.id, noteText.trim());
    } else if (existingTicket.status === 'Resolved' && status === 'Closed' && user.role === 'Reporter') {
      db.prepare(`
        INSERT INTO ticket_notes (ticket_id, user_id, note, is_internal)
        VALUES (?, ?, ?, 0)
      `).run(ticketId, user.id, 'Reporter verified campus infrastructure operation and confirmed resolution.');
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'UPDATE_TICKET_STATUS', ?)
    `).run(
      user.id,
      `${user.role} ${user.name} changed status of ${existingTicket.ticket_number} from "${existingTicket.status}" to "${status}"`
    );

    const updated = db.prepare(`
      SELECT 
        t.*,
        rep.name AS reporter_name,
        rep.email AS reporter_email,
        rep.college_id AS reporter_college_id,
        rep.department AS reporter_department,
        tech.name AS technician_name,
        tech.email AS technician_email,
        tech.college_id AS technician_college_id
      FROM tickets t
      JOIN users rep ON t.reporter_id = rep.id
      LEFT JOIN users tech ON t.technician_id = tech.id
      WHERE t.id = ?
    `).get(ticketId);

    return res.json({
      success: true,
      message: `Status for ticket ${existingTicket.ticket_number} changed to ${status}`,
      ticket: enrichTicket(updated, user),
    });
  } catch (err) {
    console.error('[Update Ticket Status Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update ticket status' });
  }
});

/**
 * POST /api/tickets/:id/attachments
 * Upload additional supporting evidence (images or documents)
 * Allowed for ticket reporter, assigned technician, or admin
 */
router.post('/:id/attachments', (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { attachments } = req.body;
    const user = req.user;

    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Attachments array is required' });
    }

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket not found' });
    }

    if (user.role === 'Reporter' && ticket.reporter_id !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot upload attachments to tickets not owned by you' });
    }
    if (user.role === 'Technician' && ticket.technician_id && ticket.technician_id !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot upload attachments to tickets assigned to another technician' });
    }

    let existingAttachments = [];
    if (ticket.attachments) {
      try {
        existingAttachments = typeof ticket.attachments === 'string' ? JSON.parse(ticket.attachments) : ticket.attachments;
      } catch {
        existingAttachments = [];
      }
    }

    const combined = [...existingAttachments, ...attachments];

    db.prepare(`
      UPDATE tickets 
      SET attachments = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(combined), ticketId);

    // Note in investigation log
    db.prepare(`
      INSERT INTO ticket_notes (ticket_id, user_id, note)
      VALUES (?, ?, ?)
    `).run(ticketId, user.id, `Uploaded ${attachments.length} additional supporting evidence attachment(s): ${attachments.map(a => a.name).join(', ')}`);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'UPLOAD_ATTACHMENT', ?)
    `).run(
      user.id,
      `${user.role} ${user.name} added ${attachments.length} attachment(s) to ticket ${ticket.ticket_number}`
    );

    const updated = db.prepare(`
      SELECT 
        t.*,
        rep.name AS reporter_name,
        rep.email AS reporter_email,
        rep.college_id AS reporter_college_id,
        rep.department AS reporter_department,
        tech.name AS technician_name,
        tech.email AS technician_email,
        tech.college_id AS technician_college_id
      FROM tickets t
      JOIN users rep ON t.reporter_id = rep.id
      LEFT JOIN users tech ON t.technician_id = tech.id
      WHERE t.id = ?
    `).get(ticketId);

    return res.json({
      success: true,
      message: `${attachments.length} attachment(s) uploaded successfully`,
      ticket: enrichTicket(updated, user),
    });
  } catch (err) {
    console.error('[Upload Attachments Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to upload attachments' });
  }
});

/**
 * POST /api/tickets/:id/notes
 * Add technical diagnostics note or investigation log
 * Allowed: Assigned technician, administrator, or ticket creator
 */
router.post('/:id/notes', (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { note, isInternal } = req.body;
    const user = req.user;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Note text cannot be empty' });
    }

    const ticket = db.prepare('SELECT id, ticket_number, reporter_id, technician_id FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket not found' });
    }

    // Role check: Reporter must own it; Technician or Admin can add
    if (user.role === 'Reporter' && ticket.reporter_id !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot add notes to tickets not owned by you' });
    }
    if (user.role === 'Technician' && ticket.technician_id && ticket.technician_id !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot add notes to tickets assigned to another technician' });
    }

    const isInternalVal = ((user.role === 'Technician' || user.role === 'Administrator') && isInternal) ? 1 : 0;

    const insertResult = db.prepare(`
      INSERT INTO ticket_notes (ticket_id, user_id, note, is_internal)
      VALUES (?, ?, ?, ?)
    `).run(ticketId, user.id, note.trim(), isInternalVal);

    // Update ticket timestamp
    db.prepare('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(ticketId);

    const createdNote = db.prepare(`
      SELECT tn.id, tn.note, tn.is_internal, tn.created_at, u.id AS author_id, u.name AS author_name, u.role AS author_role, u.college_id AS author_college_id
      FROM ticket_notes tn
      JOIN users u ON tn.user_id = u.id
      WHERE tn.id = ?
    `).get(insertResult.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Note added successfully',
      note: createdNote,
    });
  } catch (err) {
    console.error('[Add Ticket Note Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to add note to ticket' });
  }
});

/**
 * PATCH /api/tickets/:id/assign
 * Assign or reassign ticket to a technician
 * Allowed: Administrator, or Technician claiming self-assignment
 */
router.patch('/:id/assign', requireRole(['Technician', 'Administrator']), (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { technicianId } = req.body;
    const user = req.user;

    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket not found' });
    }

    let targetTechId = technicianId ? parseInt(technicianId, 10) : null;

    // If technician is claiming the ticket themselves
    if (user.role === 'Technician' && (!targetTechId || targetTechId === user.id)) {
      targetTechId = user.id;
    }

    if (targetTechId) {
      const techUser = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(targetTechId);
      if (!techUser || (techUser.role !== 'Technician' && techUser.role !== 'Administrator')) {
        return res.status(400).json({
          error: 'INVALID_TECHNICIAN',
          message: 'Target user must have Technician or Administrator credentials',
        });
      }
    }

    const newStatus = ticket.status === 'Open' && targetTechId ? 'Assigned' : ticket.status;

    db.prepare(`
      UPDATE tickets 
      SET technician_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(targetTechId, newStatus, ticketId);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'ASSIGN_TICKET', ?)
    `).run(
      user.id,
      `${user.name} assigned ticket ${ticket.ticket_number} to technician ID ${targetTechId || 'Unassigned'}`
    );

    const updated = db.prepare(`
      SELECT 
        t.*,
        rep.name AS reporter_name,
        rep.email AS reporter_email,
        rep.college_id AS reporter_college_id,
        rep.department AS reporter_department,
        tech.name AS technician_name,
        tech.email AS technician_email,
        tech.college_id AS technician_college_id
      FROM tickets t
      JOIN users rep ON t.reporter_id = rep.id
      LEFT JOIN users tech ON t.technician_id = tech.id
      WHERE t.id = ?
    `).get(ticketId);

    return res.json({
      success: true,
      message: `Ticket ${ticket.ticket_number} assigned successfully`,
      ticket: enrichTicket(updated, user),
    });
  } catch (err) {
    console.error('[Assign Ticket Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to assign ticket' });
  }
});

/**
 * DELETE /api/tickets/:id
 * Delete an incident record. Strictly restricted to Administrator role.
 */
router.delete('/:id', requireRole(['Administrator']), (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const ticket = db.prepare('SELECT id, ticket_number, title FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket not found' });
    }

    db.prepare('DELETE FROM tickets WHERE id = ?').run(ticketId);

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'DELETE_TICKET', ?)
    `).run(
      req.user.id,
      `Administrator ${req.user.name} deleted incident ticket ${ticket.ticket_number} ("${ticket.title}")`
    );

    return res.json({
      success: true,
      message: `Incident ${ticket.ticket_number} deleted successfully`,
    });
  } catch (err) {
    console.error('[Delete Ticket Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete ticket' });
  }
});

export default router;

