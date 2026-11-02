import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path in server directory
const dbPath = path.join(__dirname, 'campusfix.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance and foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Initialize Tables
 */
export function initDatabase() {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      college_id TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Reporter' CHECK(role IN ('Reporter', 'Technician', 'Administrator')),
      user_type TEXT NOT NULL DEFAULT 'Student' CHECK(user_type IN ('Student', 'Faculty', 'Staff', 'IT Staff')),
      department TEXT DEFAULT 'General Campus',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
  `);

  // 2. Incident Categories (Ready for subsequent incident features)
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      sla_hours INTEGER DEFAULT 4,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'deactivated')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Campus Services
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'deactivated')),
      sla_hours INTEGER DEFAULT 4,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Campus Locations & Coordinates
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building TEXT NOT NULL,
      floor TEXT NOT NULL DEFAULT 'Ground Floor',
      room TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(building, floor, room)
    );
  `);

  // Ensure migration columns exist on existing databases
  try { db.exec('ALTER TABLE categories ADD COLUMN sla_hours INTEGER DEFAULT 4;'); } catch {}
  try { db.exec('ALTER TABLE categories ADD COLUMN status TEXT DEFAULT "active";'); } catch {}

  // 3. Audit Logs (Records auth and privilege changes)
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 4. Infrastructure Incident Tickets
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')),
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'Assigned', 'In Progress', 'Resolved', 'Closed')),
      building TEXT NOT NULL,
      floor TEXT DEFAULT 'Ground Floor',
      room TEXT NOT NULL,
      affected_service TEXT DEFAULT 'General Campus Infrastructure',
      attachments TEXT,
      reporter_id INTEGER NOT NULL,
      technician_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Ensure migration columns exist on existing databases
  try { db.exec('ALTER TABLE tickets ADD COLUMN floor TEXT DEFAULT "Ground Floor";'); } catch {}
  try { db.exec('ALTER TABLE tickets ADD COLUMN affected_service TEXT DEFAULT "General Campus Infrastructure";'); } catch {}
  try { db.exec('ALTER TABLE tickets ADD COLUMN attachments TEXT;'); } catch {}
  try { db.exec('ALTER TABLE tickets ADD COLUMN resolution_details TEXT;'); } catch {}
  try { db.exec('ALTER TABLE ticket_notes ADD COLUMN is_internal INTEGER DEFAULT 0;'); } catch {}

  // 5. Ticket Diagnostic Notes & Investigation Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 6. Password Resets (Secure recovery workflow)
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reset_token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 7. Notification Management System
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ticket_id INTEGER,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      role_target TEXT,
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'critical')),
      is_read INTEGER DEFAULT 0,
      email_sent INTEGER DEFAULT 0,
      email_recipient TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );
  `);

  // 8. Notification Preferences
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id INTEGER PRIMARY KEY,
      email_enabled INTEGER DEFAULT 1,
      in_app_enabled INTEGER DEFAULT 1,
      sound_enabled INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Ensure index for instant notification queries
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);'); } catch {}
  try { db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);'); } catch {}

  // Seed default categories
  const categoryCheck = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCheck.count === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, code, description, sla_hours, status) VALUES (?, ?, ?, ?, ?)');
    insertCat.run('Network Infrastructure', 'network', 'Campus Wi-Fi, Ethernet, routers, switches, and firewalls', 2, 'active');
    insertCat.run('Hardware Systems', 'hardware', 'Desktops, laptops, monitors, peripherals, and lab workstations', 4, 'active');
    insertCat.run('Software & OS', 'software', 'Licensed software, campus portals, LMS, OS updates, and lab images', 8, 'active');
    insertCat.run('Power & Electrical', 'power', 'UPS backups, classroom power strips, surge suppressors, and generators', 2, 'active');
    insertCat.run('Classroom Equipment', 'classroom', 'Projectors, smartboards, audio mics, podiums, and lecture capture', 4, 'active');
    insertCat.run('Campus Servers', 'servers', 'Datacenter hosts, virtual machines, storage arrays, and DNS servers', 1, 'active');
  }

  // Seed default campus services
  const serviceCheck = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (serviceCheck.count === 0) {
    const insertService = db.prepare('INSERT INTO services (name, category, sla_hours, status, description) VALUES (?, ?, ?, ?, ?)');
    insertService.run('Eduroam Wireless Access', 'Network Infrastructure', 2, 'active', 'Campus-wide secure 802.1x wireless network access');
    insertService.run('Residence Hall Ethernet', 'Network Infrastructure', 4, 'active', 'Wired Gigabit wall ports across student dorms');
    insertService.run('Computer Lab Workstations', 'Hardware Systems', 4, 'active', 'Engineering and CAD lab desktop PCs and peripheral hardware');
    insertService.run('Campus Learning Portal (LMS)', 'Software & OS', 2, 'active', 'Institutional course management, exams, and grading systems');
    insertService.run('Classroom Smartboards & Projectors', 'Classroom Equipment', 2, 'active', 'Lecture hall interactive projection and audio systems');
    insertService.run('Datacenter Core Virtualization', 'Campus Servers', 1, 'active', 'Host hypervisors and storage arrays for student compute VMs');
    insertService.run('Study Pod Electrical Power', 'Power & Electrical', 4, 'active', 'Wall outlets, high-capacity surge strips in library study pods');
    insertService.run('Central Printing Stations', 'Hardware Systems', 6, 'active', 'Student printing kiosks in Library and Campus Commons');
  }

  // Seed default campus locations
  const locationCheck = db.prepare('SELECT COUNT(*) as count FROM locations').get();
  if (locationCheck.count === 0) {
    const insertLoc = db.prepare('INSERT INTO locations (building, floor, room, status) VALUES (?, ?, ?, ?)');
    insertLoc.run('Engineering Block B', '3rd Floor', 'Lab 304', 'active');
    insertLoc.run('Engineering Block B', 'Ground Floor', 'Hardware Workshop', 'active');
    insertLoc.run('Main Data Center', 'Ground Floor', 'Server Room 1', 'active');
    insertLoc.run('Design & Tech Lab', '2nd Floor', 'Studio 4', 'active');
    insertLoc.run('Central Campus Library', '1st Floor', 'Study Pod 12', 'active');
    insertLoc.run('Science Complex', '4th Floor', 'Lecture Hall 401', 'active');
    insertLoc.run('Student Union Building', '2nd Floor', 'Computer Lounge', 'active');
    insertLoc.run('Administrative Tower', '5th Floor', 'Conference Room A', 'active');
  }

  // Seed initial users for all 3 roles with secure bcrypt hashes
  const userCheck = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCheck.count === 0) {
    console.log('[Database] Seeding initial verified accounts for Reporter, Technician, and Administrator...');
    
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, college_id, password_hash, role, user_type, department)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Reporter (Student)
    const reporterHash = bcrypt.hashSync('campus2026!', 10);
    insertUser.run(
      'Alex Rivera',
      'alex.student@campus.edu',
      'STU-8821',
      reporterHash,
      'Reporter',
      'Student',
      'Computer Science'
    );

    // 2. Reporter (Faculty)
    const facultyHash = bcrypt.hashSync('faculty2026!', 10);
    insertUser.run(
      'Dr. Elena Rostova',
      'elena.faculty@campus.edu',
      'FAC-1044',
      facultyHash,
      'Reporter',
      'Faculty',
      'Department of Computer Science'
    );

    // 3. Technician (Field / Systems Engineer)
    const techHash = bcrypt.hashSync('infraOps99#', 10);
    insertUser.run(
      'Marcus Vance',
      'm.vance.tech@campus.edu',
      'TECH-4402',
      techHash,
      'Technician',
      'IT Staff',
      'Network & Systems Infrastructure'
    );

    // 4. Technician (Hardware Specialist)
    const tech2Hash = bcrypt.hashSync('tech2026!', 10);
    insertUser.run(
      'Sarah Chen',
      's.chen.tech@campus.edu',
      'TECH-5120',
      tech2Hash,
      'Technician',
      'IT Staff',
      'Classroom & Hardware Support'
    );

    // 5. Administrator (Campus Infrastructure Operations Director)
    const adminHash = bcrypt.hashSync('adminPass123!', 10);
    insertUser.run(
      'Director Nathan Drake',
      'admin@campus.edu',
      'ADM-0001',
      adminHash,
      'Administrator',
      'Staff',
      'Campus Infrastructure & Security'
    );

    console.log('[Database] Initial users successfully created with hashed credentials.');
  }

  // Seed initial tickets and notes
  const ticketCheck = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
  if (ticketCheck.count === 0) {
    console.log('[Database] Seeding initial infrastructure tickets and diagnostics notes...');

    // Retrieve user IDs for references
    const reporter1 = db.prepare("SELECT id FROM users WHERE college_id = 'STU-8821'").get();
    const reporter2 = db.prepare("SELECT id FROM users WHERE college_id = 'FAC-1044'").get();
    const tech1 = db.prepare("SELECT id FROM users WHERE college_id = 'TECH-4402'").get();
    const tech2 = db.prepare("SELECT id FROM users WHERE college_id = 'TECH-5120'").get();

    if (reporter1 && reporter2 && tech1 && tech2) {
      const insertTicket = db.prepare(`
        INSERT INTO tickets (ticket_number, title, description, category, priority, status, building, room, reporter_id, technician_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertNote = db.prepare(`
        INSERT INTO ticket_notes (ticket_id, user_id, note)
        VALUES (?, ?, ?)
      `);

      // Ticket 1: Wi-Fi Access Point Issue
      insertTicket.run(
        'TKT-1082',
        'Lab 304 Wi-Fi access point dropping connection periodically',
        'Students and faculty in Lab 304 report that wireless connectivity drops every 15-20 minutes, particularly during high-bandwidth simulations.',
        'Network Infrastructure',
        'High',
        'In Progress',
        'Engineering Block B',
        'Lab 304',
        reporter1.id,
        tech1.id
      );
      insertNote.run(1, tech1.id, 'Diagnosed Cisco AP 2802; beacon signal drops during heavy multicast traffic.');
      insertNote.run(1, tech1.id, 'Swapped PoE power injector; conducting 4-hour channel saturation test.');

      // Ticket 2: Datacenter UPS Alert
      insertTicket.run(
        'TKT-1049',
        'Server Rack 4 UPS battery warning in CS Datacenter',
        'Automated telemetry trigger: Battery health status degraded on secondary battery bank of Rack 4.',
        'Power & Electrical',
        'Critical',
        'Assigned',
        'Main Data Center',
        'Server Room 1',
        reporter2.id,
        tech1.id
      );
      insertNote.run(2, tech1.id, 'Dispatched on-site with replacement APC battery pack modules.');

      // Ticket 3: Workstation GPU failure
      insertTicket.run(
        'TKT-1033',
        'Workstation 12 GPU failure in CAD Simulation Suite',
        'Workstation displays artifacting and blue screen whenever Blender or SolidWorks initiates OpenGL rendering pipeline.',
        'Hardware Systems',
        'Medium',
        'Assigned',
        'Design & Tech Lab',
        'Studio 4',
        reporter2.id,
        tech2.id
      );
      insertNote.run(3, tech2.id, 'RTX workstation display driver crashing on CUDA kernels; ordering replacement PCIe ribbon.');

      // Ticket 4: Projector HDMI flickering
      insertTicket.run(
        'TKT-1055',
        'Projector HDMI port flickering in Lecture Hall 2',
        'The main ceiling projector loses HDMI signal periodically when laptops are plugged in via the podium plate.',
        'Classroom Equipment',
        'Medium',
        'Open',
        'Science Concourse',
        'Hall 2',
        reporter1.id,
        null
      );

      console.log('[Database] Infrastructure incident tickets seeded successfully.');
    }
  }

  // Seed realistic historical incidents for comprehensive Institutional Analytics & Reporting
  const currentTicketCount = db.prepare('SELECT COUNT(*) as count FROM tickets').get().count;
  if (currentTicketCount < 15) {
    console.log('[Database] Seeding realistic campus infrastructure historical incidents for analytics...');
    const reporter1 = db.prepare("SELECT id FROM users WHERE college_id = 'STU-8821'").get();
    const reporter2 = db.prepare("SELECT id FROM users WHERE college_id = 'FAC-1044'").get();
    const tech1 = db.prepare("SELECT id FROM users WHERE college_id = 'TECH-4402'").get();
    const tech2 = db.prepare("SELECT id FROM users WHERE college_id = 'TECH-5120'").get();

    if (reporter1 && reporter2 && tech1 && tech2) {
      const insertHistTicket = db.prepare(`
        INSERT INTO tickets (ticket_number, title, description, category, priority, status, building, floor, room, affected_service, resolution_details, reporter_id, technician_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const histTickets = [
        // August 2026
        ['TKT-1001', 'Core Switch SFP transceiver fiber link flap', 'Intermittent link drops observed on 10G uplink connection.', 'Network Infrastructure', 'Critical', 'Closed', 'Engineering Block B', '3rd Floor', 'MDF Server Closet', 'Eduroam Wireless Access', 'Replaced faulty 10Gbps SFP+ optic on core switch.', reporter2.id, tech1.id, '2026-08-12 09:15:00', '2026-08-12 11:30:00'],
        ['TKT-1004', 'CAD Lab Workstation 07 continuous BSOD', 'Kernel fault when launching SolidWorks CUDA GPU acceleration.', 'Hardware Systems', 'High', 'Resolved', 'Design & Tech Lab', '2nd Floor', 'Studio 4', 'Computer Lab Workstations', 'Cleaned dust from GPU heatsink and reseated RAM modules.', reporter1.id, tech2.id, '2026-08-20 14:00:00', '2026-08-20 17:45:00'],
        ['TKT-1008', 'Lecture Hall 401 Smart Podium touch unresponsive', 'Crestron touch controller unresponsive to stylus inputs.', 'Classroom Equipment', 'Medium', 'Resolved', 'Science Complex', '4th Floor', 'Lecture Hall 401', 'Classroom Smartboards & Projectors', 'Updated controller firmware and reset RS-232 bridge.', reporter2.id, tech2.id, '2026-08-27 10:20:00', '2026-08-27 12:10:00'],
        // September 2026
        ['TKT-1012', 'Central Library study pod power strip tripped breaker', 'Power strip surge protector disconnected after overload.', 'Power & Electrical', 'Medium', 'Closed', 'Central Campus Library', '1st Floor', 'Study Pod 12', 'Study Pod Electrical Power', 'Reset subpanel circuit breaker B14 and replaced surge unit.', reporter1.id, tech1.id, '2026-09-03 11:30:00', '2026-09-03 13:00:00'],
        ['TKT-1015', 'Student Union kiosk badge reader intermittent', 'RFID badge reader failing to authenticate student cards.', 'Hardware Systems', 'Low', 'Resolved', 'Student Union Building', 'Ground Floor', 'Entrance Lobby', 'Central Printing Stations', 'Re-calibrated RFID reader sensitivity and secured USB port.', reporter1.id, tech2.id, '2026-09-11 16:15:00', '2026-09-12 09:40:00'],
        ['TKT-1019', 'Datacenter VM cluster SAN storage latency spike', 'I/O bottleneck affecting virtual host disk latency.', 'Campus Servers', 'Critical', 'Closed', 'Main Data Center', 'Ground Floor', 'Server Room 1', 'Datacenter Core Virtualization', 'Resolved iSCSI path failover queue bottleneck on Dell EMC array.', reporter2.id, tech1.id, '2026-09-18 03:22:00', '2026-09-18 06:10:00'],
        ['TKT-1022', 'Engineering Block B 2nd floor switch loop broadcast storm', 'Unmanaged switch looped packet transmission across VLAN 20.', 'Network Infrastructure', 'Critical', 'Closed', 'Engineering Block B', '2nd Floor', 'IDF Closet 2B', 'Eduroam Wireless Access', 'Isolated loopback cable and enabled BPDU guard on switch port.', reporter1.id, tech1.id, '2026-09-24 13:40:00', '2026-09-24 15:15:00'],
        ['TKT-1026', 'Campus LMS exam portal session timeouts', 'Students experiencing timeout disconnects during mid-term submission.', 'Software & OS', 'High', 'Resolved', 'Administrative Tower', '4th Floor', 'IT Operations', 'Campus Learning Portal (LMS)', 'Increased Redis session cache pool max connection limits.', reporter2.id, tech1.id, '2026-09-29 08:50:00', '2026-09-29 11:20:00'],
        // October 2026
        ['TKT-1031', 'Science Complex Chemistry Lab fume hood alarm sensor', 'Audible alert triggered intermittently on air velocity sensor.', 'Power & Electrical', 'High', 'Closed', 'Science Complex', '3rd Floor', 'Lab 310', 'Study Pod Electrical Power', 'Replaced airflow sensor wiring connector.', reporter2.id, tech2.id, '2026-10-04 10:15:00', '2026-10-04 12:45:00'],
        ['TKT-1037', 'Library 3rd floor Wi-Fi dead zone near stacks', 'Weak 5GHz signal coverage in quiet study rows.', 'Network Infrastructure', 'Medium', 'Resolved', 'Central Campus Library', '3rd Floor', 'Quiet Study Area', 'Eduroam Wireless Access', 'Repositioned Aruba AP-555 and boosted 5GHz radio power output.', reporter1.id, tech1.id, '2026-10-09 15:30:00', '2026-10-10 10:00:00'],
        ['TKT-1040', 'Design Studio 3D Printer extruders jammed with PLA', 'Extruder stepper motor clicking and skipping steps.', 'Hardware Systems', 'Low', 'Resolved', 'Design & Tech Lab', '1st Floor', 'Fabrication Lab', 'Computer Lab Workstations', 'Cleared hardened filament and replaced brass nozzle.', reporter1.id, tech2.id, '2026-10-13 14:10:00', '2026-10-13 16:30:00'],
        ['TKT-1044', 'Datacenter CRAC cooling unit temperature fluctuation', 'Thermal threshold breached on intake manifold sensor B.', 'Power & Electrical', 'Critical', 'Closed', 'Main Data Center', 'Ground Floor', 'Cooling Bay B', 'Datacenter Core Virtualization', 'Purged coolant solenoid valve and recalibrated chilled water loop PID.', reporter2.id, tech1.id, '2026-10-17 07:15:00', '2026-10-17 09:30:00'],
        ['TKT-1048', 'Student Union Computer Lounge LaserJet duplex roller jam', 'Paper jams occurring repeatedly during double-sided queue jobs.', 'Hardware Systems', 'Medium', 'Resolved', 'Student Union Building', '2nd Floor', 'Computer Lounge', 'Central Printing Stations', 'Replaced pickup roller assembly kit.', reporter1.id, tech2.id, '2026-10-21 11:45:00', '2026-10-21 13:20:00'],
        ['TKT-1051', 'Engineering Block B Lab 301 network wall drops inactive', 'Wired Ethernet jacks dead on benches 4 and 5.', 'Network Infrastructure', 'High', 'Resolved', 'Engineering Block B', '3rd Floor', 'Lab 301', 'Residence Hall Ethernet', 'Re-punched Cat6 patch panel ports 17-22 on rack 3.', reporter1.id, tech1.id, '2026-10-24 09:00:00', '2026-10-24 11:45:00'],
        ['TKT-1056', 'Admin Tower 5th Floor Conference Room display audio buzz', 'Ground hum audible through ceiling speakers during conference calls.', 'Classroom Equipment', 'Low', 'Closed', 'Administrative Tower', '5th Floor', 'Conference Room A', 'Classroom Smartboards & Projectors', 'Installed ground loop audio isolator on auxiliary 3.5mm feed.', reporter2.id, tech2.id, '2026-10-26 14:30:00', '2026-10-26 16:00:00'],
        ['TKT-1060', 'Science Complex Lecture Hall 402 wireless mic dropouts', 'Audio cutouts during faculty presentations.', 'Classroom Equipment', 'Medium', 'Resolved', 'Science Complex', '4th Floor', 'Lecture Hall 402', 'Classroom Smartboards & Projectors', 'Shifted wireless receiver frequency channel away from LTE bleed band.', reporter2.id, tech2.id, '2026-10-28 10:00:00', '2026-10-28 11:45:00'],
        ['TKT-1065', 'Central Library Ground Floor turnstile card reader timeout', 'Turnstile 2 NFC controller failing to release barrier latch.', 'Hardware Systems', 'High', 'Resolved', 'Central Campus Library', 'Ground Floor', 'Main Entrance', 'Central Printing Stations', 'Replaced PoE Ethernet transceiver module in turnstile pedestal.', reporter1.id, tech1.id, '2026-10-30 08:30:00', '2026-10-30 10:15:00'],
        // Active / Recent (Late Oct & Early Nov)
        ['TKT-1070', 'Design & Tech Lab iMac Render Farm thermal throttling', 'Render times tripled due to heavy CPU thermal throttling.', 'Hardware Systems', 'Medium', 'In Progress', 'Design & Tech Lab', '2nd Floor', 'Studio 2', 'Computer Lab Workstations', null, reporter1.id, tech2.id, '2026-10-31 13:10:00', '2026-10-31 14:00:00'],
        ['TKT-1074', 'Engineering Block B Basement Substation ground fault', 'Voltage imbalance warning flagged on distribution panel 3.', 'Power & Electrical', 'Critical', 'In Progress', 'Engineering Block B', 'Ground Floor', 'Substation Room', 'Study Pod Electrical Power', null, reporter2.id, tech1.id, '2026-11-01 09:30:00', '2026-11-01 10:15:00'],
        ['TKT-1077', 'Student Union Wi-Fi roaming dropouts during peak noon', 'Clients losing DHCP leases when walking between floors.', 'Network Infrastructure', 'High', 'Assigned', 'Student Union Building', '1st Floor', 'Food Court', 'Eduroam Wireless Access', null, reporter1.id, tech1.id, '2026-11-01 14:20:00', '2026-11-01 15:00:00'],
        ['TKT-1080', 'Main Data Center backup generator transfer switch test error', 'ATS sync controller returned fault code 44 during weekly exercise.', 'Power & Electrical', 'Critical', 'Open', 'Main Data Center', 'Ground Floor', 'Power Yard', 'Datacenter Core Virtualization', null, reporter2.id, null, '2026-11-02 08:15:00', '2026-11-02 08:15:00'],
        ['TKT-1084', 'Central Campus Library Pod 7 wall outlets dead', 'AC socket pair on west wall study cubicle not outputting power.', 'Power & Electrical', 'Medium', 'Open', 'Central Campus Library', '1st Floor', 'Study Pod 7', 'Study Pod Electrical Power', null, reporter1.id, null, '2026-11-02 11:40:00', '2026-11-02 11:40:00'],
        ['TKT-1088', 'Science Complex Lab 202 chemical ventilation monitor', 'Modbus network timeout connecting to building automation controller.', 'Network Infrastructure', 'High', 'Assigned', 'Science Complex', '2nd Floor', 'Lab 202', 'Eduroam Wireless Access', null, reporter2.id, tech2.id, '2026-11-02 13:10:00', '2026-11-02 13:45:00'],
        ['TKT-1090', 'Design & Tech Lab plotter printer paper feed sensor error', 'Large format plotter refusing roll feed media.', 'Hardware Systems', 'Low', 'Open', 'Design & Tech Lab', '1st Floor', 'Print Center', 'Central Printing Stations', null, reporter1.id, null, '2026-11-02 15:20:00', '2026-11-02 15:20:00'],
      ];

      for (const t of histTickets) {
        insertHistTicket.run(...t);
      }
      console.log(`[Database] Seeded ${histTickets.length} historical infrastructure tickets.`);
    }
  }

  // Seed initial notification events for realistic operational experience
  const notifCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
  if (notifCount < 10) {
    console.log('[Database] Seeding initial role-tailored notifications...');
    const reporter = db.prepare("SELECT id, email FROM users WHERE college_id = 'STU-8821'").get();
    const tech = db.prepare("SELECT id, email FROM users WHERE college_id = 'TECH-4402'").get();
    const admin = db.prepare("SELECT id, email FROM users WHERE college_id = 'ADM-0001'").get();
    const ticket1 = db.prepare("SELECT id, ticket_number, title FROM tickets WHERE ticket_number = 'TKT-1082'").get();
    const ticket2 = db.prepare("SELECT id, ticket_number, title FROM tickets WHERE ticket_number = 'TKT-1049'").get();

    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, ticket_id, event_type, title, message, role_target, priority, is_read, email_sent, email_recipient)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Notifications for Student / Faculty (Reporter: Alex Rivera)
    const reporterNotifs = reporter ? db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(reporter.id).count : 0;
    if (reporter && ticket1 && reporterNotifs === 0) {
      insertNotif.run(
        reporter.id,
        ticket1.id,
        'INCIDENT_SUBMITTED',
        'Incident Logged Successfully',
        `Your incident report ${ticket1.ticket_number} ("${ticket1.title}") was submitted and placed in the triage queue.`,
        'Reporter',
        'normal',
        1,
        1,
        reporter.email
      );
      insertNotif.run(
        reporter.id,
        ticket1.id,
        'INCIDENT_ASSIGNED',
        'Technician Assigned to Incident',
        `Field Specialist Marcus Vance has been assigned to work on ${ticket1.ticket_number}.`,
        'Reporter',
        'normal',
        1,
        1,
        reporter.email
      );
      insertNotif.run(
        reporter.id,
        ticket1.id,
        'NOTE_ADDED',
        'Technician Added Investigation Note',
        `Marcus Vance updated ${ticket1.ticket_number}: "Diagnosed Cisco AP 2802; swapping PoE injector."`,
        'Reporter',
        'normal',
        0,
        1,
        reporter.email
      );
      insertNotif.run(
        reporter.id,
        ticket1.id,
        'CONFIRMATION_REQUESTED',
        'Reporter Confirmation Requested',
        `Repairs on ${ticket1.ticket_number} are completed. Please test connectivity in Lab 304 and confirm resolution.`,
        'Reporter',
        'high',
        0,
        1,
        reporter.email
      );
    }

    // Notifications for Field Technician (Marcus Vance)
    const techNotifs = tech ? db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(tech.id).count : 0;
    if (tech && ticket1 && ticket2 && techNotifs === 0) {
      insertNotif.run(
        tech.id,
        ticket1.id,
        'NEW_INCIDENT_ASSIGNED',
        'New Work Order Assigned',
        `You have been assigned to investigate ${ticket1.ticket_number} in Engineering Block B (Lab 304).`,
        'Technician',
        'high',
        1,
        1,
        tech.email
      );
      insertNotif.run(
        tech.id,
        ticket1.id,
        'PRIORITY_CHANGED',
        'Incident Priority Escalated',
        `Priority for ${ticket1.ticket_number} has been escalated to "High" due to upcoming class sessions.`,
        'Technician',
        'high',
        0,
        1,
        tech.email
      );
      insertNotif.run(
        tech.id,
        ticket1.id,
        'REPORTER_COMMENT',
        'Reporter Added a Comment',
        `Alex Rivera commented on ${ticket1.ticket_number}: "Access point beacon dropped again at 2:15 PM."`,
        'Technician',
        'normal',
        0,
        1,
        tech.email
      );
      insertNotif.run(
        tech.id,
        ticket2.id,
        'CRITICAL_INCIDENT',
        'Urgent: Critical Incident Logged',
        `CRITICAL PRIORITY: ${ticket2.ticket_number} reported in CS Datacenter. Immediate response required.`,
        'Technician',
        'critical',
        0,
        1,
        tech.email
      );
    }

    // Notifications for Administrator (Director Nathan Drake)
    const adminNotifs = admin ? db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(admin.id).count : 0;
    if (admin && ticket1 && ticket2 && adminNotifs === 0) {
      insertNotif.run(
        admin.id,
        ticket1.id,
        'NEW_INCIDENT_SUBMITTED',
        'New Campus Incident Reported',
        `Incident ${ticket1.ticket_number} ("${ticket1.title}") submitted by Alex Rivera in Engineering Block B.`,
        'Administrator',
        'normal',
        1,
        1,
        admin.email
      );
      insertNotif.run(
        admin.id,
        ticket2.id,
        'CRITICAL_INCIDENT',
        'Critical Infrastructure Incident Alert',
        `CRITICAL SLA ALERT: ${ticket2.ticket_number} in CS Datacenter requires immediate operational attention.`,
        'Administrator',
        'critical',
        0,
        1,
        admin.email
      );
      insertNotif.run(
        admin.id,
        ticket2.id,
        'SLA_OVERDUE',
        'Incident Overdue SLA Target',
        `Incident ${ticket2.ticket_number} has exceeded the 2.0 hour target SLA resolution window.`,
        'Administrator',
        'critical',
        0,
        1,
        admin.email
      );
      insertNotif.run(
        admin.id,
        ticket1.id,
        'ASSIGNMENT_CHANGED',
        'Technician Assignment Dispatched',
        `Incident ${ticket1.ticket_number} successfully dispatched to specialist Marcus Vance.`,
        'Administrator',
        'normal',
        0,
        1,
        admin.email
      );
      insertNotif.run(
        admin.id,
        ticket1.id,
        'REPEATED_ISSUE',
        'Repeated Infrastructure Issue Detected',
        `Cluster Warning: 3+ network access issues registered in Engineering Block B within the last 7 days.`,
        'Administrator',
        'high',
        0,
        1,
        admin.email
      );
    }

    console.log('[Database] Role-tailored notification feed seeded successfully.');
  }
}

export default db;
