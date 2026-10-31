import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../auth.js';
import { query, queryOne, execute, saveDb } from '../../db/database.js';
import { getRiskConfiguration, updateRiskConfiguration, evaluateAllStudentsRisk } from '../riskEngine.js';
import { triggerAbsenceNotifications } from '../notifications.js';

export const adminRouter = Router();

adminRouter.use(authenticateToken, requireRole(['ADMIN']));

// Overview statistics for Admin
adminRouter.get('/dashboard', async (_req: AuthenticatedRequest, res: Response) => {
  const students = await query(`
    SELECT s.id, s.name, s.roll_number, s.section, r.risk_level, r.overall_risk_score
    FROM students s
    LEFT JOIN risk_assessments r ON s.id = r.student_id
  `);

  const riskDistribution = {
    high: students.filter(s => s.risk_level === 'HIGH').length,
    medium: students.filter(s => s.risk_level === 'MEDIUM').length,
    low: students.filter(s => s.risk_level === 'LOW').length
  };

  const avgAttRow = await queryOne('SELECT AVG(percentage) as avg_att FROM attendance');
  const avgAtt = Number((avgAttRow?.avg_att || 82).toFixed(1));

  // GPA Distribution buckets
  const gpaBuckets = [
    { label: '9.0 - 10.0 (Distinction)', count: 0 },
    { label: '8.0 - 8.9 (First Class Dist.)', count: 0 },
    { label: '7.0 - 7.9 (First Class)', count: 0 },
    { label: '6.0 - 6.9 (Second Class)', count: 0 },
    { label: '< 6.0 (At Risk)', count: 0 }
  ];

  for (const s of students) {
    const scoreRow = await queryOne(`
      SELECT AVG((marks_obtained / max_marks) * 100) as avg_score
      FROM marks
      WHERE student_id = ?
    `, [s.id]);

    const pct = scoreRow?.avg_score || 72;
    const gpa = pct / 9.5;

    if (gpa >= 9.0) gpaBuckets[0].count++;
    else if (gpa >= 8.0) gpaBuckets[1].count++;
    else if (gpa >= 7.0) gpaBuckets[2].count++;
    else if (gpa >= 6.0) gpaBuckets[3].count++;
    else gpaBuckets[4].count++;
  }

  const subjects = await query('SELECT count(*) as count FROM subjects');
  const faculty = await query('SELECT count(*) as count FROM faculty');
  const config = await getRiskConfiguration();

  return res.json({
    totalStudents: students.length,
    totalFaculty: faculty[0]?.count || 3,
    totalSubjects: subjects[0]?.count || 5,
    averageAttendance: avgAtt,
    riskDistribution,
    gpaBuckets,
    config
  });
});

// Risk configuration
adminRouter.get('/risk-config', async (_req: AuthenticatedRequest, res: Response) => {
  const config = await getRiskConfiguration();
  return res.json({ config });
});

adminRouter.put('/risk-config', async (req: AuthenticatedRequest, res: Response) => {
  const {
    minAttendanceThreshold,
    declinePercentageThreshold,
    varianceThreshold,
    highRiskCutoff,
    mediumRiskCutoff
  } = req.body;

  if (
    minAttendanceThreshold === undefined ||
    declinePercentageThreshold === undefined ||
    highRiskCutoff === undefined
  ) {
    return res.status(400).json({ error: 'Required configuration parameters are missing.' });
  }

  const updated = await updateRiskConfiguration({
    minAttendanceThreshold: Number(minAttendanceThreshold),
    declinePercentageThreshold: Number(declinePercentageThreshold),
    varianceThreshold: Number(varianceThreshold),
    highRiskCutoff: Number(highRiskCutoff),
    mediumRiskCutoff: Number(mediumRiskCutoff)
  });

  await queryOne('INSERT INTO audit_logs (id, actor, action, target) VALUES (?, ?, ?, ?)', [
    `audit_${Date.now()}`, req.user?.email || 'admin', 'UPDATE_RISK_CONFIG', 'SYSTEM_RISK_CONFIG'
  ]);
  saveDb();

  return res.json({ success: true, config: updated });
});

// Force recalculate all risks
adminRouter.post('/recalculate-risks', async (req: AuthenticatedRequest, res: Response) => {
  const results = await evaluateAllStudentsRisk();
  
  await queryOne('INSERT INTO audit_logs (id, actor, action, target) VALUES (?, ?, ?, ?)', [
    `audit_${Date.now()}`, req.user?.email || 'admin', 'RECALCULATE_ALL_RISKS', `Evaluated ${results.length} students`
  ]);
  saveDb();

  return res.json({ success: true, evaluatedCount: results.length });
});

