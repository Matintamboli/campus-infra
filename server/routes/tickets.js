import { Router } from 'express';
import prisma from '../prismaClient.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import {
  createNotification,
  notifyRole,
  checkRepeatedIssues,
} from '../services/notificationService.js';

const router = Router();

// All ticket routes require a valid authenticated session
router.use(authenticateToken);

/**
 * Helper: Enrich ticket with comments for response
 */
function enrichTicketResponse(incident, user = null) {
  if (!incident) return null;

  // Filter internal comments if user is Reporter
  const rawComments = user && user.role === 'Reporter' 
    ? incident.comments?.filter(c => !c.isInternal) 
    : incident.comments;

  // Map comments to expected frontend format
  const notes = rawComments?.map(c => ({
    id: c.id,
    note: c.message,
    is_internal: c.isInternal,
    created_at: c.createdAt,
    author_id: c.user?.id,
    author_name: c.user?.name,
    author_role: c.user?.role,
    author_college_id: c.user?.collegeId,
  })) || [];

  // Format attachments
  const attachments = incident.attachments ? JSON.parse(incident.attachments) : [];

  return {
    id: incident.id,
    ticketNumber: incident.ticketNumber,
    title: incident.title,
    description: incident.description,
    category: incident.categoryName,
    categoryId: incident.categoryId,
    priority: incident.priority,
    status: incident.status,
    building: incident.building,
    floor: incident.floor,
    room: incident.room,
    affectedService: incident.affectedService,
    reporter_id: incident.reporterId,
    reporter_name: incident.reporter?.name,
    reporter_email: incident.reporter?.email,
    reporter_college_id: incident.reporter?.collegeId,
    reporter_department: incident.reporter?.department,
    technician_id: incident.technicianId,
    technician_name: incident.technician?.name,
    technician_email: incident.technician?.email,
    technician_college_id: incident.technician?.collegeId,
    slaDeadline: incident.slaDeadline,
    firstResponseAt: incident.firstResponseAt,
    resolvedAt: incident.resolvedAt,
    closedAt: incident.closedAt,
    resolutionNotes: incident.resolutionNotes,
    resolution_details: incident.resolutionNotes, // Legacy field
    isRecurring: incident.isRecurring,
    createdAt: incident.createdAt,
    updated_at: incident.updatedAt,
    created_at: incident.createdAt,
    attachments,
    notes,
  };
}

/**
 * GET /api/tickets
 * Retrieve tickets with role-based access scoping and filtering
 */
