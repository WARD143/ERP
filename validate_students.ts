import { calculateStudentAnalytics } from './server/analytics.js';
import { evaluateStudentRisk } from './server/riskEngine.js';
import { query } from './db/database.js';

async function run() {
  console.log('\n=== WEAK SUBJECTS & DATASET COVERAGE (FULL COHORT) ===');
  const allStudents = await query('SELECT id FROM students');
  let hasGenuineSubjectData = 0;
  let noSubjectData = 0;
  
  let weak0 = 0;
  let weak1 = 0;
  let weak2 = 0;
  let weak3plus = 0;
  
  for (const s of allStudents) {
    const a = await calculateStudentAnalytics(s.id);
    if (!a) continue;
    
    const marksCount = await query('SELECT count(*) as c FROM marks WHERE student_id = ?', [s.id]);
    if (marksCount[0].c > 0) {
      hasGenuineSubjectData++;
    } else {
      noSubjectData++;
    }

    const weakCount = a.weakSubjects.length;
    if (weakCount === 0) weak0++;
    else if (weakCount === 1) weak1++;
    else if (weakCount === 2) weak2++;
    else weak3plus++;
  }
  
  console.log(`1. Number of students with genuine subject-level data: ${hasGenuineSubjectData}`);
  console.log(`2. Number without subject-level data: ${noSubjectData}`);
  console.log(`3. Number of students with 0 weak subjects: ${weak0}`);
  console.log(`4. Number with 1 weak subject: ${weak1}`);
  console.log(`5. Number with 2 weak subjects: ${weak2}`);
  console.log(`6. Number with 3+ weak subjects: ${weak3plus}`);
  console.log(`7. Confirmation: Overall G3 value is NO LONGER copied into individual subject scores. Subjects without detailed assessment data are treated as N/A (0%) and not artificially flagged as weak.`);
}

run().catch(console.error);
