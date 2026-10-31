import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../auth.js';
import { query } from '../../db/database.js';
import { calculateStudentAnalytics } from '../analytics.js';
import { evaluateStudentRisk } from '../riskEngine.js';
import { parse } from 'json2csv';

export const reportRouter = Router();

reportRouter.use(authenticateToken, requireRole(['FACULTY', 'ADMIN']));

reportRouter.get('/at-risk', async (req: AuthenticatedRequest, res: Response) => {
  const isFaculty = req.user?.role === 'FACULTY';
  
  let q = `
    SELECT s.roll_number, s.name, s.section,
           r.overall_risk_score, r.risk_level, r.explanation_reasons,
           f.name as mentor_name
    FROM students s
    JOIN risk_assessments r ON s.id = r.student_id
    LEFT JOIN faculty f ON s.mentor_faculty_id = f.id
  `;
  const params: any[] = [];
  
  if (isFaculty) {
    q += ` JOIN mentor_students ms ON ms.student_id = s.id WHERE ms.mentor_id = ? AND ms.status = 'ACTIVE'`;
    params.push(req.user?.facultyId);
    q += ` AND (r.risk_level = 'HIGH' OR r.risk_level = 'MEDIUM')`;
  } else {
    q += ` WHERE r.risk_level = 'HIGH' OR r.risk_level = 'MEDIUM'`;
  }

  q += ` ORDER BY r.overall_risk_score DESC`;

  const rows = await query(q, params);
  
  const mapped = rows.map(r => {
    let factors = '';
    try {
      const parsed = JSON.parse(r.explanation_reasons);
      factors = parsed.join('; ');
    } catch { factors = r.explanation_reasons; }
    return {
      'Roll Number': r.roll_number,
      'Student Name': r.name,
      'Section': r.section,
      'Risk Score': r.overall_risk_score,
      'Risk Level': r.risk_level,
      'Main Risk Factors': factors,
      'Mentor': r.mentor_name || 'Unassigned'
    };
  });

  if (req.query.export === 'csv') {
    const csv = parse(mapped);
    res.header('Content-Type', 'text/csv');
    res.attachment('at-risk-report.csv');
    return res.send(csv);
  }

  return res.json({ data: mapped });
});

reportRouter.get('/cohort', async (req: AuthenticatedRequest, res: Response) => {
  const isFaculty = req.user?.role === 'FACULTY';
  
  let q = `
    SELECT s.roll_number, s.name, s.section,
           r.overall_risk_score, r.risk_level
    FROM students s
    LEFT JOIN risk_assessments r ON s.id = r.student_id
  `;
  const params: any[] = [];
  
  if (isFaculty) {
    q += ` JOIN mentor_students ms ON ms.student_id = s.id WHERE ms.mentor_id = ? AND ms.status = 'ACTIVE'`;
    params.push(req.user?.facultyId);
  }

  const rows = await query(q, params);
  
  const summary = {
    totalStudents: rows.length,
    highRisk: rows.filter(r => r.risk_level === 'HIGH').length,
    mediumRisk: rows.filter(r => r.risk_level === 'MEDIUM').length,
    lowRisk: rows.filter(r => r.risk_level === 'LOW').length
  };

  if (req.query.export === 'csv') {
    const csv = parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('cohort-summary.csv');
    return res.send(csv);
  }

  return res.json({ summary, data: rows });
});