router.get('/', async (req, res) => {
  try {
    const { status, category, priority, search, view } = req.query;
    const user = req.user;

    console.log('[GET /api/tickets] User:', { id: user.id, name: user.name, role: user.role });
    console.log('[GET /api/tickets] Query params:', { status, category, priority, search, view });

    const where = {};

    // Role-based scoping
    if (user.role === 'Reporter') {
      // Reporters can only see tickets they submitted
      where.reporterId = user.id;
    } else if (user.role === 'Technician') {
      // Technicians: view=all lets them inspect campus-wide incidents
      // view=assigned shows only their assigned tickets
      // default view shows their assigned queue + open unassigned
      if (view === 'assigned') {
        where.technicianId = user.id;
      } else if (view !== 'all') {
        where.OR = [
          { technicianId: user.id },
          { status: 'Open' }
        ];
      }
    }
    // Administrator can see everything (no default restriction)

    // Optional query filters
    if (status && status !== 'all') {
      where.status = status;
    }
    if (category && category !== 'all') {
      where.categoryName = category;
    }
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { ticketNumber: { contains: searchTerm, mode: 'insensitive' } },
        { building: { contains: searchTerm, mode: 'insensitive' } },
        { room: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    console.log('[GET /api/tickets] Prisma where clause:', JSON.stringify(where, null, 2));

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
            department: true,
          }
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                collegeId: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('[GET /api/tickets] Incidents found:', incidents.length);

    const tickets = incidents.map((incident) => enrichTicketResponse(incident, user));

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
router.get('/:id', async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const user = req.user;

    const incident = await prisma.incident.findUnique({
      where: { id: ticketId },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
            department: true,
          }
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                collegeId: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        activities: {
          include: {
            user: {
              select: {
                name: true,
                role: true,
              }
            }
          },
          orderBy: {
            timestamp: 'desc'
          }
        }
      }
    });

    if (!incident) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket not found' });
    }

    // Access control check: Reporters can only view their own ticket
    if (user.role === 'Reporter' && incident.reporterId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied to this ticket' });
    }

    const ticket = enrichTicketResponse(incident, user);
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
router.post('/', async (req, res) => {
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
    const maxIncident = await prisma.incident.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    });
    const nextSeq = (maxIncident?.id || 0) + 1;
    const ticketNumber = `INC-${1080 + nextSeq}`;

    const attachmentsJson = JSON.stringify(attachments);

    const incident = await prisma.incident.create({
      data: {
        ticketNumber,
        title: title.trim(),
        description: description.trim(),
        categoryName: category.trim(),
        priority: chosenPriority,
        status: 'Open',
        building: building.trim(),
        floor: floor ? floor.trim() : 'Ground Floor',
        room: room.trim(),
        affectedService: affectedService ? affectedService.trim() : 'General Campus Infrastructure',
        attachments: attachmentsJson,
        reporterId: user.id,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
            department: true,
          }
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
          }
        },
        comments: true
      }
    });

    // Record in Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_TICKET',
        details: `User ${user.name} (${user.role}) reported incident ${ticketNumber}: "${title.trim()}" in ${building} (${room})`,
      }
    });

    // Notifications Dispatch
    // 1. For Student/Faculty Reporter: Incident successfully submitted
    createNotification({
      userId: user.id,
      ticketId: incident.id,
      eventType: 'INCIDENT_SUBMITTED',
      title: 'Incident Successfully Submitted',
      message: `Your incident report ${ticketNumber} ("${title.trim()}") has been received and queued for operations triage.`,
      roleTarget: 'Reporter',
      priority: chosenPriority.toLowerCase(),
      metadata: { ticketNumber, building, room, category },
    });

    // 2. For Administrators: New incident submitted
    notifyRole('Administrator', {
      ticketId: incident.id,
      eventType: 'NEW_INCIDENT_SUBMITTED',
      title: `New Incident Reported: ${ticketNumber}`,
      message: `${user.name} reported "${title.trim()}" in ${building} (${room}) under ${category}.`,
      priority: chosenPriority.toLowerCase(),
      metadata: { ticketNumber, building, room, reporterName: user.name },
    });

    // 3. If Critical Priority: Immediate urgent broadcast
    if (chosenPriority === 'Critical') {
      notifyRole('Administrator', {
        ticketId: incident.id,
        eventType: 'CRITICAL_INCIDENT',
        title: `CRITICAL ALERT: Urgent Incident ${ticketNumber}`,
        message: `CRITICAL SLA PRIORITY: ${ticketNumber} reported in ${building} (${room}). Immediate response required.`,
        priority: 'critical',
        metadata: { ticketNumber, building, room, category },
      });

      notifyRole('Technician', {
        ticketId: incident.id,
        eventType: 'CRITICAL_INCIDENT',
        title: `Critical Incident Logged: ${ticketNumber}`,
        message: `High-priority work order ${ticketNumber} logged in ${building} (${room}). Ready for dispatch.`,
        priority: 'critical',
        metadata: { ticketNumber, building, room, category },
      });
    }

    // 4. Repeated Infrastructure Issue Detection
    checkRepeatedIssues(enrichTicketResponse(incident));

    return res.status(201).json({
      success: true,
      message: `Incident ticket ${ticketNumber} registered successfully`,
      ticket: enrichTicketResponse(incident),
    });
  } catch (err) {
    console.error('[Create Ticket Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create ticket' });
  }
});

