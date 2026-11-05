import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seed...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Seed] Cleaning existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.incidentActivity.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.incidentAttachment.deleteMany();
    await prisma.incidentComment.deleteMany();
    await prisma.technicianAssignment.deleteMany();
    await prisma.incident.deleteMany();
    await prisma.user.deleteMany();
    await prisma.campusService.deleteMany();
    await prisma.campusLocation.deleteMany();
    await prisma.incidentCategory.deleteMany();
  }

  // 1. Seed Categories
  console.log('[Seed] Creating incident categories...');
  const categories = await Promise.all([
    prisma.incidentCategory.create({
      data: {
        name: 'Network Infrastructure',
        code: 'network',
        description: 'Campus Wi-Fi, Ethernet, routers, switches, and firewalls',
        slaHours: 2,
        status: 'active',
      },
    }),
    prisma.incidentCategory.create({
      data: {
        name: 'Hardware Systems',
        code: 'hardware',
        description: 'Desktops, laptops, monitors, peripherals, and lab workstations',
        slaHours: 4,
        status: 'active',
      },
    }),
    prisma.incidentCategory.create({
      data: {
        name: 'Software & OS',
        code: 'software',
        description: 'Licensed software, campus portals, LMS, OS updates, and lab images',
        slaHours: 8,
        status: 'active',
      },
    }),
    prisma.incidentCategory.create({
      data: {
        name: 'Power & Electrical',
        code: 'power',
        description: 'UPS backups, classroom power strips, surge suppressors, and generators',
        slaHours: 2,
        status: 'active',
      },
    }),
    prisma.incidentCategory.create({
      data: {
        name: 'Classroom Equipment',
        code: 'classroom',
        description: 'Projectors, smartboards, audio mics, podiums, and lecture capture',
        slaHours: 4,
        status: 'active',
      },
    }),
    prisma.incidentCategory.create({
      data: {
        name: 'Campus Servers',
        code: 'servers',
        description: 'Datacenter hosts, virtual machines, storage arrays, and DNS servers',
        slaHours: 1,
        status: 'active',
      },
    }),
  ]);

  // 2. Seed Campus Locations
  console.log('[Seed] Creating campus locations...');
  const locations = await Promise.all([
    prisma.campusLocation.create({
      data: { building: 'Engineering Block B', floor: '3rd Floor', room: 'Lab 304', status: 'active' },
    }),
    prisma.campusLocation.create({
      data: { building: 'Engineering Block B', floor: 'Ground Floor', room: 'Hardware Workshop', status: 'active' },
    }),
    prisma.campusLocation.create({
      data: { building: 'Main Data Center', floor: 'Ground Floor', room: 'Server Room 1', status: 'active' },
    }),
    prisma.campusLocation.create({
      data: { building: 'Design & Tech Lab', floor: '2nd Floor', room: 'Studio 4', status: 'active' },
    }),
    prisma.campusLocation.create({
      data: { building: 'Central Campus Library', floor: '1st Floor', room: 'Study Pod 12', status: 'active' },
    }),
    prisma.campusLocation.create({
      data: { building: 'Science Complex', floor: '4th Floor', room: 'Lecture Hall 401', status: 'active' },
    }),
    prisma.campusLocation.create({
      data: { building: 'Student Union Building', floor: '2nd Floor', room: 'Computer Lounge', status: 'active' },
    }),
    prisma.campusLocation.create({
      data: { building: 'Administrative Tower', floor: '5th Floor', room: 'Conference Room A', status: 'active' },
    }),
  ]);

  // 3. Seed Campus Services
  console.log('[Seed] Creating campus services...');
  const services = await Promise.all([
    prisma.campusService.create({
      data: {
        name: 'Eduroam Wireless Access',
        categoryId: categories[0].id,
        slaHours: 2,
        status: 'active',
        description: 'Campus-wide secure 802.1x wireless network access',
      },
    }),
    prisma.campusService.create({
      data: {
        name: 'Residence Hall Ethernet',
        categoryId: categories[0].id,
        slaHours: 4,
        status: 'active',
        description: 'Wired Gigabit wall ports across student dorms',
      },
    }),
    prisma.campusService.create({
      data: {
        name: 'Computer Lab Workstations',
        categoryId: categories[1].id,
        slaHours: 4,
        status: 'active',
        description: 'Engineering and CAD lab desktop PCs and peripheral hardware',
      },
    }),
    prisma.campusService.create({
      data: {
        name: 'Campus Learning Portal (LMS)',
        categoryId: categories[2].id,
        slaHours: 2,
        status: 'active',
        description: 'Institutional course management, exams, and grading systems',
      },
    }),
    prisma.campusService.create({
      data: {
        name: 'Classroom Smartboards & Projectors',
        categoryId: categories[4].id,
        slaHours: 2,
        status: 'active',
        description: 'Lecture hall interactive projection and audio systems',
      },
    }),
    prisma.campusService.create({
      data: {
        name: 'Datacenter Core Virtualization',
        categoryId: categories[5].id,
        slaHours: 1,
        status: 'active',
        description: 'Host hypervisors and storage arrays for student compute VMs',
      },
    }),
  ]);

  // 4. Seed Users
  console.log('[Seed] Creating users...');
  const users = await Promise.all([
    // Reporter (Student)
    prisma.user.create({
      data: {
        name: 'Alex Rivera',
        email: 'alex.student@campus.edu',
        collegeId: 'STU-8821',
        passwordHash: await bcrypt.hash('campus2026!', 10),
        role: 'Reporter',
        userType: 'Student',
        department: 'Computer Science',
        status: 'active',
      },
    }),
    // Reporter (Faculty)
    prisma.user.create({
      data: {
        name: 'Dr. Elena Rostova',
        email: 'elena.faculty@campus.edu',
        collegeId: 'FAC-1044',
        passwordHash: await bcrypt.hash('faculty2026!', 10),
        role: 'Reporter',
        userType: 'Faculty',
        department: 'Department of Computer Science',
        status: 'active',
      },
    }),
    // Technician (Network Engineer)
    prisma.user.create({
      data: {
        name: 'Marcus Vance',
        email: 'm.vance.tech@campus.edu',
        collegeId: 'TECH-4402',
        passwordHash: await bcrypt.hash('infraOps99#', 10),
        role: 'Technician',
        userType: 'IT Staff',
        department: 'Network & Systems Infrastructure',
        status: 'active',
      },
    }),
    // Technician (Hardware Specialist)
    prisma.user.create({
      data: {
        name: 'Sarah Chen',
        email: 's.chen.tech@campus.edu',
        collegeId: 'TECH-5120',
        passwordHash: await bcrypt.hash('tech2026!', 10),
        role: 'Technician',
        userType: 'IT Staff',
        department: 'Classroom & Hardware Support',
        status: 'active',
      },
    }),
    // Administrator
    prisma.user.create({
      data: {
        name: 'Director Nathan Drake',
        email: 'admin@campus.edu',
        collegeId: 'ADM-0001',
        passwordHash: await bcrypt.hash('adminPass123!', 10),
        role: 'Administrator',
        userType: 'Staff',
        department: 'Campus Infrastructure & Security',
        status: 'active',
      },
    }),
  ]);

  console.log('[Seed] Created users:', users.map(u => `${u.name} (${u.role})`).join(', '));

  // 5. Seed Sample Incidents
  console.log('[Seed] Creating sample incidents...');
  
  const incident1 = await prisma.incident.create({
    data: {
      ticketNumber: 'INC-1082',
      title: 'Lab 304 Wi-Fi access point dropping connection periodically',
      description: 'Students and faculty in Lab 304 report that wireless connectivity drops every 15-20 minutes, particularly during high-bandwidth simulations.',
      categoryId: categories[0].id,
      categoryName: 'Network Infrastructure',
      locationId: locations[0].id,
      serviceId: services[0].id,
      building: 'Engineering Block B',
      floor: '3rd Floor',
      room: 'Lab 304',
      affectedService: 'Eduroam Wireless Access',
      priority: 'High',
      status: 'In Progress',
      reporterId: users[0].id,
      technicianId: users[2].id,
    },
  });

  await prisma.incidentComment.create({
    data: {
      incidentId: incident1.id,
      userId: users[2].id,
      message: 'Diagnosed Cisco AP 2802; beacon signal drops during heavy multicast traffic. Swapping PoE power injector.',
      isInternal: false,
    },
  });

  await prisma.incidentActivity.create({
    data: {
      incidentId: incident1.id,
      userId: users[0].id,
      action: 'CREATED',
      toState: 'Open',
      details: 'Incident created by student reporter',
    },
  });

  await prisma.incidentActivity.create({
    data: {
      incidentId: incident1.id,
      userId: users[2].id,
      action: 'ASSIGNED',
      fromState: 'Open',
      toState: 'In Progress',
      details: 'Assigned to Marcus Vance',
    },
  });

  const incident2 = await prisma.incident.create({
    data: {
      ticketNumber: 'INC-1083',
      title: 'Server Rack 4 UPS battery warning in CS Datacenter',
      description: 'Automated telemetry trigger: Battery health status degraded on secondary battery bank of Rack 4.',
      categoryId: categories[3].id,
      categoryName: 'Power & Electrical',
      locationId: locations[2].id,
      serviceId: services[5].id,
      building: 'Main Data Center',
      floor: 'Ground Floor',
      room: 'Server Room 1',
      affectedService: 'Datacenter Core Virtualization',
      priority: 'Critical',
      status: 'Assigned',
      reporterId: users[1].id,
      technicianId: users[2].id,
    },
  });

  await prisma.incidentActivity.create({
    data: {
      incidentId: incident2.id,
      userId: users[1].id,
      action: 'CREATED',
      toState: 'Open',
      details: 'Incident created by faculty reporter',
    },
  });

  const incident3 = await prisma.incident.create({
    data: {
      ticketNumber: 'INC-1084',
      title: 'Projector HDMI port flickering in Lecture Hall 401',
      description: 'The main ceiling projector loses HDMI signal periodically when laptops are plugged in via the podium plate.',
      categoryId: categories[4].id,
      categoryName: 'Classroom Equipment',
      locationId: locations[5].id,
      serviceId: services[4].id,
      building: 'Science Complex',
      floor: '4th Floor',
      room: 'Lecture Hall 401',
      affectedService: 'Classroom Smartboards & Projectors',
      priority: 'Medium',
      status: 'Open',
      reporterId: users[0].id,
    },
  });

  await prisma.incidentActivity.create({
    data: {
      incidentId: incident3.id,
      userId: users[0].id,
      action: 'CREATED',
      toState: 'Open',
      details: 'Incident created',
    },
  });

  // 6. Seed Notifications
  console.log('[Seed] Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: users[0].id,
        ticketId: incident1.id,
        ticketNumber: incident1.ticketNumber,
        eventType: 'INCIDENT_SUBMITTED',
        title: 'Incident Successfully Submitted',
        message: `Your incident report ${incident1.ticketNumber} has been received and queued for operations triage.`,
        priority: 'normal',
        building: incident1.building,
      },
      {
        userId: users[0].id,
        ticketId: incident1.id,
        ticketNumber: incident1.ticketNumber,
        eventType: 'INCIDENT_ASSIGNED',
        title: 'Technician Assigned to Incident',
        message: `Technician Marcus Vance has been assigned to investigate ${incident1.ticketNumber}.`,
        priority: 'normal',
        building: incident1.building,
      },
      {
        userId: users[2].id,
        ticketId: incident1.id,
        ticketNumber: incident1.ticketNumber,
        eventType: 'NEW_INCIDENT_ASSIGNED',
        title: `New Work Order Assigned: ${incident1.ticketNumber}`,
        message: `You have been dispatched to ${incident1.ticketNumber} in ${incident1.building} (${incident1.room}).`,
        priority: 'high',
        building: incident1.building,
      },
      {
        userId: users[4].id,
        ticketId: incident2.id,
        ticketNumber: incident2.ticketNumber,
        eventType: 'NEW_INCIDENT_SUBMITTED',
        title: `New Incident Reported: ${incident2.ticketNumber}`,
        message: `${users[1].name} reported "${incident2.title}" in ${incident2.building}.`,
        priority: 'critical',
        building: incident2.building,
      },
    ],
  });

  console.log('[Seed] ✓ Database seeded successfully!');
  console.log('[Seed] Created:');
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${locations.length} locations`);
  console.log(`  - ${services.length} services`);
  console.log(`  - ${users.length} users`);
  console.log('  - 3 incidents with activities and comments');
  console.log('  - 4 notifications');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
