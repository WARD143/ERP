import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest, enforceStudentOwnership } from '../auth.js';
import { calculateStudentAnalytics } from '../analytics.js';
import { evaluateStudentRisk } from '../riskEngine.js';
import { generateStudentRecommendations } from '../recommendations.js';
import { generateStudentForecast } from '../forecaster.js';
import { runWhatIfSimulation } from '../whatIf.js';
import { query, queryOne } from '../../db/database.js';

export const studentRouter = Router();

// Get analytics for logged-in student
studentRouter.get('/overview', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.user?.studentId;
  if (!studentId) {
    return res.status(400).json({ error: 'User is not linked to a student record.' });
  }

  const analytics = await calculateStudentAnalytics(studentId);
  const risk = await evaluateStudentRisk(studentId);
  const recommendations = await generateStudentRecommendations(studentId);
  const forecast = await generateStudentForecast(studentId);

  const alerts = await query(`
    SELECT * FROM alerts WHERE student_id = ? ORDER BY created_at DESC
  `, [studentId]);

  return res.json({
    analytics,
    risk,
    recommendations,
    forecast,
    alerts
  });
});

// Specific student analytics with privacy guard
studentRouter.get('/:studentId/analytics', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.params.studentId || req.user!.studentId!;
  const analytics = await calculateStudentAnalytics(studentId);
  if (!analytics) return res.status(404).json({ error: 'Student analytics not found.' });
  return res.json({ analytics });
});

// Risk status
studentRouter.get('/:studentId/risk', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.params.studentId || req.user!.studentId!;
  const risk = await evaluateStudentRisk(studentId);
  if (!risk) return res.status(404).json({ error: 'Risk assessment not found.' });
  return res.json({ risk });
});

// Alerts
studentRouter.get('/:studentId/alerts', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.params.studentId || req.user!.studentId!;
  const alerts = await query(`
    SELECT * FROM alerts WHERE student_id = ? ORDER BY created_at DESC
  `, [studentId]);
  return res.json({ alerts });
});

// Recommendations
studentRouter.get('/:studentId/recommendations', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.params.studentId || req.user!.studentId!;
  const recommendations = await generateStudentRecommendations(studentId);
  return res.json({ recommendations });
});

// Forecasting
studentRouter.get('/:studentId/forecast', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.params.studentId || req.user!.studentId!;
  const forecast = await generateStudentForecast(studentId);
  return res.json({ forecast });
});

// What-If Simulation
studentRouter.post('/:studentId/what-if', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.params.studentId || req.user!.studentId!;
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
    studentId,
    hypotheticalEndTermPercentage: Number(hypotheticalEndTermPercentage),
    targetSubjectCode,
    targetSubjectScore: targetSubjectScore !== undefined ? Number(targetSubjectScore) : undefined,
    simulatedAttendanceBonus: simulatedAttendanceBonus !== undefined ? Number(simulatedAttendanceBonus) : 0,
    resolveOverdueAssignments: Boolean(resolveOverdueAssignments)
  });

  if (!result) return res.status(404).json({ error: 'Failed to run simulation for student.' });
  return res.json({ simulation: result });
});
