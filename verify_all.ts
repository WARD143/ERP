import { query } from './db/database.js';

async function verifyAllStudents() {
  const allStudents = await query(`
    SELECT s.id, s.roll_number, s.section
    FROM students s
  `);
  console.log(`Total students in DB: ${allStudents.length}`);
  
  const sections = {};
  for (const s of allStudents) {
    sections[s.section] = (sections[s.section] || 0) + 1;
  }
  console.log('Students per section:', sections);
  
  const testIds = ['2420030521', '2420030522', '2420030523', '2420030524', '2420030525'];
  for (const roll of testIds) {
    const student = allStudents.find(s => s.roll_number === roll);
    console.log(`Student ${roll} is in section ${student?.section || 'NOT FOUND'}`);
  }
}

verifyAllStudents().catch(console.error);
