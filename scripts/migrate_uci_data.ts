import fs from 'fs';
import { execute, queryOne, saveDb } from '../db/database.js';
import { hashPassword } from '../db/seed.js';
import path from 'path';

async function migrate() {
  const csvPath = 'C:/Users/hp/.gemini/antigravity-ide/brain/0a0716ae-0630-4228-9531-16d4177ea65a/scratch/uci_dataset.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    return;
  }

  const data = fs.readFileSync(csvPath, 'utf8');
  const lines = data.trim().split('\n');
  const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
  
  let rollCounter = 2420030520;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // some naive parsing for ';'
    const values = line.split(';');
    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ? values[idx].replace(/"/g, '') : null;
    });

    const rollNumber = String(rollCounter++);
    const name = `Student ${rollNumber.substring(rollNumber.length - 4)}`;
    const email = `stu${rollNumber}@student.college.edu`;
    const passwordHash = hashPassword(rollNumber);
    const userId = `user_${rollNumber}`;
    const studentId = `stu_${rollNumber}`;

    // Check if user exists
    const existing = await queryOne('SELECT id FROM users WHERE roll_number = ?', [rollNumber]);
    if (!existing) {
      await execute(`
        INSERT INTO users (id, email, password_hash, role, name, roll_number, department, phone)
        VALUES (?, ?, ?, 'STUDENT', ?, ?, 'Computer Science & Engineering', '+91 99000 00000')
      `, [userId, email, passwordHash, name, rollNumber]);

      await execute(`
        INSERT INTO students (id, user_id, roll_number, name, section, batch, current_semester_id, mentor_faculty_id)
        VALUES (?, ?, ?, ?, 'A', '2024-2028', 'sem_5', 'fac_guide')
      `, [studentId, userId, rollNumber, name]);

      // Calculate some fake GPA based on G3 score (0-20 scale in Portugal dataset)
      const g3 = parseInt(row.G3 || '10');
      const gpa = Math.min(10, Math.max(0, g3 / 2));
      const percentage = gpa * 9.5;
      const attendance = 100 - parseInt(row.absences || '0');

      await execute(`
        INSERT INTO performance_records (id, student_id, semester_id, gpa, percentage, total_credits, rank_in_section, attendance_average, trend_status)
        VALUES (?, ?, 'sem_4', ?, ?, 24, 10, ?, 'STABLE')
      `, [`perf_${studentId}_sem4`, studentId, gpa, percentage, attendance]);
    }
  }

  saveDb();
  console.log('✅ Successfully migrated UCI dataset!');
}

migrate().catch(console.error);
