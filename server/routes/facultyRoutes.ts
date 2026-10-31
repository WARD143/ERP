import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../auth.js';
import { query, queryOne, execute, saveDb } from '../../db/database.js';
import { calculateStudentAnalytics } from '../analytics.js';
import { evaluateStudentRisk } from '../riskEngine.js';
import { generateStudentForecast } from '../forecaster.js';
import { runWhatIfSimulation } from '../whatIf.js';

export const facultyRouter = Router();

// Require Faculty or Admin role
facultyRouter.use(authenticateToken, requireRole(['FACULTY', 'ADMIN']));

// Ensure FACULTY users actually have a facultyId
facultyRouter.use((req: AuthenticatedRequest, res: Response, next) => {
  if (req.user?.role === 'FACULTY' && !req.user.facultyId) {
    return res.status(403).json({ error: 'Access denied. Mentor profile not found.' });
  }
  next();
});

// Faculty Dashboard Summary
facultyRouter.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  const isFaculty = req.user?.role === 'FACULTY';
  let queryStr = `
    SELECT s.id, s.name, s.roll_number, s.section,
           r.risk_level, r.overall_risk_score, r.explanation_reasons
    FROM students s
    LEFT JOIN risk_assessments r ON s.id = r.student_id
  `;
  const queryParams: any[] = [];
  
  if (isFaculty) {
    queryStr += ` JOIN mentor_students ms ON ms.student_id = s.id WHERE ms.mentor_id = ? AND ms.status = 'ACTIVE'`;
    queryParams.push(req.user?.facultyId);
  }
  
  queryStr += ` ORDER BY r.overall_risk_score DESC`;
  const students = await query(queryStr, queryParams);

  const totalStudents = students.length;
  const highRiskStudents = students.filter(s => s.risk_level === 'HIGH');
  const mediumRiskStudents = students.filter(s => s.risk_level === 'MEDIUM');
  const lowRiskStudents = students.filter(s => s.risk_level === 'LOW');

  // Subjects taught
  const subjects = await query(`
    SELECT sub.*, count(s.id) as enrolled_count
    FROM subjects sub
    CROSS JOIN students s
    GROUP BY sub.id
  `);

  // Active interventions
  let intQuery = `
    SELECT i.*, s.name as student_name, s.roll_number, f.name as faculty_name
    FROM interventions i
    JOIN students s ON i.student_id = s.id
    JOIN faculty f ON i.faculty_id = f.id
  `;
  const intParams: any[] = [];
  if (isFaculty) {
    intQuery += ` JOIN mentor_students ms ON ms.student_id = s.id WHERE ms.mentor_id = ? AND ms.status = 'ACTIVE'`;
    intParams.push(req.user?.facultyId);
  }
  intQuery += ` ORDER BY i.created_at DESC`;
  const interventions = await query(intQuery, intParams);

  // Active Critical Alerts
  let alertQuery = `
    SELECT a.*, s.name as student_name, s.roll_number
    FROM alerts a
    JOIN students s ON a.student_id = s.id
  `;
  const alertParams: any[] = [];
  if (isFaculty) {
    alertQuery += ` JOIN mentor_students ms ON ms.student_id = s.id WHERE ms.mentor_id = ? AND ms.status = 'ACTIVE' AND a.is_resolved = 0`;
    alertParams.push(req.user?.facultyId);
  } else {
    alertQuery += ` WHERE a.is_resolved = 0`;
  }
  alertQuery += ` ORDER BY CASE WHEN a.severity = 'CRITICAL' THEN 1 WHEN a.severity = 'WARNING' THEN 2 ELSE 3 END, a.created_at DESC`;
  const alerts = await query(alertQuery, alertParams);

  return res.json({
    summary: {
      totalStudents,
      highRiskCount: highRiskStudents.length,
      mediumRiskCount: mediumRiskStudents.length,
      lowRiskCount: lowRiskStudents.length,
      criticalAlertsCount: alerts.filter(a => a.severity === 'CRITICAL').length,
      activeInterventionsCount: interventions.filter(i => i.status !== 'Resolved').length
    },
    students,
    subjects,
    alerts,
    interventions
  });
});

