import { Router } from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Require Administrator or Technician role to access analytics
router.use(authenticateToken);
router.use(requireRole(['Administrator', 'Technician']));

/**
 * Helper to format duration in human-readable terms
 */
function formatHours(hours) {
  if (hours == null || isNaN(hours) || hours <= 0) return '—';
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = (hours / 24).toFixed(1);
  return `${days}d`;
}

/**
 * Helper to build date range boundaries
 */
function getDateBoundaries(timeRange, customStart, customEnd) {
  const now = new Date();
  let start = null;
  let end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (timeRange) {
    case 'today': {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case '7d': {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case '30d': {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case '3m': {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'custom': {
      if (customStart) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      break;
    }
    case 'all':
    default:
      start = null;
      break;
  }

  return { start, end };
}

/**
 * Filter tickets using SQL + parameters
 */
function getFilteredTickets({ timeRange = '30d', startDate, endDate, building, category, priority }) {
  const { start, end } = getDateBoundaries(timeRange, startDate, endDate);
  const whereClauses = [];
  const params = [];

  if (start) {
    const startStr = start.toISOString().replace('T', ' ').slice(0, 19);
    whereClauses.push('datetime(t.created_at) >= datetime(?)');
    params.push(startStr);
  }
  if (end && timeRange !== 'all') {
    const endStr = end.toISOString().replace('T', ' ').slice(0, 19);
    whereClauses.push('datetime(t.created_at) <= datetime(?)');
    params.push(endStr);
  }

  if (building && building !== 'all') {
    whereClauses.push('t.building = ?');
    params.push(building);
  }

  if (category && category !== 'all') {
    whereClauses.push('t.category = ?');
    params.push(category);
  }

  if (priority && priority !== 'all') {
    whereClauses.push('t.priority = ?');
    params.push(priority);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      t.*,
      u.name as reporter_name,
      u.email as reporter_email,
      u.college_id as reporter_college_id,
      tech.name as technician_name,
      tech.college_id as technician_college_id
    FROM tickets t
    LEFT JOIN users u ON t.reporter_id = u.id
    LEFT JOIN users tech ON t.technician_id = tech.id
    ${whereSql}
    ORDER BY t.created_at DESC
  `;

  return {
    tickets: db.prepare(sql).all(...params),
    boundaries: { start, end },
  };
}

/**
 * GET /api/analytics
 * Comprehensive aggregated metrics and chart datasets
 */
router.get('/', (req, res) => {
  try {
    const { timeRange = '30d', startDate, endDate, building, category, priority } = req.query;

    const { tickets, boundaries } = getFilteredTickets({
      timeRange,
      startDate,
      endDate,
      building,
      category,
      priority,
    });

    const totalIncidents = tickets.length;
    const openIncidents = tickets.filter((t) => t.status === 'Open').length;
    const assignedIncidents = tickets.filter((t) => t.status === 'Assigned').length;
    const inProgressIncidents = tickets.filter((t) => t.status === 'In Progress').length;
    const resolvedIncidents = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
    const criticalIncidents = tickets.filter((t) => t.priority === 'Critical').length;

    // ── Response Time Calculation ──────────────────────────────────────────────
    // Hours from created_at to first assignment or status advance beyond Open
    let totalResponseHours = 0;
    let respondedCount = 0;
    tickets.forEach((t) => {
      if (t.technician_id || t.status !== 'Open') {
        const created = new Date(t.created_at).getTime();
        const updated = new Date(t.updated_at || t.created_at).getTime();
        const hours = Math.max(0.05, (updated - created) / 3600000);
        totalResponseHours += hours;
        respondedCount++;
      }
    });
    const avgResponseHoursNum = respondedCount > 0 ? totalResponseHours / respondedCount : null;

    // ── Resolution Time Calculation ────────────────────────────────────────────
    // Hours from created_at to resolved/closed updated_at timestamp
    let totalResolutionHours = 0;
    let resolvedCount = 0;
    tickets
      .filter((t) => t.status === 'Resolved' || t.status === 'Closed')
      .forEach((t) => {
        const created = new Date(t.created_at).getTime();
        const updated = new Date(t.updated_at || t.created_at).getTime();
        const hours = Math.max(0.2, (updated - created) / 3600000);
        totalResolutionHours += hours;
        resolvedCount++;
      });
    const avgResolutionHoursNum = resolvedCount > 0 ? totalResolutionHours / resolvedCount : null;

    // ── Recurring Incidents Detection ──────────────────────────────────────────
    // Group by building and category; any cluster with >= 2 incidents counts as recurring
    const clusterMap = {};
    tickets.forEach((t) => {
      const key = `${t.building}___${t.category}`;
      clusterMap[key] = (clusterMap[key] || 0) + 1;
    });

    let recurringCount = 0;
    const recurringClusters = [];
    Object.entries(clusterMap).forEach(([k, count]) => {
      if (count >= 2) {
        recurringCount += count;
        const [bldg, cat] = k.split('___');
        recurringClusters.push({ building: bldg, category: cat, count });
      }
    });
    recurringClusters.sort((a, b) => b.count - a.count);

    // ── Resolution Rate ────────────────────────────────────────────────────────
    const resolutionRateNum = totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 0;

    // ── 1. Chart: Incidents Reported Over Time (Line Chart) ─────────────────────
    const timelineMap = {};

    if (timeRange === 'today') {
      // 2-hour intervals for today
      for (let h = 0; h < 24; h += 2) {
        const label = `${String(h).padStart(2, '0')}:00`;
        timelineMap[label] = { label, total: 0, resolved: 0, critical: 0 };
      }
      tickets.forEach((t) => {
        const d = new Date(t.created_at);
        const bucketH = Math.floor(d.getHours() / 2) * 2;
        const label = `${String(bucketH).padStart(2, '0')}:00`;
        if (timelineMap[label]) {
          timelineMap[label].total++;
          if (t.status === 'Resolved' || t.status === 'Closed') timelineMap[label].resolved++;
          if (t.priority === 'Critical') timelineMap[label].critical++;
        }
      });
    } else {
      // Daily or interval buckets
      tickets.forEach((t) => {
        const dateKey = t.created_at.slice(0, 10);
        if (!timelineMap[dateKey]) {
          const d = new Date(dateKey + 'T00:00:00');
          const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          timelineMap[dateKey] = { date: dateKey, label, total: 0, resolved: 0, critical: 0 };
        }
        timelineMap[dateKey].total++;
        if (t.status === 'Resolved' || t.status === 'Closed') timelineMap[dateKey].resolved++;
        if (t.priority === 'Critical') timelineMap[dateKey].critical++;
      });
    }

    const incidentsOverTime = Object.values(timelineMap).sort((a, b) =>
      (a.date || a.label).localeCompare(b.date || b.label)
    );

    // ── 2. Chart: Incidents by Category (Donut Chart) ──────────────────────────
    const categoryCounts = {};
    tickets.forEach((t) => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });

    const categoryColors = [
      '#38bdf8', // Sky Blue
      '#D99B7F', // Terracotta Rose Gold
      '#a855f7', // Purple
      '#34d399', // Emerald
      '#fbbf24', // Amber
      '#f43f5e', // Rose
      '#818cf8', // Indigo
      '#2dd4bf', // Teal
    ];

    const categoryData = Object.entries(categoryCounts)
      .map(([name, count], idx) => ({
        name,
        count,
        percentage: totalIncidents > 0 ? Number(((count / totalIncidents) * 100).toFixed(1)) : 0,
        color: categoryColors[idx % categoryColors.length],
      }))
      .sort((a, b) => b.count - a.count);

    // ── 3. Chart: Incidents by Priority (Bar Chart) ────────────────────────────
    const priorityDefs = [
      { priority: 'Critical', color: '#ef4444' },
      { priority: 'High', color: '#f59e0b' },
      { priority: 'Medium', color: '#38bdf8' },
      { priority: 'Low', color: '#94a3b8' },
    ];

    const priorityData = priorityDefs.map((def) => {
      const match = tickets.filter((t) => t.priority === def.priority);
      const count = match.length;
      const resolved = match.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
      const open = match.filter((t) => t.status === 'Open').length;
      return {
        priority: def.priority,
        count,
        resolved,
        open,
        color: def.color,
        percentage: totalIncidents > 0 ? Number(((count / totalIncidents) * 100).toFixed(1)) : 0,
      };
    });

    // ── 4. Chart: Incidents by Status (Donut Chart) ────────────────────────────
    const statusDefs = [
      { status: 'Open', color: '#f59e0b' },
      { status: 'Assigned', color: '#818cf8' },
      { status: 'In Progress', color: '#38bdf8' },
      { status: 'Resolved', color: '#10b981' },
      { status: 'Closed', color: '#64748b' },
    ];

    const statusData = statusDefs.map((def) => {
      const count = tickets.filter((t) => t.status === def.status).length;
      return {
        status: def.status,
        count,
        percentage: totalIncidents > 0 ? Number(((count / totalIncidents) * 100).toFixed(1)) : 0,
        color: def.color,
      };
    });

    // ── 5. Chart: Building-Wise Incident Distribution ──────────────────────────
    const buildingMap = {};
    tickets.forEach((t) => {
      if (!buildingMap[t.building]) {
        buildingMap[t.building] = {
          building: t.building,
          total: 0,
          resolved: 0,
          inProgress: 0,
          open: 0,
          critical: 0,
        };
      }
      buildingMap[t.building].total++;
      if (t.status === 'Resolved' || t.status === 'Closed') buildingMap[t.building].resolved++;
      else if (t.status === 'In Progress' || t.status === 'Assigned') buildingMap[t.building].inProgress++;
      else if (t.status === 'Open') buildingMap[t.building].open++;

      if (t.priority === 'Critical') buildingMap[t.building].critical++;
    });

    const buildingData = Object.values(buildingMap)
      .map((b) => ({
        ...b,
        percentage: totalIncidents > 0 ? Number(((b.total / totalIncidents) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // ── 6. Chart: Technician Performance & Workload ────────────────────────────
    const technicians = db
      .prepare("SELECT id, name, college_id, department, email FROM users WHERE role = 'Technician'")
      .all();

    const technicianData = technicians.map((tech) => {
      const assigned = tickets.filter((t) => t.technician_id === tech.id);
      const assignedTotal = assigned.length;
      const resolved = assigned.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;
      const inProgress = assigned.filter((t) => t.status === 'In Progress' || t.status === 'Assigned').length;

      let techResolutionHours = 0;
      let techResolvedCount = 0;
      assigned
        .filter((t) => t.status === 'Resolved' || t.status === 'Closed')
        .forEach((t) => {
          const created = new Date(t.created_at).getTime();
          const updated = new Date(t.updated_at || t.created_at).getTime();
          techResolutionHours += Math.max(0.2, (updated - created) / 3600000);
          techResolvedCount++;
        });

      const avgHours = techResolvedCount > 0 ? techResolutionHours / techResolvedCount : null;
      const resolutionRate = assignedTotal > 0 ? Math.round((resolved / assignedTotal) * 100) : 0;

      return {
        id: tech.id,
        name: tech.name,
        collegeId: tech.college_id,
        department: tech.department,
        email: tech.email,
        assignedTotal,
        resolvedCount: resolved,
        inProgressCount: inProgress,
        avgResolutionHours: avgHours ? `${avgHours.toFixed(1)}h` : '—',
        avgResolutionHoursNum: avgHours,
        resolutionRate: `${resolutionRate}%`,
        efficiencyScore: Math.min(100, Math.round(resolutionRate * 0.7 + (avgHours && avgHours < 4 ? 30 : 15))),
      };
    });

    // ── 7. Chart: Monthly Incident Trends ──────────────────────────────────────
    const allHistoricalTickets = db.prepare('SELECT created_at, status, priority FROM tickets').all();
    const monthlyMap = {};

    allHistoricalTickets.forEach((t) => {
      const d = new Date(t.created_at);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          monthKey,
          month: monthLabel,
          total: 0,
          resolved: 0,
          critical: 0,
        };
      }
      monthlyMap[monthKey].total++;
      if (t.status === 'Resolved' || t.status === 'Closed') monthlyMap[monthKey].resolved++;
      if (t.priority === 'Critical') monthlyMap[monthKey].critical++;
    });

    const monthlyTrends = Object.values(monthlyMap)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6);

    // ── 8. Chart: Frequently Affected Campus Services ──────────────────────────
    const serviceMap = {};
    tickets.forEach((t) => {
      const svc = t.affected_service || 'General Campus Infrastructure';
      if (!serviceMap[svc]) {
        serviceMap[svc] = {
          service: svc,
          category: t.category,
          count: 0,
          criticalCount: 0,
          resolvedCount: 0,
        };
      }
      serviceMap[svc].count++;
      if (t.priority === 'Critical') serviceMap[svc].criticalCount++;
      if (t.status === 'Resolved' || t.status === 'Closed') serviceMap[svc].resolvedCount++;
    });

    const affectedServices = Object.values(serviceMap)
      .map((s) => ({
        ...s,
        percentage: totalIncidents > 0 ? Number(((s.count / totalIncidents) * 100).toFixed(1)) : 0,
        resolutionRate: s.count > 0 ? `${Math.round((s.resolvedCount / s.count) * 100)}%` : '0%',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ── Available Filter Options ───────────────────────────────────────────────
    const buildingsList = db.prepare("SELECT DISTINCT building FROM locations WHERE status = 'active'").all().map((b) => b.building);
    const categoriesList = db.prepare("SELECT name FROM categories WHERE status = 'active'").all().map((c) => c.name);

    return res.json({
      success: true,
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.name,
        generatedRole: req.user.role,
        appliedFilters: {
          timeRange,
          startDate: startDate || null,
          endDate: endDate || null,
          building: building || 'all',
          category: category || 'all',
          priority: priority || 'all',
        },
      },
      kpis: {
        totalIncidents,
        openIncidents,
        resolvedIncidents,
        inProgressIncidents,
        assignedIncidents,
        criticalIncidents,
        recurringIncidents: recurringCount,
        avgResponseTime: formatHours(avgResponseHoursNum),
        avgResponseHoursNum,
        avgResolutionTime: formatHours(avgResolutionHoursNum),
        avgResolutionHoursNum,
        resolutionRate: `${resolutionRateNum.toFixed(1)}%`,
        resolutionRateNum,
      },
      charts: {
        incidentsOverTime,
        categoryDistribution: categoryData,
        priorityDistribution: priorityData,
        statusDistribution: statusData,
        buildingDistribution: buildingData,
        technicianWorkload: technicianData,
        monthlyTrends,
        affectedServices,
      },
      filterOptions: {
        buildings: buildingsList,
        categories: categoriesList,
        priorities: ['Critical', 'High', 'Medium', 'Low'],
      },
      ticketsLedger: tickets.map((t) => {
        const created = new Date(t.created_at).getTime();
        const updated = new Date(t.updated_at || t.created_at).getTime();
        const durationHours = (t.status === 'Resolved' || t.status === 'Closed')
          ? ((updated - created) / 3600000).toFixed(1)
          : null;

        return {
          id: t.id,
          ticketNumber: t.ticket_number,
          title: t.title,
          category: t.category,
          priority: t.priority,
          status: t.status,
          building: t.building,
          room: t.room,
          floor: t.floor,
          affectedService: t.affected_service,
          reporterName: t.reporter_name || 'Anonymous',
          technicianName: t.technician_name || 'Unassigned',
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          durationHours,
          resolutionDetails: t.resolution_details || '—',
        };
      }),
    });
  } catch (err) {
    console.error('[Analytics Overview Error]:', err);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to generate institutional infrastructure analytics and reporting dataset.',
    });
  }
});

/**
 * GET /api/analytics/export/csv
 * Direct RFC 4180 CSV export endpoint matching applied filters
 */
router.get('/export/csv', (req, res) => {
  try {
    const { timeRange = '30d', startDate, endDate, building, category, priority } = req.query;

    const { tickets } = getFilteredTickets({
      timeRange,
      startDate,
      endDate,
      building,
      category,
      priority,
    });

    const headers = [
      'Incident ID',
      'Ticket Number',
      'Issue Title',
      'Category',
      'Priority',
      'Status',
      'Building',
      'Floor',
      'Room',
      'Affected Service',
      'Reporter',
      'Assigned Technician',
      'Reported Timestamp',
      'Resolution Timestamp',
      'Resolution Time (Hours)',
      'Resolution Details',
    ];

    const escapeCsv = (str) => {
      if (str == null) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = tickets.map((t) => {
      const created = new Date(t.created_at).getTime();
      const updated = new Date(t.updated_at || t.created_at).getTime();
      const resHours = (t.status === 'Resolved' || t.status === 'Closed')
        ? ((updated - created) / 3600000).toFixed(1)
        : '';

      return [
        escapeCsv(t.id),
        escapeCsv(t.ticket_number),
        escapeCsv(t.title),
        escapeCsv(t.category),
        escapeCsv(t.priority),
        escapeCsv(t.status),
        escapeCsv(t.building),
        escapeCsv(t.floor || ''),
        escapeCsv(t.room || ''),
        escapeCsv(t.affected_service || ''),
        escapeCsv(t.reporter_name || 'Anonymous'),
        escapeCsv(t.technician_name || 'Unassigned'),
        escapeCsv(t.created_at),
        escapeCsv((t.status === 'Resolved' || t.status === 'Closed') ? t.updated_at : ''),
        escapeCsv(resHours),
        escapeCsv(t.resolution_details || ''),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `CampusFix-Incident-Report-${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[CSV Export Error]:', err);
    return res.status(500).json({
      error: 'EXPORT_FAILED',
      message: 'Failed to generate incident records CSV export.',
    });
  }
});

export default router;
