import { execute, query, saveDb } from '../db/database.js';
import { calculateStudentAnalytics } from './analytics.js';
import { evaluateStudentRisk } from './riskEngine.js';

export interface ActionableRecommendation {
  id: string;
  studentId: string;
  subjectCode?: string;
  subjectName?: string;
  category: 'SUBJECT_WEAKNESS' | 'ATTENDANCE_CRITICAL' | 'ASSIGNMENT_INCONSISTENCY' | 'EXAM_PREPARATION' | 'FACULTY_CONSULTATION';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  actionableSteps: string[];
  rationale: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export async function generateStudentRecommendations(studentId: string): Promise<ActionableRecommendation[]> {
  const analytics = await calculateStudentAnalytics(studentId);
  if (!analytics) return [];

  const risk = await evaluateStudentRisk(studentId);
  const recommendations: ActionableRecommendation[] = [];

  // 1. Weak Subjects Focus
  for (const sub of analytics.weakSubjects) {
    const priority = sub.riskStatus === 'HIGH' ? 'HIGH' : 'MEDIUM';
    const title = `Targeted Remediation: ${sub.name} (${sub.code})`;
    const actionableSteps = [
      `Complete guided problem sets for ${sub.weakTopics.length > 0 ? sub.weakTopics.slice(0, 2).join(' and ') : 'core foundational concepts'}.`,
      `Schedule a 20-minute doubt-clearing clinic with ${sub.facultyName}.`,
      `Form or join a peer-study circle before the upcoming End-Term exam.`
    ];
    const rationale = `Current internal performance is ${sub.weightedScorePercentage}% with a ${sub.trend.toLowerCase()} trend. Focused effort is needed to prevent semester grade degradation.`;

    recommendations.push({
      id: `rec_${studentId}_${sub.code}`,
      studentId,
      subjectCode: sub.code,
      subjectName: sub.name,
      category: 'SUBJECT_WEAKNESS',
      priority,
      title,
      actionableSteps,
      rationale,
      status: 'PENDING'
    });
  }

  // 2. Attendance Warning & Recovery Plan
  for (const sub of analytics.subjects) {
    if (sub.attendancePercentage < 75.0) {
      // Calculate classes needed to reach 75%
      // (attended + x) / (total + x) >= 0.75 => x >= (0.75 * total - attended) / 0.25
      const classesNeeded = Math.max(1, Math.ceil((0.75 * sub.totalClasses - sub.attendedClasses) / 0.25));
      recommendations.push({
        id: `rec_att_${studentId}_${sub.code}`,
        studentId,
        subjectCode: sub.code,
        subjectName: sub.name,
        category: 'ATTENDANCE_CRITICAL',
        priority: sub.attendancePercentage < 65 ? 'HIGH' : 'MEDIUM',
        title: `Attendance Recovery Plan for ${sub.code}`,
        actionableSteps: [
          `Attend the next ${classesNeeded} consecutive scheduled classes without absence to restore eligibility.`,
          `Submit medical/official duty certificates to the CSE Department office if absences were excused.`,
          `Confirm lab attendance logs with ${sub.facultyName}.`
        ],
        rationale: `Current attendance is ${sub.attendancePercentage}% (${sub.attendedClasses}/${sub.totalClasses} classes). Institutional policy mandates minimum 75% for semester exam hall ticket eligibility.`,
        status: 'PENDING'
      });
    }
  }

  // 3. Assignment & Continuous Evaluation Consistency
  const incompleteAssignments = await query(`
    SELECT a.*, sub.code, sub.name as subject_name
    FROM assignments a
    JOIN subjects sub ON a.subject_id = sub.id
    WHERE a.student_id = ? AND a.submission_status IN ('MISSED', 'LATE')
  `, [studentId]);

  if (incompleteAssignments.length > 0) {
    recommendations.push({
      id: `rec_asg_${studentId}`,
      studentId,
      category: 'ASSIGNMENT_INCONSISTENCY',
      priority: 'HIGH',
      title: 'Resolve Lab & Assignment Backlog',
      actionableSteps: [
        `Complete and submit overdue assignments for ${incompleteAssignments.map(a => a.code).slice(0, 2).join(', ')}.`,
        `Request permission for retrospective lab evaluation during makeup hours.`,
        `Set up a calendar alert 48 hours prior to future assignment deadlines.`
      ],
      rationale: `${incompleteAssignments.length} assignment(s) were submitted late or missed, directly suppressing continuous evaluation scores.`,
      status: 'PENDING'
    });
  }

  // 3.5 Inconsistent Assessment Detection
  if (risk && risk.inconsistentAssessmentsFlag) {
    recommendations.push({
      id: `rec_inc_${studentId}`,
      studentId,
      category: 'ASSIGNMENT_INCONSISTENCY',
      priority: 'MEDIUM',
      title: 'Assessment Consistency Review',
      actionableSteps: [
        'Review assessment consistency with the student.',
        'Identify possible learning gaps or test-taking anxiety issues.',
        'Consider alternative formative assessment strategies.'
      ],
      rationale: 'Assessment performance shows significant variation across different evaluations.',
      status: 'PENDING'
    });
  }

  // 4. If student is performing well
  if (recommendations.length === 0) {
    recommendations.push({
      id: `rec_high_${studentId}`,
      studentId,
      category: 'EXAM_PREPARATION',
      priority: 'LOW',
      title: 'Advanced Capstone & Honors Track Preparation',
      actionableSteps: [
        'Maintain current revision cadence and assist peers in mentoring sessions.',
        'Explore optional honors seminar papers and research publications in Machine Learning & Systems.',
        'Participate in the upcoming Department Hackathon.'
      ],
      rationale: 'Overall performance (GPA: ' + analytics.currentGpa + ') is consistent with top-decile trajectory.',
      status: 'PENDING'
    });
  }

  // Persist into recommendations table
  for (const r of recommendations) {
    const existing = await query(`SELECT id FROM recommendations WHERE id = ?`, [r.id]);
    if (existing.length === 0) {
      await execute(`
        INSERT INTO recommendations (id, student_id, category, priority, title, actionable_steps, rationale, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        r.id,
        r.studentId,
        r.category,
        r.priority,
        r.title,
        JSON.stringify(r.actionableSteps),
        r.rationale,
        r.status
      ]);
    }
  }

  saveDb();
  return recommendations;
}
