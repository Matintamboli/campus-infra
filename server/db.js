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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

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

  // Seed default categories
  const categoryCheck = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCheck.count === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, code, description) VALUES (?, ?, ?)');
    insertCat.run('Network Infrastructure', 'network', 'Campus Wi-Fi, Ethernet, routers, switches, and firewalls');
    insertCat.run('Hardware Systems', 'hardware', 'Desktops, laptops, monitors, peripherals, and lab workstations');
    insertCat.run('Software & OS', 'software', 'Licensed software, campus portals, LMS, OS updates, and lab images');
    insertCat.run('Power & Electrical', 'power', 'UPS backups, classroom power strips, surge suppressors, and generators');
    insertCat.run('Classroom Equipment', 'classroom', 'Projectors, smartboards, audio mics, podiums, and lecture capture');
    insertCat.run('Campus Servers', 'servers', 'Datacenter hosts, virtual machines, storage arrays, and DNS servers');
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
}

export default db;
