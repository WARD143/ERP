import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest, enforceStudentOwnership } from '../auth.js';
import { calculateStudentAnalytics } from '../analytics.js';
import { evaluateStudentRisk } from '../riskEngine.js';
import { GoogleGenAI } from '@google/genai';

export const aiRouter = Router();

aiRouter.post('/insights/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  const { studentId } = req.params;
  const analytics = await calculateStudentAnalytics(studentId);
  const risk = await evaluateStudentRisk(studentId);

  if (!analytics || !risk) {
    return res.status(404).json({ error: 'Student data not found for AI analysis.' });
  }

  const promptContext = `
Student Name: ${analytics.name} (${analytics.rollNumber})
Current Semester GPA: ${analytics.currentGpa} (Overall: ${analytics.overallPercentage}%)
Previous Semester GPA: ${analytics.comparisons.prevSemesterGpa}
Attendance Average: ${analytics.attendanceAverage}%
Performance Trajectory: ${analytics.trendStatus}
Risk Classification: ${risk.riskLevel} (Overall Risk Score: ${risk.overallRiskScore}/100)
Risk Reasons: ${risk.explanationReasons.join('; ')}
Subject Breakdown:
${analytics.subjects.map(s => `- ${s.name} (${s.code}): Score ${s.weightedScorePercentage}%, Attendance ${s.attendancePercentage}%, Trend ${s.trend}, Weak Topics: ${s.weakTopics.join(', ') || 'None'}`).join('\n')}
`;

  let aiSummary = '';
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 5) {
    try {
      const ai = new GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are the lead academic counseling intelligence for an Engineering College CSE Department.
Analyze this student's data and provide a concise, highly structured 3-part diagnostic report:
1. ROOT CAUSE DIAGNOSIS: Specific diagnosis of where and why the student is struggling or accelerating.
2. HIGH-PRIORITY ACTION PROTOCOL: 3 immediate high-impact academic tasks for the next 14 days.
3. EXAM SUCCESS PROJECTION: Brief expectation for the final end-term examination.

Data:
${promptContext}

Keep tone professional, encouraging, analytical, and free of vague fluff. Output clean plain text or Markdown with bold headers.`
      });
      aiSummary = response.text || '';
    } catch (err: any) {
      console.warn('Gemini API call failed, using deterministic academic diagnostic engine:', err.message);
    }
  }

  // Fallback to rich deterministic diagnostic synthesis
  if (!aiSummary) {
    const isHigh = risk.riskLevel === 'HIGH';
    const isMedium = risk.riskLevel === 'MEDIUM';
    const weakNames = analytics.weakSubjects.map(w => w.name).join(', ') || 'No critical subjects';

    aiSummary = `### Root Cause Diagnosis
${
  isHigh
    ? `Critical divergence identified: Continuous assessment marks and attendance patterns exhibit compounding stress factors. ${risk.explanationReasons.slice(0, 2).join('. ')}. Primary friction observed in ${weakNames}.`
    : isMedium
    ? `Moderate volatility observed: While baseline conceptual mastery is intact, performance inconsistency and minor attendance drops in ${weakNames} risk degrading overall semester standing.`
    : `Optimal learning velocity: Strong academic stability maintained across all core CSE courses. Current GPA (${analytics.currentGpa}) indicates solid conceptual grasp and consistent lab execution.`
}

### High-Priority Action Protocol (Next 14 Days)
1. **Targeted Concept Remediation**: Focus immediate 45-minute revision blocks on ${analytics.weakSubjects[0]?.weakTopics[0] || 'core algorithm implementations'}.
2. **Attendance Stabilization**: Maintain 100% attendance across upcoming laboratory and lecture sessions to clear institutional margins.
3. **Continuous Assessment Sync**: Submit upcoming assignment milestones 24 hours prior to deadline to prevent last-minute continuous evaluation penalties.

### Exam Success Projection
Projected final trajectory indicates potential to achieve ${
      analytics.currentGpa >= 8.5 ? 'Distinction honors with GPA > 8.8' : analytics.currentGpa >= 7.0 ? 'Solid First Class with GPA > 7.5' : 'Clear passing standing provided remedial clinics are attended'
    }.`;
  }

  return res.json({
    studentId,
    riskLevel: risk.riskLevel,
    riskScore: risk.overallRiskScore,
    aiGeneratedReport: aiSummary
  });
});
