import { execute, query, saveDb } from '../db/database.js';

async function migrateV3() {
  console.log('Starting Migration V3...');

  // 1. Upgrade Interventions Table to Case Management
  await execute('PRAGMA foreign_keys = OFF;');

  await execute(`
    CREATE TABLE IF NOT EXISTS intervention_cases (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        faculty_id TEXT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
        issue_type TEXT NOT NULL,
        priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
        status TEXT CHECK(status IN ('Open', 'In Progress', 'Waiting for Student', 'Waiting for Parent', 'Resolved', 'Closed')) DEFAULT 'Open',
        notes TEXT,
        action_plan TEXT,
        follow_up_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate existing interventions to the new table
  const oldInterventions = await query('SELECT * FROM interventions');
  for (const inv of oldInterventions) {
    let issueType = 'Other';
    if (inv.type === 'ATTENDANCE_WARNING') issueType = 'Attendance';
    else if (inv.type === 'PARENT_CONTACT') issueType = 'Parent Communication';
    else if (inv.type === 'REMEDIAL_CLASS') issueType = 'Academic Performance';
    
    let status = 'Open';
    if (inv.status === 'CONDUCTED') status = 'Resolved';
    else if (inv.status === 'FOLLOW_UP') status = 'Waiting for Student';

    await execute(`
      INSERT INTO intervention_cases (id, student_id, faculty_id, issue_type, priority, status, notes, follow_up_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inv.id, inv.student_id, inv.faculty_id, issueType, 'Medium', status, inv.notes, inv.target_date, inv.created_at, inv.created_at
    ]);
  }

  // Rename old table (or keep as backup)
  await execute(`DROP TABLE interventions;`);
  await execute(`ALTER TABLE intervention_cases RENAME TO interventions;`);

  // Intervention Timeline / Activity Log
  await execute(`
    CREATE TABLE IF NOT EXISTS intervention_activities (
        id TEXT PRIMARY KEY,
        intervention_id TEXT NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
        actor_role TEXT,
        action TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Generate initial activities for migrated interventions
  const newInterventions = await query('SELECT id, created_at FROM interventions');
  for (const inv of newInterventions) {
    await execute(`
      INSERT INTO intervention_activities (id, intervention_id, actor_role, action, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [`act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, inv.id, 'SYSTEM', 'Case created', 'Migrated from legacy system', inv.created_at]);
  }

  // 2. Risk Timeline
  await execute(`
    CREATE TABLE IF NOT EXISTS risk_timeline (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        risk_level TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await execute('PRAGMA foreign_keys = ON;');
  saveDb();
  console.log('✅ Migration V3 completed successfully!');
}

migrateV3().catch(console.error);
