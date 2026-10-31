import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../auth.js';
import { query, queryOne } from '../../db/database.js';
import fs from 'fs';
import path from 'path';

export const ouladRouter = Router();

// 1. High level dataset summary & import status
ouladRouter.get('/summary', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalEnrolments = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM oulad_students');
    const uniqueStudents = await queryOne<{ count: number }>('SELECT COUNT(DISTINCT id_student) as count FROM oulad_students');
    const totalCourses = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM oulad_courses');
    const totalAssessments = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM oulad_assessments');
    const totalSubmissions = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM oulad_student_assessments WHERE score IS NOT NULL');
    const avgScore = await queryOne<{ avg: number }>('SELECT AVG(score) as avg FROM oulad_student_assessments WHERE score IS NOT NULL');
    
    // Result breakdown
    const results = await query<{ final_result: string; count: number }>(`
      SELECT final_result, COUNT(*) as count 
      FROM oulad_students 
      GROUP BY final_result 
      ORDER BY count DESC
    `);

    // Course breakdown
    const courses = await query<{ code_module: string; code_presentation: string; enrolments: number; avg_score: number }>(`
      SELECT 
        s.code_module, 
        s.code_presentation, 
        COUNT(s.id_student) as enrolments,
        ROUND(AVG(sa.score), 2) as avg_score
      FROM oulad_students s
      LEFT JOIN oulad_assessments a ON s.code_module = a.code_module AND s.code_presentation = a.code_presentation
      LEFT JOIN oulad_student_assessments sa ON a.id_assessment = sa.id_assessment AND s.id_student = sa.id_student
      GROUP BY s.code_module, s.code_presentation
      ORDER BY enrolments DESC
      LIMIT 10
    `);

    // Load ML Metrics
    let mlEvaluation = null;
    try {
      const evalPath = path.join(process.cwd(), 'data', 'oulad', 'model_evaluation.json');
      if (fs.existsSync(evalPath)) {
        mlEvaluation = JSON.parse(fs.readFileSync(evalPath, 'utf-8'));
      }
    } catch (e) {
      // Non blocking
    }

    res.json({
      dataset: 'Open University Learning Analytics Dataset (OULAD)',
      isResearchDataset: true,
      license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      totalEnrolments: totalEnrolments?.count || 0,
      uniqueStudents: uniqueStudents?.count || 0,
      totalCourses: totalCourses?.count || 0,
      totalAssessments: totalAssessments?.count || 0,
      totalSubmissions: totalSubmissions?.count || 0,
      averageScore: avgScore?.avg ? Math.round(avgScore.avg * 10) / 10 : 0,
      finalResultDistribution: results,
      topCourses: courses,
      mlEvaluation
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve OULAD summary', details: error.message });
  }
});

