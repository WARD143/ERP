import { execute, query, saveDb } from '../db/database.js';

async function migrateV2() {
  console.log('Starting Migration V2...');

  // 1. Update users table to allow 'PARENT' role
  // SQLite doesn't support altering CHECK constraints. We have to recreate the table.
  await execute('PRAGMA foreign_keys = OFF;');

  await execute(`
    CREATE TABLE IF NOT EXISTS users_new (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('STUDENT', 'FACULTY', 'ADMIN', 'PARENT')) NOT NULL,
        name TEXT NOT NULL,
        roll_number TEXT,
        department TEXT DEFAULT 'Computer Science & Engineering',
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  await execute(`INSERT INTO users_new SELECT * FROM users;`);
  await execute(`DROP TABLE users;`);
  await execute(`ALTER TABLE users_new RENAME TO users;`);
  
  await execute('PRAGMA foreign_keys = ON;');
  
  // 2. Parents Table
  await execute(`
    CREATE TABLE IF NOT EXISTS parents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT,
        primary_contact INTEGER DEFAULT 1
    );
  `);

  // 3. Parent-Student Links
  await execute(`
    CREATE TABLE IF NOT EXISTS parent_students (
        id TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        relationship TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(parent_id, student_id)
    );
  `);

  // 4. Mentor Assignments (Explicit Many-to-Many or Tracking)
  await execute(`
    CREATE TABLE IF NOT EXISTS mentor_students (
        id TEXT PRIMARY KEY,
        mentor_id TEXT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        assigned_by TEXT,
        status TEXT CHECK(status IN ('ACTIVE', 'PREVIOUS')) DEFAULT 'ACTIVE'
    );
  `);
  
  // Backfill mentor_students from existing students.mentor_faculty_id
  const students = await query('SELECT id, mentor_faculty_id FROM students WHERE mentor_faculty_id IS NOT NULL');
  for (const stu of students) {
    const existing = await query('SELECT id FROM mentor_students WHERE student_id = ? AND mentor_id = ?', [stu.id, stu.mentor_faculty_id]);
    if (existing.length === 0) {
      await execute(`
        INSERT INTO mentor_students (id, mentor_id, student_id, status)
        VALUES (?, ?, ?, 'ACTIVE')
      `, [`ms_${Date.now()}_${stu.id}`, stu.mentor_faculty_id, stu.id]);
    }
  }

  // 5. Notifications
  await execute(`
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        recipient_id TEXT NOT NULL,
        recipient_role TEXT NOT NULL,
        student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
        type TEXT CHECK(type IN ('ABSENCE', 'ACADEMIC_RISK', 'PERFORMANCE_DECLINE', 'INTERVENTION', 'PARENT_CONTACT', 'SYSTEM')) NOT NULL,
        priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'LOW',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read_at DATETIME,
        status TEXT CHECK(status IN ('UNREAD', 'READ', 'ARCHIVED')) DEFAULT 'UNREAD',
        deduplication_key TEXT UNIQUE
    );
  `);

  // 6. Mentor Notes (Optional: distinct from interventions)
  await execute(`
    CREATE TABLE IF NOT EXISTS mentor_notes (
        id TEXT PRIMARY KEY,
        mentor_id TEXT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        note TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. Audit Logs
  await execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDb();
  console.log('✅ Migration V2 completed successfully!');
}

migrateV2().catch(console.error);