/**
 * PATCH /api/tickets/:id/status
 * Update ticket lifecycle status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { status, note, reopenReason, resolutionDetails } = req.body;
    const user = req.user;

    const validStatuses = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'INVALID_STATUS',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const existingTicket = await prisma.incident.findUnique({
      where: { id: ticketId }
    });

    if (!existingTicket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket not found' });
    }

    // Role-based authorization
    if (user.role === 'Reporter') {
      if (existingTicket.reporterId !== user.id) {
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
      if (existingTicket.technicianId && existingTicket.technicianId !== user.id) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Access denied: Only the assigned technician or an administrator can update this incident.',
        });
      }
    }

    // Auto-assign technician if claiming work
    let updatedTechnicianId = existingTicket.technicianId;
    if (user.role === 'Technician' && !existingTicket.technicianId) {
      updatedTechnicianId = user.id;
    }

    const updateData = {
      status,
      technicianId: updatedTechnicianId,
    };

    if (resolutionDetails !== undefined) {
      updateData.resolutionNotes = resolutionDetails;
    }

    if (status === 'Resolved' && !existingTicket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    if (status === 'Closed' && !existingTicket.closedAt) {
      updateData.closedAt = new Date();
    }

    const updatedIncident = await prisma.incident.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
            department: true,
          }
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                collegeId: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    // Add note if provided
    let noteText = reopenReason ? `[REOPENED BY REPORTER]: ${reopenReason}` : note;
    if (resolutionDetails && resolutionDetails.trim()) {
      noteText = noteText ? `${noteText}\n[RESOLUTION DETAILS]: ${resolutionDetails.trim()}` : `[RESOLUTION DETAILS]: ${resolutionDetails.trim()}`;
    }

    if (noteText && noteText.trim()) {
      await prisma.incidentComment.create({
        data: {
          incidentId: ticketId,
          userId: user.id,
          message: noteText.trim(),
          isInternal: false,
        }
      });
    } else if (existingTicket.status === 'Resolved' && status === 'Closed' && user.role === 'Reporter') {
      await prisma.incidentComment.create({
        data: {
          incidentId: ticketId,
          userId: user.id,
          message: 'Reporter verified campus infrastructure operation and confirmed resolution.',
          isInternal: false,
        }
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_TICKET_STATUS',
        details: `${user.role} ${user.name} changed status of ${existingTicket.ticketNumber} from "${existingTicket.status}" to "${status}"`,
      }
    });

    // Notifications
    if (existingTicket.status !== status) {
      if (status === 'Resolved') {
        createNotification({
          userId: existingTicket.reporterId,
          ticketId,
          eventType: 'INCIDENT_RESOLVED',
          title: `Incident Resolved: ${existingTicket.ticketNumber}`,
          message: `${user.name} marked incident ${existingTicket.ticketNumber} as Resolved.`,
          roleTarget: 'Reporter',
          priority: 'high',
          metadata: { ticketNumber: existingTicket.ticketNumber, status },
        });
      } else if (status === 'Closed') {
        createNotification({
          userId: existingTicket.reporterId,
          ticketId,
          eventType: 'INCIDENT_CLOSED',
          title: `Incident Closed: ${existingTicket.ticketNumber}`,
          message: `Incident ${existingTicket.ticketNumber} has been verified and officially closed.`,
          roleTarget: 'Reporter',
          priority: 'normal',
          metadata: { ticketNumber: existingTicket.ticketNumber, status },
        });
      }
    }

    return res.json({
      success: true,
      message: `Status for ticket ${existingTicket.ticketNumber} changed to ${status}`,
      ticket: enrichTicketResponse(updatedIncident, user),
    });
  } catch (err) {
    console.error('[Update Ticket Status Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update ticket status' });
  }
});

/**
 * POST /api/tickets/:id/attachments
 * Upload additional supporting evidence
 */
router.post('/:id/attachments', async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { attachments } = req.body;
    const user = req.user;

    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Attachments array is required' });
    }

    const ticket = await prisma.incident.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket not found' });
    }

    if (user.role === 'Reporter' && ticket.reporterId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot upload attachments to tickets not owned by you' });
    }
    if (user.role === 'Technician' && ticket.technicianId && ticket.technicianId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot upload attachments to tickets assigned to another technician' });
    }

    let existingAttachments = [];
    if (ticket.attachments) {
      try {
        existingAttachments = JSON.parse(ticket.attachments);
      } catch {
        existingAttachments = [];
      }
    }

    const combined = [...existingAttachments, ...attachments];

    const updatedIncident = await prisma.incident.update({
      where: { id: ticketId },
      data: {
        attachments: JSON.stringify(combined),
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
            department: true,
          }
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                collegeId: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    // Add note
    await prisma.incidentComment.create({
      data: {
        incidentId: ticketId,
        userId: user.id,
        message: `Uploaded ${attachments.length} additional supporting evidence attachment(s): ${attachments.map(a => a.name).join(', ')}`,
        isInternal: false,
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPLOAD_ATTACHMENT',
        details: `${user.role} ${user.name} added ${attachments.length} attachment(s) to ticket ${ticket.ticketNumber}`,
      }
    });

    return res.json({
      success: true,
      message: `${attachments.length} attachment(s) uploaded successfully`,
      ticket: enrichTicketResponse(updatedIncident, user),
    });
  } catch (err) {
    console.error('[Upload Attachments Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to upload attachments' });
  }
});

/**
 * POST /api/tickets/:id/notes
 * Add technical diagnostics note or investigation log
 */
