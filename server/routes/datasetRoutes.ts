import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../db/database.js';

export const datasetRouter = Router();

// GET /api/dataset/records - Paginated and filtered records
datasetRouter.get('/records', async (req: Request, res: Response) => {
  try {
    const course = req.query.course as string;
    const school = req.query.school as string;
    const risk = req.query.risk as string;
    const search = (req.query.search as string || '').toLowerCase().trim();
    const limit = parseInt(req.query.limit as string) || 25;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (course && course !== 'ALL') {
      whereClauses.push('subject_course = ?');
      params.push(course);
    }
    if (school && school !== 'ALL') {
      whereClauses.push('school = ?');
      params.push(school);
    }
    if (risk && risk !== 'ALL') {
      whereClauses.push('risk_status = ?');
      params.push(risk);
    }
    if (search) {
      whereClauses.push('(LOWER(mjob) LIKE ? OR LOWER(fjob) LIKE ? OR LOWER(reason) LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await queryOne(`SELECT COUNT(*) as total FROM uci_student_records ${whereSql}`, params);
    const total = countRow ? countRow.total : 0;

    const records = await query(
      `SELECT * FROM uci_student_records ${whereSql} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch UCI dataset records' });
  }
});

// GET /api/dataset/analytics - Summary stats & ML correlations
datasetRouter.get('/analytics', async (_req: Request, res: Response) => {
  try {
    const totalRow = await queryOne('SELECT COUNT(*) as total FROM uci_student_records');
    const mathCount = await queryOne("SELECT COUNT(*) as count FROM uci_student_records WHERE subject_course = 'Mathematics'");
    const porCount = await queryOne("SELECT COUNT(*) as count FROM uci_student_records WHERE subject_course = 'Portuguese'");
    const avgStats = await queryOne(`
      SELECT 
        ROUND(AVG(g1), 1) as avg_g1,
        ROUND(AVG(g2), 1) as avg_g2,
        ROUND(AVG(g3), 1) as avg_g3,
        ROUND(AVG(studytime), 1) as avg_studytime,
        ROUND(AVG(absences), 1) as avg_absences,
        ROUND(AVG(failures), 1) as avg_failures
      FROM uci_student_records
    `);

    const riskDist = await query(`
      SELECT risk_status, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM uci_student_records), 1) as percentage
      FROM uci_student_records
      GROUP BY risk_status
    `);

    // Performance by study time (1: <2h, 2: 2-5h, 3: 5-10h, 4: >10h)
    const studyImpact = await query(`
      SELECT 
        studytime, 
        COUNT(*) as student_count, 
        ROUND(AVG(g3), 1) as avg_final_grade,
        ROUND(AVG(final_score_pct), 1) as avg_score_pct
      FROM uci_student_records
      GROUP BY studytime
      ORDER BY studytime ASC
    `);

    // Alcohol consumption impact (Walc: 1 to 5)
    const alcoholImpact = await query(`
      SELECT 
        walc as weekend_alcohol, 
        COUNT(*) as count, 
        ROUND(AVG(g3), 1) as avg_final_grade,
        ROUND(AVG(absences), 1) as avg_absences
      FROM uci_student_records
      GROUP BY walc
      ORDER BY walc ASC
    `);

    // Past failures impact on G3
    const failureImpact = await query(`
      SELECT 
        failures, 
        COUNT(*) as count, 
        ROUND(AVG(g3), 1) as avg_final_grade,
        ROUND(SUM(CASE WHEN risk_status = 'HIGH' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as high_risk_pct
      FROM uci_student_records
      GROUP BY failures
      ORDER BY failures ASC
    `);

    res.json({
      overview: {
        totalRecords: totalRow?.total || 0,
        mathStudents: mathCount?.count || 0,
        portugueseStudents: porCount?.count || 0,
        averageG1: avgStats?.avg_g1 || 0,
        averageG2: avgStats?.avg_g2 || 0,
        averageG3: avgStats?.avg_g3 || 0,
        averageStudyTimeLevel: avgStats?.avg_studytime || 0,
        averageAbsences: avgStats?.avg_absences || 0,
        averageFailures: avgStats?.avg_failures || 0
      },
      riskDistribution: riskDist,
      studyImpact,
      alcoholImpact,
      failureImpact
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
});

// POST /api/dataset/predict-risk - Live ML heuristic prediction
datasetRouter.post('/predict-risk', async (req: Request, res: Response) => {
  try {
    const {
      studytime = 2,
      failures = 0,
      absences = 4,
      g1 = 12,
      g2 = 12,
      schoolsup = 'no',
      higher = 'yes',
      walc = 1
    } = req.body;

    // Linear regression heuristic derived from dataset weights
    // G3 ~ 0.15*G1 + 0.70*G2 + 0.35*studytime - 0.95*failures - 0.05*absences + (higher == 'yes' ? 0.8 : 0) - (walc >= 4 ? 0.6 : 0)
    let predictedG3 = (0.18 * Number(g1)) + (0.68 * Number(g2)) + (0.35 * Number(studytime)) - (0.95 * Number(failures)) - (0.04 * Number(absences));
    if (higher === 'yes') predictedG3 += 0.75;
    if (schoolsup === 'yes') predictedG3 -= 0.4; // schoolsup is generally assigned to struggling students
    if (Number(walc) >= 4) predictedG3 -= 0.6;

    predictedG3 = Math.max(0, Math.min(20, Math.round(predictedG3 * 10) / 10));

    let riskLevel = 'LOW';
    let recommendation = 'Performance is consistently on track. Encourage advanced learning and competitive challenges.';

    if (predictedG3 < 10) {
      riskLevel = 'HIGH';
      recommendation = 'CRITICAL: High risk of failing final examination (G3 < 10). Prescribe mandatory remedial counseling, reduce absenteeism, and review period evaluations.';
    } else if (predictedG3 <= 13) {
      riskLevel = 'MEDIUM';
      recommendation = 'MODERATE RISK: Borderline score trajectory. Recommend peer tutoring, increasing weekly study hours to >5 hrs, and tracking formative assessments.';
    }

    res.json({
      predictedG3,
      predictedPercentage: Math.round((predictedG3 / 20) * 100),
      riskLevel,
      recommendation,
      contributingFactors: [
        { factor: 'Period 2 Grade (G2)', weight: 'Primary Driver (68%)', value: `${g2}/20` },
        { factor: 'Period 1 Grade (G1)', weight: 'Secondary Driver (18%)', value: `${g1}/20` },
        { factor: 'Past Failures', weight: 'High Negative Penalty', value: `${failures} failures` },
        { factor: 'Weekly Study Time', weight: 'Positive Boost', value: `Level ${studytime}` },
        { factor: 'Absences', weight: 'Negative Drag', value: `${absences} days` }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Prediction failed' });
  }
});