// Filtered Student List
facultyRouter.get('/students', async (req: AuthenticatedRequest, res: Response) => {
  const { search, riskLevel, section, trend, minAttendance, maxAttendance } = req.query;

  const isFaculty = req.user?.role === 'FACULTY';
  let queryStr = `
    SELECT s.id, s.name, s.roll_number, s.section, s.batch,
           u.email, r.overall_risk_score, r.risk_level, r.explanation_reasons,
           r.declining_marks_flag, r.low_attendance_flag, r.inconsistent_assessments_flag
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN risk_assessments r ON s.id = r.student_id
  `;
  
  const queryParams: any[] = [];
  
  if (isFaculty) {
    queryStr += ` JOIN mentor_students ms ON ms.student_id = s.id WHERE ms.mentor_id = ? AND ms.status = 'ACTIVE'`;
    queryParams.push(req.user?.facultyId);
  }

  const students = await query(queryStr, queryParams);

  const detailedList = [];
  for (const s of students) {
    const analytics = await calculateStudentAnalytics(s.id);
    if (!analytics) continue;

    let reasons: string[] = [];
    try {
      reasons = s.explanation_reasons ? JSON.parse(s.explanation_reasons) : [];
    } catch (e) {
      reasons = [];
    }

    const item = {
      id: s.id,
      name: s.name,
      rollNumber: s.roll_number,
      email: s.email,
      section: s.section,
      batch: s.batch,
      gpa: analytics.currentGpa,
      percentage: analytics.overallPercentage,
      attendance: analytics.attendanceAverage,
      trend: analytics.trendStatus,
      riskLevel: s.risk_level || 'LOW',
      riskScore: s.overall_risk_score || 15,
      flags: {
        declining: Boolean(s.declining_marks_flag),
        lowAttendance: Boolean(s.low_attendance_flag),
        inconsistent: Boolean(s.inconsistent_assessments_flag)
      },
      explanationReasons: reasons,
      weakSubjectCodes: analytics.weakSubjects.map(w => w.code)
    };

    // Client/query filters
    if (search) {
      const q = String(search).toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.rollNumber.toLowerCase().includes(q)) {
        continue;
      }
    }
    if (riskLevel && riskLevel !== 'ALL' && item.riskLevel !== riskLevel) {
      continue;
    }
    if (section && section !== 'ALL' && item.section !== section) {
      continue;
    }
    if (trend && trend !== 'ALL' && item.trend !== trend) {
      continue;
    }
    if (minAttendance && item.attendance < Number(minAttendance)) {
      continue;
    }
    if (maxAttendance && item.attendance > Number(maxAttendance)) {
      continue;
    }

    detailedList.push(item);
  }

  return res.json({ students: detailedList });
});

