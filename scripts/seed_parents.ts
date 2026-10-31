import { execute, queryOne, saveDb } from '../db/database.js';
import { hashPassword } from '../db/seed.js';

async function seedParents() {
  const pwd = hashPassword('parent123');

  // Add Parent for P. TejAditya
  const s1 = await queryOne('SELECT id, roll_number FROM students WHERE roll_number = ?', ['2420030520']);
  if (s1) {
    const parentUserId = 'user_parent_tejaditya';
    const parentId = 'parent_tejaditya';
    await execute('INSERT OR IGNORE INTO users (id, email, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)', [
      parentUserId, 'parent.tejaditya@example.com', pwd, 'PARENT', 'Mr. TejAditya Sr', '+91 99000 12345'
    ]);
    await execute('INSERT OR IGNORE INTO parents (id, user_id, name, phone) VALUES (?, ?, ?, ?)', [
      parentId, parentUserId, 'Mr. TejAditya Sr', '+91 99000 12345'
    ]);
    await execute('INSERT OR IGNORE INTO parent_students (id, parent_id, student_id, relationship) VALUES (?, ?, ?, ?)', [
      'ps_1', parentId, s1.id, 'Father'
    ]);
  }

  // Add Parent for dataset student 2420030521
  const s2 = await queryOne('SELECT id, roll_number FROM students WHERE roll_number = ?', ['2420030521']);
  if (s2) {
    const parentUserId = 'user_parent_521';
    const parentId = 'parent_521';
    await execute('INSERT OR IGNORE INTO users (id, email, password_hash, role, name, phone) VALUES (?, ?, ?, ?, ?, ?)', [
      parentUserId, 'parent.521@example.com', pwd, 'PARENT', 'Mrs. Sharma', '+91 99000 54321'
    ]);
    await execute('INSERT OR IGNORE INTO parents (id, user_id, name, phone) VALUES (?, ?, ?, ?)', [
      parentId, parentUserId, 'Mrs. Sharma', '+91 99000 54321'
    ]);
    await execute('INSERT OR IGNORE INTO parent_students (id, parent_id, student_id, relationship) VALUES (?, ?, ?, ?)', [
      'ps_2', parentId, s2.id, 'Mother'
    ]);
  }

  saveDb();
  console.log('✅ Parents seeded successfully!');
}

seedParents().catch(console.error);
