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
}

export default db;