// GET Student 360 Profile
facultyRouter.get('/students/:id/360', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const student = await queryOne('SELECT id, name, section, batch, user_id, roll_number FROM students WHERE id = ?', [id]);
  
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  // Enforce mentor access
  if (req.user?.role === 'FACULTY') {
    const assignment = await queryOne('SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ? AND status = ?', [req.user.facultyId, student.id, 'ACTIVE']);
    if (!assignment) {
      await queryOne('INSERT INTO audit_logs (id, actor, action, target) VALUES (?, ?, ?, ?)', [
        `audit_${Date.now()}`, req.user.email, 'UNAUTHORIZED_MENTOR_ACCESS_ATTEMPT', student.id
      ]);
      return res.status(403).json({ error: 'Student is not assigned to you. Access denied.' });
    }
  }

  const userRec = await queryOne('SELECT email, phone FROM users WHERE id = ?', [student.user_id]);
  const analytics = await calculateStudentAnalytics(student.id);
  const risk = await evaluateStudentRisk(student.id);
  const forecast = await generateStudentForecast(student.id);

  const alerts = await query(`
    SELECT * FROM alerts WHERE student_id = ? ORDER BY created_at DESC
  `, [student.id]);

  const interventions = await query(`
    SELECT * FROM interventions WHERE student_id = ? ORDER BY created_at DESC
  `, [student.id]);

  const timeline = await query(`
    SELECT * FROM risk_timeline WHERE student_id = ? ORDER BY created_at DESC LIMIT 20
  `, [student.id]);

  // Determine positive insights
  const achievements: string[] = [];
  if (analytics?.currentGpa && analytics.currentGpa > 8.5) achievements.push('Top Performer');
  if (analytics?.trendStatus === 'IMPROVING') achievements.push('Most Improved');
  if (analytics?.attendanceAverage && analytics.attendanceAverage >= 95) achievements.push('Consistent Performer');
  if (analytics?.subjects?.some((s: any) => s.weightedScorePercentage > 85)) achievements.push('Strong Subject Performance');

  return res.json({
    student: {
      ...student,
      email: userRec?.email,
      phone: userRec?.phone
    },
    analytics,
    risk,
    alerts,
    interventions,
    timeline,
    achievements,
    forecast
  });
});

// What-If Simulation
facultyRouter.post('/students/:id/what-if', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  if (req.user?.role === 'FACULTY') {
    const assignment = await queryOne('SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ? AND status = ?', [req.user.facultyId, id, 'ACTIVE']);
    if (!assignment) {
      return res.status(403).json({ error: 'Student is not assigned to you. Access denied.' });
    }
  }

  const {
    hypotheticalEndTermPercentage,
    targetSubjectCode,
    targetSubjectScore,
    simulatedAttendanceBonus,
    resolveOverdueAssignments
  } = req.body;

  if (hypotheticalEndTermPercentage === undefined || isNaN(Number(hypotheticalEndTermPercentage))) {
    return res.status(400).json({ error: 'hypotheticalEndTermPercentage is required and must be a valid number (0-100).' });
  }

  const result = await runWhatIfSimulation({
    studentId: id,
    hypotheticalEndTermPercentage: Number(hypotheticalEndTermPercentage),
    targetSubjectCode,
    targetSubjectScore: targetSubjectScore !== undefined ? Number(targetSubjectScore) : undefined,
    simulatedAttendanceBonus: simulatedAttendanceBonus !== undefined ? Number(simulatedAttendanceBonus) : 0,
    resolveOverdueAssignments: Boolean(resolveOverdueAssignments)
  });

  if (!result) return res.status(404).json({ error: 'Failed to run simulation for student.' });
  
  return res.json({ result });
});

// Cohort Analytics
facultyRouter.get('/cohort-analytics', async (req: AuthenticatedRequest, res: Response) => {
  const isFaculty = req.user?.role === 'FACULTY';
  
  let studentsQuery = `
    SELECT s.id, r.risk_level, r.overall_risk_score
    FROM students s
    LEFT JOIN risk_assessments r ON s.id = r.student_id
  `;
  const params: any[] = [];
  
  if (isFaculty) {
    studentsQuery += ` JOIN mentor_students ms ON ms.student_id = s.id WHERE ms.mentor_id = ? AND ms.status = 'ACTIVE'`;
    params.push(req.user?.facultyId);
  }

  const students = await query(studentsQuery, params);
  
  const distribution = {
    HIGH: students.filter(s => s.risk_level === 'HIGH').length,
    MEDIUM: students.filter(s => s.risk_level === 'MEDIUM').length,
    LOW: students.filter(s => s.risk_level === 'LOW').length
  };

  let intQuery = `SELECT count(*) as count, status FROM interventions i JOIN students s ON i.student_id = s.id`;
  if (isFaculty) {
    intQuery += ` JOIN mentor_students ms ON ms.student_id = s.id WHERE ms.mentor_id = ? AND ms.status = 'ACTIVE'`;
  }
  intQuery += ` GROUP BY status`;
  const interventionsDist = await query(intQuery, params);

  return res.json({
    totalStudents: students.length,
    distribution,
    interventionsDist
  });
});

