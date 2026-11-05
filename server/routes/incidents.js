import { Router } from 'express';
import prisma from '../prismaClient.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// All incident routes require authentication
router.use(authenticateToken);

/**
 * Helper: Enrich incident with related data
 */
function buildIncidentSelect(includeInternalComments = false) {
  return {
    id: true,
    ticketNumber: true,
    title: true,
    description: true,
    categoryId: true,
    categoryName: true,
    locationId: true,
    serviceId: true,
    building: true,
    floor: true,
    room: true,
    affectedService: true,
    priority: true,
    status: true,
    slaDeadline: true,
    firstResponseAt: true,
    resolvedAt: true,
    closedAt: true,
    resolutionNotes: true,
    isRecurring: true,
    recurringClusterId: true,
    createdAt: true,
    updatedAt: true,
    reporter: {
      select: {
        id: true,
        name: true,
        email: true,
        collegeId: true,
        userType: true,
        department: true,
      },
    },
    technician: {
      select: {
        id: true,
        name: true,
        email: true,
        collegeId: true,
        department: true,
      },
    },
    category: {
      select: {
        id: true,
        name: true,
        code: true,
        slaHours: true,
      },
    },
    location: {
      select: {
        id: true,
        building: true,
        floor: true,
        room: true,
      },
    },
    service: {
      select: {
        id: true,
        name: true,
        slaHours: true,
      },
    },
    comments: {
      where: includeInternalComments ? {} : { isInternal: false },
      select: {
        id: true,
        message: true,
        isInternal: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            collegeId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    },
    attachments: {
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        uploadedAt: true,
      },
    },
    activities: {
      select: {
        id: true,
        action: true,
        fromState: true,
        toState: true,
        details: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
  };
}

/**
 * GET /api/incidents
 * Retrieve incidents with role-based access scoping and filtering
 */
router.get('/', async (req, res) => {
  try {
    const { status, category, priority, search, view, building } = req.query;
    const user = req.user;

    const where = {};

    // Role-based scoping
    if (user.role === 'Reporter') {
      where.reporterId = user.id;
    } else if (user.role === 'Technician') {
      if (view === 'assigned') {
        where.technicianId = user.id;
      } else if (view !== 'all') {
        where.OR = [
          { technicianId: user.id },
          { status: 'Open' },
        ];
      }
    }
    // Administrator can see everything

    // Optional filters
    if (status && status !== 'all') {
      where.status = status;
    }
    if (category && category !== 'all') {
      where.categoryName = category;
    }
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    if (building && building !== 'all') {
      where.building = building;
    }
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { ticketNumber: { contains: searchTerm, mode: 'insensitive' } },
        { building: { contains: searchTerm, mode: 'insensitive' } },
        { room: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const includeInternalComments = user.role === 'Technician' || user.role === 'Administrator';

    const incidents = await prisma.incident.findMany({
      where,
      select: buildIncidentSelect(includeInternalComments),
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (err) {
    console.error('[Get Incidents Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve incidents' });
  }
});

/**
 * GET /api/incidents/:id
 * Retrieve a single incident with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const incidentId = parseInt(req.params.id, 10);
    const user = req.user;

    const includeInternalComments = user.role === 'Technician' || user.role === 'Administrator';

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: buildIncidentSelect(includeInternalComments),
    });

    if (!incident) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Incident not found' });
    }

    // Access control: Reporters can only view their own incidents
    if (user.role === 'Reporter' && incident.reporter.id !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied to this incident' });
    }

    return res.json({ success: true, incident });
  } catch (err) {
    console.error('[Get Incident Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve incident' });
  }
});

/**
 * POST /api/incidents
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
    } = req.body;
    const user = req.user;

    // Validations
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

    // Generate unique ticket number
    const lastIncident = await prisma.incident.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const nextSeq = (lastIncident?.id || 0) + 1;
    const ticketNumber = `INC-${1080 + nextSeq}`;

    // Find or create category
    let categoryRecord = await prisma.incidentCategory.findFirst({
      where: { name: category.trim() },
    });

    if (!categoryRecord) {
      categoryRecord = await prisma.incidentCategory.create({
        data: {
          name: category.trim(),
          code: category.trim().toLowerCase().replace(/\s+/g, '_'),
          description: `Auto-created category for ${category.trim()}`,
          slaHours: 4,
          status: 'active',
        },
      });
    }

    // Find or create location
    let locationRecord = await prisma.campusLocation.findFirst({
      where: {
        building: building.trim(),
        floor: floor ? floor.trim() : 'Ground Floor',
        room: room.trim(),
      },
    });

    if (!locationRecord) {
      locationRecord = await prisma.campusLocation.create({
        data: {
          building: building.trim(),
          floor: floor ? floor.trim() : 'Ground Floor',
          room: room.trim(),
          status: 'active',
        },
      });
    }

    // Find service if provided
    let serviceRecord = null;
    if (affectedService && affectedService !== 'General Campus Service') {
      serviceRecord = await prisma.campusService.findFirst({
        where: { name: affectedService.trim() },
      });
    }

    // Create incident
    const newIncident = await prisma.incident.create({
      data: {
        ticketNumber,
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryRecord.id,
        categoryName: categoryRecord.name,
        locationId: locationRecord.id,
        serviceId: serviceRecord?.id,
        building: building.trim(),
        floor: floor ? floor.trim() : 'Ground Floor',
        room: room.trim(),
        affectedService: affectedService ? affectedService.trim() : 'General Campus Infrastructure',
        priority: chosenPriority,
        status: 'Open',
        reporterId: user.id,
      },
      select: buildIncidentSelect(false),
    });

    // Create activity record
    await prisma.incidentActivity.create({
      data: {
        incidentId: newIncident.id,
        userId: user.id,
        action: 'CREATED',
        toState: 'Open',
        details: `Incident created by ${user.name}`,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_INCIDENT',
        details: `Created incident ${ticketNumber}: "${title.trim()}" in ${building} (${room})`,
      },
    });

    // Create notifications
    // 1. Confirmation for reporter
    await prisma.notification.create({
      data: {
        userId: user.id,
        ticketId: newIncident.id,
        ticketNumber: newIncident.ticketNumber,
        eventType: 'INCIDENT_SUBMITTED',
        title: 'Incident Successfully Submitted',
        message: `Your incident report ${ticketNumber} has been received and queued for operations triage.`,
        priority: chosenPriority.toLowerCase(),
        building: newIncident.building,
      },
    });

    // 2. Notify administrators
    const admins = await prisma.user.findMany({
      where: { role: 'Administrator', status: 'active' },
      select: { id: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          ticketId: newIncident.id,
          ticketNumber: newIncident.ticketNumber,
          eventType: 'NEW_INCIDENT_SUBMITTED',
          title: `New Incident Reported: ${ticketNumber}`,
          message: `${user.name} reported "${title.trim()}" in ${building} (${room}).`,
          priority: chosenPriority.toLowerCase(),
          building: newIncident.building,
        },
      });
    }

    // 3. If Critical, notify all technicians
    if (chosenPriority === 'Critical') {
      const techs = await prisma.user.findMany({
        where: { role: 'Technician', status: 'active' },
        select: { id: true },
      });

      for (const tech of techs) {
        await prisma.notification.create({
          data: {
            userId: tech.id,
            ticketId: newIncident.id,
            ticketNumber: newIncident.ticketNumber,
            eventType: 'CRITICAL_INCIDENT',
            title: `Critical Incident: ${ticketNumber}`,
            message: `CRITICAL: ${ticketNumber} reported in ${building} (${room}). Immediate response required.`,
            priority: 'critical',
            building: newIncident.building,
          },
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Incident ticket ${ticketNumber} registered successfully`,
      incident: newIncident,
    });
  } catch (err) {
    console.error('[Create Incident Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create incident' });
  }
});

/**
 * PATCH /api/incidents/:id/status
 * Update incident status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const incidentId = parseInt(req.params.id, 10);
    const { status, note, reopenReason, resolutionNotes } = req.body;
    const user = req.user;

    const validStatuses = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'INVALID_STATUS',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { reporter: true, technician: true },
    });

    if (!incident) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Incident not found' });
    }

    // Role-based authorization
    if (user.role === 'Reporter') {
      if (incident.reporterId !== user.id) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
      }
      const isConfirming = incident.status === 'Resolved' && status === 'Closed';
      const isReopening = (incident.status === 'Resolved' || incident.status === 'Closed') && status === 'Open';

      if (!isConfirming && !isReopening) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Reporters may only confirm resolution or reopen issues.',
        });
      }
    } else if (user.role === 'Technician') {
      if (incident.technicianId && incident.technicianId !== user.id) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Only the assigned technician or an administrator can update this incident.',
        });
      }
    }

    // Auto-assign technician if claiming work
    let updateData = { status, updatedAt: new Date() };
    
    if (user.role === 'Technician' && !incident.technicianId) {
      updateData.technicianId = user.id;
    }

    if (resolutionNotes) {
      updateData.resolutionNotes = resolutionNotes;
    }

    if (status === 'Resolved' && !incident.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    if (status === 'Closed' && !incident.closedAt) {
      updateData.closedAt = new Date();
    }

    // Update incident
    await prisma.incident.update({
      where: { id: incidentId },
      data: updateData,
    });

    // Add comment if provided
    let noteText = reopenReason ? `[REOPENED BY REPORTER]: ${reopenReason}` : note;
    if (resolutionNotes && resolutionNotes.trim()) {
      noteText = noteText ? `${noteText}\n[RESOLUTION]: ${resolutionNotes.trim()}` : `[RESOLUTION]: ${resolutionNotes.trim()}`;
    } else if (incident.status === 'Resolved' && status === 'Closed' && user.role === 'Reporter') {
      noteText = 'Reporter confirmed resolution and closed incident.';
    }

    if (noteText && noteText.trim()) {
      await prisma.incidentComment.create({
        data: {
          incidentId,
          userId: user.id,
          message: noteText.trim(),
          isInternal: false,
        },
      });
    }

    // Activity log
    await prisma.incidentActivity.create({
      data: {
        incidentId,
        userId: user.id,
        action: 'STATUS_CHANGED',
        fromState: incident.status,
        toState: status,
        details: `Status changed from ${incident.status} to ${status} by ${user.name}`,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_INCIDENT_STATUS',
        details: `Changed ${incident.ticketNumber} status from "${incident.status}" to "${status}"`,
      },
    });

    // Notifications
    if (incident.status !== status) {
      if (status === 'Resolved') {
        await prisma.notification.create({
          data: {
            userId: incident.reporterId,
            ticketId: incidentId,
            ticketNumber: incident.ticketNumber,
            eventType: 'INCIDENT_RESOLVED',
            title: `Incident Resolved: ${incident.ticketNumber}`,
            message: `${user.name} marked incident ${incident.ticketNumber} as Resolved. Please confirm.`,
            priority: 'high',
            building: incident.building,
          },
        });
      } else if (status === 'Closed') {
        await prisma.notification.create({
          data: {
            userId: incident.reporterId,
            ticketId: incidentId,
            ticketNumber: incident.ticketNumber,
            eventType: 'INCIDENT_CLOSED',
            title: `Incident Closed: ${incident.ticketNumber}`,
            message: `Incident ${incident.ticketNumber} has been verified and officially closed.`,
            priority: 'normal',
            building: incident.building,
          },
        });
      } else if (incident.reporterId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: incident.reporterId,
            ticketId: incidentId,
            ticketNumber: incident.ticketNumber,
            eventType: 'STATUS_CHANGED',
            title: `Status Updated: ${incident.ticketNumber}`,
            message: `Incident ${incident.ticketNumber} is now marked as "${status}".`,
            priority: 'normal',
            building: incident.building,
          },
        });
      }
    }

    const updatedIncident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: buildIncidentSelect(user.role !== 'Reporter'),
    });

    return res.json({
      success: true,
      message: `Status for ${incident.ticketNumber} changed to ${status}`,
      incident: updatedIncident,
    });
  } catch (err) {
    console.error('[Update Status Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update status' });
  }
});

/**
 * PATCH /api/incidents/:id/assign
 * Assign or reassign incident to a technician
 */
router.patch('/:id/assign', requireRole(['Technician', 'Administrator']), async (req, res) => {
  try {
    const incidentId = parseInt(req.params.id, 10);
    const { technicianId } = req.body;
    const user = req.user;

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: { reporter: true, technician: true },
    });

    if (!incident) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Incident not found' });
    }

    let targetTechId = technicianId ? parseInt(technicianId, 10) : null;

    // Technician claiming ticket
    if (user.role === 'Technician' && (!targetTechId || targetTechId === user.id)) {
      targetTechId = user.id;
    }

    if (targetTechId) {
      const techUser = await prisma.user.findUnique({
        where: { id: targetTechId },
        select: { id: true, name: true, role: true },
      });

      if (!techUser || (techUser.role !== 'Technician' && techUser.role !== 'Administrator')) {
        return res.status(400).json({
          error: 'INVALID_TECHNICIAN',
          message: 'Target user must have Technician or Administrator credentials',
        });
      }
    }

    const newStatus = incident.status === 'Open' && targetTechId ? 'Assigned' : incident.status;

    // Update incident
    await prisma.incident.update({
      where: { id: incidentId },
      data: {
        technicianId: targetTechId,
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // Create assignment record
    if (targetTechId) {
      await prisma.technicianAssignment.create({
        data: {
          incidentId,
          technicianId: targetTechId,
          assignedById: user.id,
          status: 'active',
        },
      });
    }

    // Activity log
    await prisma.incidentActivity.create({
      data: {
        incidentId,
        userId: user.id,
        action: 'ASSIGNED',
        fromState: incident.status,
        toState: newStatus,
        details: targetTechId ? `Assigned to technician ID ${targetTechId}` : 'Unassigned',
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ASSIGN_INCIDENT',
        details: `Assigned ${incident.ticketNumber} to technician ID ${targetTechId || 'Unassigned'}`,
      },
    });

    const updatedIncident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: buildIncidentSelect(true),
    });

    // Notifications
    const assignedTechName = updatedIncident.technician?.name || 'Specialist';

    // Notify reporter
    await prisma.notification.create({
      data: {
        userId: incident.reporterId,
        ticketId: incidentId,
        ticketNumber: incident.ticketNumber,
        eventType: 'INCIDENT_ASSIGNED',
        title: 'Technician Assigned',
        message: `Technician ${assignedTechName} has been assigned to ${incident.ticketNumber}.`,
        priority: 'normal',
        building: incident.building,
      },
    });

    // Notify assigned technician
    if (targetTechId) {
      await prisma.notification.create({
        data: {
          userId: targetTechId,
          ticketId: incidentId,
          ticketNumber: incident.ticketNumber,
          eventType: 'NEW_INCIDENT_ASSIGNED',
          title: `New Work Order: ${incident.ticketNumber}`,
          message: `You have been assigned to ${incident.ticketNumber} in ${incident.building} (${incident.room}).`,
          priority: incident.priority === 'Critical' ? 'critical' : 'high',
          building: incident.building,
        },
      });
    }

    // Notify previous technician if reassigned
    if (incident.technicianId && incident.technicianId !== targetTechId) {
      await prisma.notification.create({
        data: {
          userId: incident.technicianId,
          ticketId: incidentId,
          ticketNumber: incident.ticketNumber,
          eventType: 'INCIDENT_REASSIGNED',
          title: `Work Order Reassigned: ${incident.ticketNumber}`,
          message: `Incident ${incident.ticketNumber} has been transferred to ${assignedTechName}.`,
          priority: 'normal',
          building: incident.building,
        },
      });
    }

    return res.json({
      success: true,
      message: `Incident ${incident.ticketNumber} assigned successfully`,
      incident: updatedIncident,
    });
  } catch (err) {
    console.error('[Assign Incident Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to assign incident' });
  }
});

/**
 * POST /api/incidents/:id/comments
 * Add comment to incident
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const incidentId = parseInt(req.params.id, 10);
    const { message, isInternal } = req.body;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Comment text cannot be empty' });
    }

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { id: true, ticketNumber: true, reporterId: true, technicianId: true, building: true },
    });

    if (!incident) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Incident not found' });
    }

    // Access control
    if (user.role === 'Reporter' && incident.reporterId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }
    if (user.role === 'Technician' && incident.technicianId && incident.technicianId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const isInternalVal = ((user.role === 'Technician' || user.role === 'Administrator') && isInternal) || false;

    const comment = await prisma.incidentComment.create({
      data: {
        incidentId,
        userId: user.id,
        message: message.trim(),
        isInternal: isInternalVal,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            collegeId: true,
          },
        },
      },
    });

    // Update incident timestamp
    await prisma.incident.update({
      where: { id: incidentId },
      data: { updatedAt: new Date() },
    });

    // Activity log
    await prisma.incidentActivity.create({
      data: {
        incidentId,
        userId: user.id,
        action: 'COMMENT_ADDED',
        details: isInternalVal ? 'Added internal note' : 'Added public comment',
      },
    });

    // Notifications
    const snippet = message.trim().length > 90 ? `${message.trim().slice(0, 90)}...` : message.trim();
    if ((user.role === 'Technician' || user.role === 'Administrator') && !isInternalVal) {
      await prisma.notification.create({
        data: {
          userId: incident.reporterId,
          ticketId: incidentId,
          ticketNumber: incident.ticketNumber,
          eventType: 'NOTE_ADDED',
          title: `Technician Update on ${incident.ticketNumber}`,
          message: `${user.name} posted: "${snippet}"`,
          priority: 'normal',
          building: incident.building,
        },
      });
    } else if (user.role === 'Reporter' && incident.technicianId) {
      await prisma.notification.create({
        data: {
          userId: incident.technicianId,
          ticketId: incidentId,
          ticketNumber: incident.ticketNumber,
          eventType: 'REPORTER_COMMENT',
          title: `Reporter Comment on ${incident.ticketNumber}`,
          message: `${user.name} commented: "${snippet}"`,
          priority: 'normal',
          building: incident.building,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment,
    });
  } catch (err) {
    console.error('[Add Comment Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to add comment' });
  }
});

/**
 * PATCH /api/incidents/:id/priority
 * Update incident priority
 */
router.patch('/:id/priority', requireRole(['Administrator', 'Technician']), async (req, res) => {
  try {
    const incidentId = parseInt(req.params.id, 10);
    const { priority } = req.body;
    const user = req.user;

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: 'INVALID_PRIORITY',
        message: `Priority must be one of: ${validPriorities.join(', ')}`,
      });
    }

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: { id: true, ticketNumber: true, priority: true, reporterId: true, building: true },
    });

    if (!incident) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Incident not found' });
    }

    await prisma.incident.update({
      where: { id: incidentId },
      data: { priority, updatedAt: new Date() },
    });

    // Activity log
    await prisma.incidentActivity.create({
      data: {
        incidentId,
        userId: user.id,
        action: 'PRIORITY_CHANGED',
        fromState: incident.priority,
        toState: priority,
        details: `Priority changed from ${incident.priority} to ${priority}`,
      },
    });

    // Notify reporter
    await prisma.notification.create({
      data: {
        userId: incident.reporterId,
        ticketId: incidentId,
        ticketNumber: incident.ticketNumber,
        eventType: 'PRIORITY_CHANGED',
        title: `Priority Updated: ${incident.ticketNumber}`,
        message: `Priority changed to ${priority} by ${user.name}`,
        priority: priority.toLowerCase(),
        building: incident.building,
      },
    });

    return res.json({
      success: true,
      message: `Priority updated to ${priority}`,
    });
  } catch (err) {
    console.error('[Update Priority Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update priority' });
  }
});

export default router;
