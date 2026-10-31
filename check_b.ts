import { query } from './db/database.js';

async function checkSectionB() {
  const sectionB = await query(`
    SELECT s.roll_number, s.name, s.section
    FROM students s
    WHERE s.section = 'B'
  `);
  console.log('Section B students:', sectionB);
}

checkSectionB().catch(console.error);