// Get specific student profile by roll number (for mentor)
facultyRouter.get('/student-profile/:rollNumber', async (req: AuthenticatedRequest, res: Response) => {
  const { rollNumber } = req.params;
  const student = await queryOne('SELECT id, name, section, batch FROM students WHERE roll_number = ?', [rollNumber]);
  
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  // Enforce mentor access
  if (req.user?.role === 'FACULTY') {
    const assignment = await queryOne('SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ? AND status = ?', [req.user.facultyId, student.id, 'ACTIVE']);
    if (!assignment) {
      await queryOne('INSERT INTO audit_logs (id, actor, action, target) VALUES (?, ?, ?, ?)', [
        `audit_${Date.now()}`, req.user.email, 'UNAUTHORIZED_MENTOR_ACCESS_ATTEMPT', student.id
      ]);
      return res.status(403).json({ error: 'Student is not assigned to you. Access denied.' });
    }
  }

  const analytics = await calculateStudentAnalytics(student.id);
  const risk = await evaluateStudentRisk(student.id);

  const alerts = await query(`
    SELECT * FROM alerts WHERE student_id = ? ORDER BY created_at DESC
  `, [student.id]);

  const interventions = await query(`
    SELECT * FROM interventions WHERE student_id = ? ORDER BY created_at DESC
  `, [student.id]);

  return res.json({
    student,
    analytics,
    risk,
    alerts,
    interventions
  });
});

// Subject-wise aggregated analytics
facultyRouter.get('/subjects', async (_req: AuthenticatedRequest, res: Response) => {
  const subjects = await query(`
    SELECT sub.*, f.name as faculty_name
    FROM subjects sub
    LEFT JOIN faculty f ON sub.faculty_id = f.id
  `);

  const subjectStats = [];
  for (const sub of subjects) {
    const attRows = await query('SELECT percentage FROM attendance WHERE subject_id = ?', [sub.id]);
    const avgAttendance = attRows.length > 0
      ? Number((attRows.reduce((a, b) => a + b.percentage, 0) / attRows.length).toFixed(1))
      : 80;

    // Get marks average
    const marks = await query(`
      SELECT m.marks_obtained, m.max_marks
      FROM marks m
      JOIN assessments a ON m.assessment_id = a.id
      WHERE a.subject_id = ?
    `, [sub.id]);

    let avgScorePct = 72;
    if (marks.length > 0) {
      const sum = marks.reduce((acc, m) => acc + ((m.marks_obtained / m.max_marks) * 100), 0);
      avgScorePct = Number((sum / marks.length).toFixed(1));
    }

    const studentsAtRisk = await query(`
      SELECT count(DISTINCT s.student_id) as count
      FROM attendance s
      WHERE s.subject_id = ? AND s.percentage < 75
    `, [sub.id]);

    subjectStats.push({
      id: sub.id,
      code: sub.code,
      name: sub.name,
      credits: sub.credits,
      facultyName: sub.faculty_name,
      avgAttendance,
      avgScorePct,
      lowAttendanceCount: studentsAtRisk[0]?.count || 0,
      passPercentage: Number(Math.min(100, Math.max(70, avgScorePct + 12)).toFixed(1))
    });
  }

  return res.json({ subjects: subjectStats });
});

