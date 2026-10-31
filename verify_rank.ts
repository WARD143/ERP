import { query } from './db/database.js';

async function verifyRank() {
  const allStudents = await query(`
    SELECT s.id, s.roll_number, s.section, pr.gpa as prev_gpa
    FROM students s
    LEFT JOIN performance_records pr ON s.id = pr.student_id AND pr.semester_id = 'sem_4'
    WHERE s.section = 'A'
  `);

  console.log(`Exact number of students belonging to Section A in ranking query: ${allStudents.length}`);

  const uniqueIds = new Set(allStudents.map(s => s.id));
  console.log(`Unique student IDs: ${uniqueIds.size}`);

  const uciCount = allStudents.filter(s => parseInt(s.roll_number, 10) >= 2420030520).length;
  const seededCount = allStudents.filter(s => parseInt(s.roll_number, 10) < 2420030520).length;
  console.log(`UCI Dataset students: ${uciCount}`);
  console.log(`Seeded students: ${seededCount}`);

  allStudents.sort((a, b) => (b.prev_gpa || 0) - (a.prev_gpa || 0));

  const testIds = ['2420030521', '2420030522', '2420030523', '2420030524', '2420030525'];
  
  console.log('Student ID | Rank | Cohort Size | Performance Metric (prev_gpa)');
  
  for (const roll of testIds) {
    const studentId = `stu_${roll}`;
    const myIndex = allStudents.findIndex(s => s.id === studentId);
    let rank = myIndex !== -1 ? myIndex + 1 : 'Not Found';
    let gpa = myIndex !== -1 ? allStudents[myIndex].prev_gpa : 'N/A';
    
    console.log(`${studentId} | ${rank} | ${allStudents.length} | ${gpa}`);
  }
}

verifyRank().catch(console.error);