router.post('/:id/notes', async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { note, isInternal } = req.body;
    const user = req.user;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Note text cannot be empty' });
    }

    const ticket = await prisma.incident.findUnique({
      where: { id: ticketId },
      select: { id: true, ticketNumber: true, reporterId: true, technicianId: true }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket not found' });
    }

    if (user.role === 'Reporter' && ticket.reporterId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot add notes to tickets not owned by you' });
    }
    if (user.role === 'Technician' && ticket.technicianId && ticket.technicianId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot add notes to tickets assigned to another technician' });
    }

    const isInternalVal = ((user.role === 'Technician' || user.role === 'Administrator') && isInternal) ? true : false;

    const createdComment = await prisma.incidentComment.create({
      data: {
        incidentId: ticketId,
        userId: user.id,
        message: note.trim(),
        isInternal: isInternalVal,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            collegeId: true,
          }
        }
      }
    });

    // Update ticket timestamp
    await prisma.incident.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    });

    // Notification Dispatch
    const snippet = note.trim().length > 90 ? `${note.trim().slice(0, 90)}...` : note.trim();
    if ((user.role === 'Technician' || user.role === 'Administrator') && !isInternalVal) {
      createNotification({
        userId: ticket.reporterId,
        ticketId,
        eventType: 'NOTE_ADDED',
        title: `Technician Update on ${ticket.ticketNumber}`,
        message: `${user.name} posted an update: "${snippet}"`,
        roleTarget: 'Reporter',
        priority: 'normal',
        metadata: { ticketNumber: ticket.ticketNumber },
      });
    } else if (user.role === 'Reporter' && ticket.technicianId) {
      createNotification({
        userId: ticket.technicianId,
        ticketId,
        eventType: 'REPORTER_COMMENT',
        title: `Reporter Comment on ${ticket.ticketNumber}`,
        message: `Reporter ${user.name} commented: "${snippet}"`,
        roleTarget: 'Technician',
        priority: 'normal',
        metadata: { ticketNumber: ticket.ticketNumber },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Note added successfully',
      note: {
        id: createdComment.id,
        note: createdComment.message,
        is_internal: createdComment.isInternal,
        created_at: createdComment.createdAt,
        author_id: createdComment.user.id,
        author_name: createdComment.user.name,
        author_role: createdComment.user.role,
        author_college_id: createdComment.user.collegeId,
      },
    });
  } catch (err) {
    console.error('[Add Ticket Note Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to add note to ticket' });
  }
});

/**
 * PATCH /api/tickets/:id/assign
 * Assign or reassign ticket to a technician
 */
router.patch('/:id/assign', requireRole(['Technician', 'Administrator']), async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { technicianId } = req.body;
    const user = req.user;

    const ticket = await prisma.incident.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ticket not found' });
    }

    let targetTechId = technicianId ? parseInt(technicianId, 10) : null;

    if (user.role === 'Technician' && (!targetTechId || targetTechId === user.id)) {
      targetTechId = user.id;
    }

    if (targetTechId) {
      const techUser = await prisma.user.findUnique({
        where: { id: targetTechId },
        select: { id: true, name: true, role: true }
      });

      if (!techUser || (techUser.role !== 'Technician' && techUser.role !== 'Administrator')) {
        return res.status(400).json({
          error: 'INVALID_TECHNICIAN',
          message: 'Target user must have Technician or Administrator credentials',
        });
      }
    }

    const newStatus = ticket.status === 'Open' && targetTechId ? 'Assigned' : ticket.status;

    const updatedIncident = await prisma.incident.update({
      where: { id: ticketId },
      data: {
        technicianId: targetTechId,
        status: newStatus,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
            department: true,
          }
        },
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
            collegeId: true,
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                collegeId: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ASSIGN_TICKET',
        details: `${user.name} assigned ticket ${ticket.ticketNumber} to technician ID ${targetTechId || 'Unassigned'}`,
      }
    });

    const assignedTechName = updatedIncident.technician?.name || 'Specialist';

    // Notifications
    createNotification({
      userId: ticket.reporterId,
      ticketId,
      eventType: 'INCIDENT_ASSIGNED',
      title: 'Technician Assigned to Incident',
      message: `Technician ${assignedTechName} has been assigned to investigate ${ticket.ticketNumber}.`,
      roleTarget: 'Reporter',
      priority: 'normal',
      metadata: { ticketNumber: ticket.ticketNumber, technicianName: assignedTechName },
    });

    if (targetTechId) {
      createNotification({
        userId: targetTechId,
        ticketId,
        eventType: 'NEW_INCIDENT_ASSIGNED',
        title: `New Work Order Assigned: ${ticket.ticketNumber}`,
        message: `You have been dispatched to ${ticket.ticketNumber} ("${ticket.title}") at ${ticket.building} (${ticket.room}).`,
        roleTarget: 'Technician',
        priority: ticket.priority === 'Critical' ? 'critical' : 'high',
        metadata: { ticketNumber: ticket.ticketNumber, priority: ticket.priority, building: ticket.building, room: ticket.room },
      });
    }

    return res.json({
      success: true,
      message: `Ticket ${ticket.ticketNumber} ${targetTechId ? 'assigned to' : 'unassigned from'} technician`,
      ticket: enrichTicketResponse(updatedIncident, user),
    });
  } catch (err) {
    console.error('[Assign Ticket Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to assign ticket' });
  }
});

export default router;