// Create Intervention Case
facultyRouter.post('/students/:id/interventions', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { issue_type, priority, notes, action_plan, follow_up_date } = req.body;
  const facultyId = req.user?.facultyId;

  if (req.user?.role === 'FACULTY' && !facultyId) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  
  if (req.user?.role === 'FACULTY') {
    const assignment = await queryOne('SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ? AND status = ?', [facultyId, id, 'ACTIVE']);
    if (!assignment) return res.status(403).json({ error: 'Access denied.' });
  }

  const caseId = `inv_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
  await execute(`
    INSERT INTO interventions (id, student_id, faculty_id, issue_type, priority, status, notes, action_plan, follow_up_date)
    VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, ?)
  `, [caseId, id, facultyId || 'fac_admin', issue_type, priority || 'Medium', notes, action_plan, follow_up_date]);

  await execute(`
    INSERT INTO intervention_activities (id, intervention_id, actor_role, action, details)
    VALUES (?, ?, ?, 'Case created', ?)
  `, [`act_${Date.now()}`, caseId, req.user?.role, `Issue: ${issue_type}`]);

  saveDb();
  return res.json({ success: true, caseId });
});

// Update Intervention Case
facultyRouter.patch('/interventions/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, priority, action_plan, notes, follow_up_date } = req.body;
  
  const existing = await queryOne('SELECT * FROM interventions WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  if (req.user?.role === 'FACULTY') {
    const assignment = await queryOne('SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ? AND status = ?', [req.user.facultyId, existing.student_id, 'ACTIVE']);
    if (!assignment) return res.status(403).json({ error: 'Access denied.' });
  }

  const updates = [];
  const params = [];
  const activityDetail = [];

  if (status && status !== existing.status) { updates.push('status = ?'); params.push(status); activityDetail.push(`Status changed to ${status}`); }
  if (priority && priority !== existing.priority) { updates.push('priority = ?'); params.push(priority); activityDetail.push(`Priority changed to ${priority}`); }
  if (action_plan && action_plan !== existing.action_plan) { updates.push('action_plan = ?'); params.push(action_plan); activityDetail.push('Action plan updated'); }
  if (notes && notes !== existing.notes) { updates.push('notes = ?'); params.push(notes); activityDetail.push('Notes added'); }
  if (follow_up_date && follow_up_date !== existing.follow_up_date) { updates.push('follow_up_date = ?'); params.push(follow_up_date); activityDetail.push(`Follow-up date set to ${follow_up_date}`); }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    await execute(`UPDATE interventions SET ${updates.join(', ')} WHERE id = ?`, params);
    
    await execute(`
      INSERT INTO intervention_activities (id, intervention_id, actor_role, action, details)
      VALUES (?, ?, ?, 'Case updated', ?)
    `, [`act_${Date.now()}`, id, req.user?.role, activityDetail.join(', ')]);
  }

  saveDb();
  return res.json({ success: true });
});

// Get Risk Explanation
facultyRouter.get('/students/:id/risk-explanation', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (req.user?.role === 'FACULTY') {
    const assignment = await queryOne('SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ? AND status = ?', [req.user.facultyId, id, 'ACTIVE']);
    if (!assignment) return res.status(403).json({ error: 'Access denied.' });
  }
  const risk = await evaluateStudentRisk(id);
  return res.json({ risk });
});

// Get Student Interventions
facultyRouter.get('/students/:id/interventions', async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (req.user?.role === 'FACULTY') {
    const assignment = await queryOne('SELECT id FROM mentor_students WHERE mentor_id = ? AND student_id = ? AND status = ?', [req.user.facultyId, id, 'ACTIVE']);
    if (!assignment) return res.status(403).json({ error: 'Access denied.' });
  }
  const interventions = await query('SELECT * FROM interventions WHERE student_id = ? ORDER BY created_at DESC', [id]);
  
  for (const inv of interventions) {
    inv.activities = await query('SELECT * FROM intervention_activities WHERE intervention_id = ? ORDER BY created_at ASC', [inv.id]);
  }
  
  return res.json({ interventions });
});