// 2. Import History & Verification Status
ouladRouter.get('/import-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await query(`
      SELECT table_name, row_count, import_duration_seconds, status, imported_at 
      FROM oulad_import_history 
      ORDER BY id DESC
    `);
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch import status', details: error.message });
  }
});

// 3. Paginated Student Enrolments with Filters & Risk Classification
ouladRouter.get('/students', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const moduleFilter = req.query.module ? String(req.query.module) : null;
    const presentationFilter = req.query.presentation ? String(req.query.presentation) : null;
    const resultFilter = req.query.result ? String(req.query.result) : null;
    const search = req.query.search ? String(req.query.search).trim() : null;

    let whereClauses = ['1=1'];
    let params: any[] = [];

    if (moduleFilter) {
      whereClauses.push('s.code_module = ?');
      params.push(moduleFilter);
    }
    if (presentationFilter) {
      whereClauses.push('s.code_presentation = ?');
      params.push(presentationFilter);
    }
    if (resultFilter) {
      whereClauses.push('s.final_result = ?');
      params.push(resultFilter);
    }
    if (search) {
      whereClauses.push('CAST(s.id_student AS TEXT) LIKE ?');
      params.push(`%${search}%`);
    }

    const whereSql = whereClauses.join(' AND ');

    const totalCountRow = await queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM oulad_students s WHERE ${whereSql}
    `, params);

    const students = await query(`
      SELECT 
        s.code_module,
        s.code_presentation,
        s.id_student,
        s.gender,
        s.region,
        s.highest_education,
        s.imd_band,
        s.age_band,
        s.num_of_prev_attempts,
        s.studied_credits,
        s.disability,
        s.final_result,
        COALESCE(e.total_clicks, 0) as total_clicks,
        COALESCE(e.active_days, 0) as active_days
      FROM oulad_students s
      LEFT JOIN oulad_student_engagement e 
        ON s.code_module = e.code_module AND s.code_presentation = e.code_presentation AND s.id_student = e.id_student
      WHERE ${whereSql}
      ORDER BY s.id_student ASC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Compute dynamic, transparent risk score based on engagement, attempts, and final result
    const enriched = students.map((st: any) => {
      let riskScore = 15;
      const reasons: string[] = [];

      if (st.final_result === 'Withdrawn') {
        riskScore = 95;
        reasons.push('Student withdrew from presentation');
      } else if (st.final_result === 'Fail') {
        riskScore = 85;
        reasons.push('Documented academic failure');
      } else {
        if (st.total_clicks < 100) {
          riskScore += 45;
          reasons.push('Critically low VLE interaction (<100 clicks)');
        } else if (st.total_clicks < 500) {
          riskScore += 20;
          reasons.push('Below average VLE engagement');
        }
        if (st.active_days < 10) {
          riskScore += 20;
          reasons.push('Infrequent login pattern (<10 active days)');
        }
        if (st.num_of_prev_attempts > 0) {
          riskScore += 15;
          reasons.push(`Previous failed attempts on course (${st.num_of_prev_attempts})`);
        }
      }

      riskScore = Math.min(99, Math.max(5, riskScore));
      const riskLevel = riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'LOW';

      return {
        ...st,
        riskScore,
        riskLevel,
        riskReasons: reasons.length ? reasons : ['Normal academic pace and VLE engagement']
      };
    });

    res.json({
      page,
      limit,
      total: totalCountRow?.count || 0,
      totalPages: Math.ceil((totalCountRow?.count || 0) / limit),
      students: enriched
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to query OULAD students', details: error.message });
  }
});

// 4. Student 360 View by Anonymous OULAD ID
ouladRouter.get('/students/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = parseInt(req.params.id);
    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid OULAD student ID' });
    }

    const enrolments = await query(`
      SELECT 
        s.*,
        r.date_registration,
        r.date_unregistration,
        COALESCE(e.total_clicks, 0) as total_clicks,
        COALESCE(e.active_days, 0) as active_days,
        COALESCE(e.pre_course_clicks, 0) as pre_course_clicks,
        COALESCE(e.early_clicks, 0) as early_clicks,
        COALESCE(e.late_clicks, 0) as late_clicks
      FROM oulad_students s
      LEFT JOIN oulad_student_registrations r 
        ON s.code_module = r.code_module AND s.code_presentation = r.code_presentation AND s.id_student = r.id_student
      LEFT JOIN oulad_student_engagement e
        ON s.code_module = e.code_module AND s.code_presentation = e.code_presentation AND s.id_student = e.id_student
      WHERE s.id_student = ?
    `, [studentId]);

    if (!enrolments || enrolments.length === 0) {
      return res.status(404).json({ error: 'OULAD Student record not found' });
    }

    const assessments = await query(`
      SELECT 
        sa.id_assessment,
        a.code_module,
        a.code_presentation,
        a.assessment_type,
        a.date as cutoff_date,
        a.weight,
        sa.date_submitted,
        sa.is_banked,
        sa.score
      FROM oulad_student_assessments sa
      JOIN oulad_assessments a ON sa.id_assessment = a.id_assessment
      WHERE sa.id_student = ?
      ORDER BY a.code_module, a.code_presentation, a.date ASC
    `, [studentId]);

    const vleActivities = await query(`
      SELECT 
        code_module,
        code_presentation,
        activity_type,
        total_clicks,
        active_days_count,
        first_activity_day,
        last_activity_day
      FROM oulad_student_vle_summary
      WHERE id_student = ?
      ORDER BY total_clicks DESC
    `, [studentId]);

    res.json({
      studentId,
      enrolments,
      assessments,
      vleActivities
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve OULAD student 360 profile', details: error.message });
  }
});

// 5. Course list & Presentations
ouladRouter.get('/courses', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const courses = await query(`
      SELECT 
        c.code_module,
        c.code_presentation,
        c.module_presentation_length,
        COUNT(s.id_student) as total_students,
        SUM(CASE WHEN s.final_result = 'Pass' THEN 1 ELSE 0 END) as pass_count,
        SUM(CASE WHEN s.final_result = 'Distinction' THEN 1 ELSE 0 END) as distinction_count,
        SUM(CASE WHEN s.final_result = 'Fail' THEN 1 ELSE 0 END) as fail_count,
        SUM(CASE WHEN s.final_result = 'Withdrawn' THEN 1 ELSE 0 END) as withdrawn_count
      FROM oulad_courses c
      LEFT JOIN oulad_students s ON c.code_module = s.code_module AND c.code_presentation = s.code_presentation
      GROUP BY c.code_module, c.code_presentation
      ORDER BY c.code_module, c.code_presentation
    `);
    res.json({ courses });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch courses', details: error.message });
  }
});

// 6. Assessments summary & performance
ouladRouter.get('/assessments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const module = req.query.module ? String(req.query.module) : null;
    let whereSql = '1=1';
    let params: any[] = [];
    if (module) {
      whereSql = 'a.code_module = ?';
      params.push(module);
    }

    const assessments = await query(`
      SELECT 
        a.id_assessment,
        a.code_module,
        a.code_presentation,
        a.assessment_type,
        a.date,
        a.weight,
        COUNT(sa.id_student) as submissions_count,
        ROUND(AVG(sa.score), 1) as avg_score,
        MIN(sa.score) as min_score,
        MAX(sa.score) as max_score
      FROM oulad_assessments a
      LEFT JOIN oulad_student_assessments sa ON a.id_assessment = sa.id_assessment AND sa.score IS NOT NULL
      WHERE ${whereSql}
      GROUP BY a.id_assessment
      ORDER BY a.code_module, a.code_presentation, a.date ASC
      LIMIT 100
    `, params);

    res.json({ assessments });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch assessments', details: error.message });
  }
});

// 7. VLE Activity breakdown across the dataset
ouladRouter.get('/engagement', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activityStats = await query(`
      SELECT 
        activity_type,
        SUM(total_clicks) as total_clicks,
        COUNT(DISTINCT id_student) as active_students,
        ROUND(AVG(total_clicks), 1) as avg_clicks_per_student
      FROM oulad_student_vle_summary
      GROUP BY activity_type
      ORDER BY total_clicks DESC
    `);

    res.json({ activityStats });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch engagement stats', details: error.message });
  }
});