// Batch CSV / Data Import for Marks or Attendance
adminRouter.post('/import-data', async (req: AuthenticatedRequest, res: Response) => {
  const { type, records } = req.body; // type: 'MARKS' | 'ATTENDANCE'
  if (!type || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: 'Type (MARKS or ATTENDANCE) and an array of records are required.' });
  }

  const errors: string[] = [];
  let successCount = 0;

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 1;

    if (type === 'MARKS') {
      const { rollNumber, subjectCode, assessmentType, marksObtained, maxMarks } = row;
      if (!rollNumber || !subjectCode || !assessmentType || marksObtained === undefined) {
        errors.push(`Row ${rowNum}: Missing rollNumber, subjectCode, assessmentType, or marksObtained.`);
        continue;
      }

      const numMarks = Number(marksObtained);
      const numMax = Number(maxMarks || 30);
      if (isNaN(numMarks) || numMarks < 0 || numMarks > numMax) {
        errors.push(`Row ${rowNum}: Marks obtained (${marksObtained}) must be between 0 and maximum allowed (${numMax}).`);
        continue;
      }

      const student = await queryOne('SELECT id FROM students WHERE roll_number = ?', [rollNumber]);
      if (!student) {
        errors.push(`Row ${rowNum}: Student with roll number ${rollNumber} does not exist.`);
        continue;
      }

      const subject = await queryOne('SELECT id FROM subjects WHERE code = ?', [subjectCode]);
      if (!subject) {
        errors.push(`Row ${rowNum}: Subject with code ${subjectCode} does not exist.`);
        continue;
      }

      const assessment = await queryOne(`
        SELECT id FROM assessments WHERE subject_id = ? AND type = ?
      `, [subject.id, assessmentType]);

      if (!assessment) {
        errors.push(`Row ${rowNum}: Assessment type ${assessmentType} not found for subject ${subjectCode}.`);
        continue;
      }

      await execute(`
        INSERT INTO marks (id, student_id, assessment_id, marks_obtained, max_marks, remarks)
        VALUES (?, ?, ?, ?, ?, 'Imported via Admin Portal')
        ON CONFLICT(student_id, assessment_id) DO UPDATE SET
          marks_obtained = excluded.marks_obtained,
          max_marks = excluded.max_marks,
          remarks = excluded.remarks
      `, [`m_imp_${Date.now()}_${i}`, student.id, assessment.id, numMarks, numMax]);

      successCount++;
    } else if (type === 'ATTENDANCE') {
      const { rollNumber, subjectCode, attendedClasses, totalClasses } = row;
      if (!rollNumber || !subjectCode || attendedClasses === undefined || totalClasses === undefined) {
        errors.push(`Row ${rowNum}: Missing required attendance fields.`);
        continue;
      }

      const attended = Number(attendedClasses);
      const total = Number(totalClasses);
      if (isNaN(attended) || isNaN(total) || total <= 0 || attended < 0 || attended > total) {
        errors.push(`Row ${rowNum}: Attended classes (${attended}) cannot exceed total classes (${total}).`);
        continue;
      }

      const student = await queryOne('SELECT id FROM students WHERE roll_number = ?', [rollNumber]);
      if (!student) {
        errors.push(`Row ${rowNum}: Student with roll number ${rollNumber} not found.`);
        continue;
      }

      const subject = await queryOne('SELECT id FROM subjects WHERE code = ?', [subjectCode]);
      if (!subject) {
        errors.push(`Row ${rowNum}: Subject ${subjectCode} not found.`);
        continue;
      }

      const existing = await queryOne('SELECT total_classes, attended_classes FROM attendance WHERE student_id = ? AND subject_id = ?', [student.id, subject.id]);
      let newAbsencesCount = 0;
      if (existing) {
        newAbsencesCount = (total - attended) - (existing.total_classes - existing.attended_classes);
      } else {
        newAbsencesCount = total - attended;
      }

      if (newAbsencesCount > 0) {
        await triggerAbsenceNotifications(student.id, subject.id, total, attended, newAbsencesCount);
      }

      const pct = (attended / total) * 100;
      await execute(`
        INSERT INTO attendance (id, student_id, subject_id, total_classes, attended_classes, percentage)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(student_id, subject_id) DO UPDATE SET
          total_classes = excluded.total_classes,
          attended_classes = excluded.attended_classes,
          percentage = excluded.percentage,
          last_updated = CURRENT_TIMESTAMP
      `, [`att_imp_${Date.now()}_${i}`, student.id, subject.id, total, attended, pct]);

      successCount++;
    }
  }

  saveDb();
  // Recalculate risks for updated students
  await evaluateAllStudentsRisk();

  await queryOne('INSERT INTO audit_logs (id, actor, action, target) VALUES (?, ?, ?, ?)', [
    `audit_${Date.now()}`, req.user?.email || 'admin', `IMPORT_${type}_DATA`, `Success: ${successCount}, Errors: ${errors.length}`
  ]);
  saveDb();

  return res.json({
    success: true,
    successCount,
    errors
  });
});

// Get Audit Logs
adminRouter.get('/audit-logs', async (_req: AuthenticatedRequest, res: Response) => {
  const logs = await query(`
    SELECT id, actor, action, target, created_at
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 100
  `);
  return res.json({ logs });
});
