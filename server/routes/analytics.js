import { Router } from 'express';
import prisma from '../prismaClient.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Require Administrator or Technician role
router.use(authenticateToken);
router.use(requireRole(['Administrator', 'Technician']));

/**
 * GET /api/analytics
 * Comprehensive dashboard statistics
 */
router.get('/', async (req, res) => {
  try {
    const { timeRange = '30d', startDate, endDate, building, category, priority } = req.query;

    // Build date filter
    const dateFilter = {};
    const now = new Date();
    
    switch (timeRange) {
      case 'today':
        dateFilter.gte = new Date(now.setHours(0, 0, 0, 0));
        break;
      case '7d':
        dateFilter.gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        dateFilter.gte = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
        break;
    }

    // Build filters
    const where = {};
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }
    if (building && building !== 'all') {
      where.building = building;
    }
    if (category && category !== 'all') {
      where.categoryName = category;
    }
    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    // Fetch incidents
    const incidents = await prisma.incident.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        technician: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate KPIs
    const totalIncidents = incidents.length;
    const openIncidents = incidents.filter(i => i.status === 'Open').length;
    const assignedIncidents = incidents.filter(i => i.status === 'Assigned').length;
    const inProgressIncidents = incidents.filter(i => i.status === 'In Progress').length;
    const resolvedIncidents = incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
    const criticalIncidents = incidents.filter(i => i.priority === 'Critical').length;

    // Response time (hours from creation to first response)
    let totalResponseHours = 0;
    let respondedCount = 0;
    incidents.forEach(inc => {
      if (inc.firstResponseAt) {
        const hours = (inc.firstResponseAt.getTime() - inc.createdAt.getTime()) / 3600000;
        totalResponseHours += hours;
        respondedCount++;
      } else if (inc.technicianId) {
        const hours = (inc.updatedAt.getTime() - inc.createdAt.getTime()) / 3600000;
        totalResponseHours += hours;
        respondedCount++;
      }
    });
    const avgResponseHours = respondedCount > 0 ? totalResponseHours / respondedCount : null;

    // Resolution time
    let totalResolutionHours = 0;
    let resolvedCount = 0;
    incidents
      .filter(i => i.status === 'Resolved' || i.status === 'Closed')
      .forEach(inc => {
        if (inc.resolvedAt) {
          const hours = (inc.resolvedAt.getTime() - inc.createdAt.getTime()) / 3600000;
          totalResolutionHours += hours;
          resolvedCount++;
        }
      });
    const avgResolutionHours = resolvedCount > 0 ? totalResolutionHours / resolvedCount : null;

    const resolutionRate = totalIncidents > 0 ? (resolvedIncidents / totalIncidents) * 100 : 0;

    // Category distribution
    const categoryMap = {};
    incidents.forEach(inc => {
      categoryMap[inc.categoryName] = (categoryMap[inc.categoryName] || 0) + 1;
    });
    const categoryDistribution = Object.entries(categoryMap).map(([name, count]) => ({
      name,
      count,
      percentage: totalIncidents > 0 ? (count / totalIncidents) * 100 : 0,
    }));

    // Priority distribution
    const priorityDistribution = ['Critical', 'High', 'Medium', 'Low'].map(p => ({
      priority: p,
      count: incidents.filter(i => i.priority === p).length,
    }));

    // Building distribution
    const buildingMap = {};
    incidents.forEach(inc => {
      if (!buildingMap[inc.building]) {
        buildingMap[inc.building] = { building: inc.building, total: 0, resolved: 0, open: 0 };
      }
      buildingMap[inc.building].total++;
      if (inc.status === 'Resolved' || inc.status === 'Closed') {
        buildingMap[inc.building].resolved++;
      } else if (inc.status === 'Open') {
        buildingMap[inc.building].open++;
      }
    });
    const buildingDistribution = Object.values(buildingMap);

    // Technician performance
    const technicians = await prisma.user.findMany({
      where: { role: 'Technician', status: 'active' },
      select: {
        id: true,
        name: true,
        email: true,
        collegeId: true,
        department: true,
      },
    });

    const technicianPerformance = await Promise.all(
      technicians.map(async tech => {
        const assignedIncidents = incidents.filter(i => i.technicianId === tech.id);
        const resolvedByTech = assignedIncidents.filter(i => i.status === 'Resolved' || i.status === 'Closed');
        
        let techResolutionHours = 0;
        resolvedByTech.forEach(inc => {
          if (inc.resolvedAt) {
            techResolutionHours += (inc.resolvedAt.getTime() - inc.createdAt.getTime()) / 3600000;
          }
        });
        
        return {
          id: tech.id,
          name: tech.name,
          email: tech.email,
          collegeId: tech.collegeId,
          department: tech.department,
          assignedTotal: assignedIncidents.length,
          resolvedCount: resolvedByTech.length,
          inProgressCount: assignedIncidents.filter(i => i.status === 'In Progress' || i.status === 'Assigned').length,
          avgResolutionHours: resolvedByTech.length > 0 ? techResolutionHours / resolvedByTech.length : null,
          resolutionRate: assignedIncidents.length > 0 ? (resolvedByTech.length / assignedIncidents.length) * 100 : 0,
        };
      })
    );

    // Status distribution
    const statusDistribution = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'].map(s => ({
      name: s,
      count: incidents.filter(i => i.status === s).length,
      percentage: totalIncidents > 0 ? (incidents.filter(i => i.status === s).length / totalIncidents) * 100 : 0,
    })).filter(s => s.count > 0);

    // Incidents over time (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().slice(0, 10);
    });
    
    const incidentsOverTime = last30Days.map(date => {
      const dayIncidents = incidents.filter(i => i.createdAt.toISOString().slice(0, 10) === date);
      const dayResolved = dayIncidents.filter(i => i.status === 'Resolved' || i.status === 'Closed');
      return {
        date,
        reported: dayIncidents.length,
        resolved: dayResolved.length,
      };
    });

    // Monthly trends (last 6 months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      };
    });

    const monthlyTrends = last6Months.map(m => {
      const monthIncidents = incidents.filter(i => {
        const iMonth = `${i.createdAt.getFullYear()}-${String(i.createdAt.getMonth() + 1).padStart(2, '0')}`;
        return iMonth === m.key;
      });
      const monthResolved = monthIncidents.filter(i => i.status === 'Resolved' || i.status === 'Closed');
      return {
        month: m.month,
        year: m.year,
        reported: monthIncidents.length,
        resolved: monthResolved.length,
      };
    });

    // Technician workload (with performance data already calculated above)
    const technicianWorkload = technicianPerformance.map(tech => ({
      technicianName: tech.name,
      technicianId: tech.collegeId || tech.email,
      assignedTotal: tech.assignedTotal,
      resolvedCount: tech.resolvedCount,
      inProgressCount: tech.inProgressCount,
      resolutionRate: tech.resolutionRate,
      avgResolutionTime: tech.avgResolutionHours ? `${tech.avgResolutionHours.toFixed(1)}h` : '—',
    }));

    // Frequently affected services
    const serviceMap = {};
    incidents.forEach(inc => {
      const service = inc.serviceName || 'Unassigned';
      serviceMap[service] = (serviceMap[service] || 0) + 1;
    });
    const affectedServices = Object.entries(serviceMap)
      .map(([serviceName, count]) => ({
        serviceName,
        incidentCount: count,
        percentage: totalIncidents > 0 ? (count / totalIncidents) * 100 : 0,
      }))
      .sort((a, b) => b.incidentCount - a.incidentCount)
      .slice(0, 10); // Top 10 services

    // Recurring incidents (simplified: incidents from same building+category within 7 days)
    let recurringCount = 0;
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentIncidents = incidents.filter(i => i.createdAt >= sevenDaysAgo);
    const locationCategoryMap = {};
    recentIncidents.forEach(inc => {
      const key = `${inc.building}-${inc.categoryName}`;
      locationCategoryMap[key] = (locationCategoryMap[key] || 0) + 1;
    });
    recurringCount = Object.values(locationCategoryMap).filter(count => count > 1).length;

    // Tickets ledger for detailed table
    const ticketsLedger = incidents.map(inc => {
      let resolutionTime = '—';
      if (inc.resolvedAt && inc.createdAt) {
        const hours = (inc.resolvedAt.getTime() - inc.createdAt.getTime()) / 3600000;
        if (hours < 24) {
          resolutionTime = `${hours.toFixed(1)}h`;
        } else {
          resolutionTime = `${(hours / 24).toFixed(1)}d`;
        }
      }

      return {
        id: inc.id,
        ticketNumber: inc.ticketNumber,
        title: inc.title,
        status: inc.status,
        priority: inc.priority,
        category: inc.categoryName,
        building: inc.building,
        room: inc.room,
        reporterName: inc.reporter?.name || 'Unknown',
        technicianName: inc.technician?.name || 'Unassigned',
        createdAt: inc.createdAt.toISOString(),
        resolvedAt: inc.resolvedAt?.toISOString() || null,
        resolutionTime,
      };
    });

    // Filter options
    const buildings = await prisma.campusLocation.findMany({
      where: { status: 'active' },
      select: { building: true },
      distinct: ['building'],
    });

    const categories = await prisma.incidentCategory.findMany({
      where: { status: 'active' },
      select: { name: true },
    });

    return res.json({
      success: true,
      kpis: {
        totalIncidents,
        openIncidents,
        assignedIncidents,
        inProgressIncidents,
        resolvedIncidents,
        criticalIncidents,
        recurringIncidents: recurringCount,
        avgResponseTime: avgResponseHours ? `${avgResponseHours.toFixed(1)}h` : '—',
        avgResolutionTime: avgResolutionHours ? `${avgResolutionHours.toFixed(1)}h` : '—',
        resolutionRate: `${resolutionRate.toFixed(1)}%`,
      },
      charts: {
        incidentsOverTime,
        categoryDistribution,
        priorityDistribution,
        statusDistribution,
        buildingDistribution,
        monthlyTrends,
        technicianWorkload,
        affectedServices,
      },
      ticketsLedger,
      filterOptions: {
        buildings: buildings.map(b => b.building),
        categories: categories.map(c => c.name),
        priorities: ['Critical', 'High', 'Medium', 'Low'],
      },
    });
  } catch (err) {
    console.error('[Analytics Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to generate analytics' });
  }
});

/**
 * GET /api/analytics/trends
 * Get incident trends over time
 */
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const incidents = await prisma.incident.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
        priority: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const trendMap = {};
    incidents.forEach(inc => {
      const dateKey = inc.createdAt.toISOString().slice(0, 10);
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { date: dateKey, total: 0, resolved: 0, critical: 0 };
      }
      trendMap[dateKey].total++;
      if (inc.status === 'Resolved' || inc.status === 'Closed') {
        trendMap[dateKey].resolved++;
      }
      if (inc.priority === 'Critical') {
        trendMap[dateKey].critical++;
      }
    });

    const trends = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      success: true,
      trends,
    });
  } catch (err) {
    console.error('[Trends Error]:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to generate trends' });
  }
});

export default router;
