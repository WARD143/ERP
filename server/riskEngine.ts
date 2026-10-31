import { execute, query, queryOne, saveDb } from '../db/database.js';
import { calculateStudentAnalytics } from './analytics.js';

export interface RiskEvaluationResult {
  studentId: string;
  studentName: string;
  rollNumber: string;
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  decliningMarksFlag: boolean;
  lowAttendanceFlag: boolean;
  inconsistentAssessmentsFlag: boolean;
  weakSubjectsCount: number;
  explanationReasons: string[];
  recommendations: string[];
  calculatedAt: string;
}

export interface RiskConfiguration {
  id: string;
  minAttendanceThreshold: number;
  declinePercentageThreshold: number;
  varianceThreshold: number;
  highRiskCutoff: number;
  mediumRiskCutoff: number;
}

export async function getRiskConfiguration(): Promise<RiskConfiguration> {
  const row = await queryOne('SELECT * FROM risk_configurations LIMIT 1');
  if (!row) {
    return {
      id: 'config_default',
      minAttendanceThreshold: 75.0,
      declinePercentageThreshold: 10.0,
      varianceThreshold: 15.0,
      highRiskCutoff: 65.0,
      mediumRiskCutoff: 35.0
    };
  }

  return {
    id: row.id,
    minAttendanceThreshold: Number(row.min_attendance_threshold),
    declinePercentageThreshold: Number(row.decline_percentage_threshold),
    varianceThreshold: Number(row.variance_threshold),
    highRiskCutoff: Number(row.high_risk_cutoff),
    mediumRiskCutoff: Number(row.medium_risk_cutoff)
  };
}

export async function updateRiskConfiguration(config: Partial<RiskConfiguration>): Promise<RiskConfiguration> {
  const current = await getRiskConfiguration();
  const updated = { ...current, ...config };

  await execute(`
    UPDATE risk_configurations
    SET min_attendance_threshold = ?,
        decline_percentage_threshold = ?,
        variance_threshold = ?,
        high_risk_cutoff = ?,
        medium_risk_cutoff = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    updated.minAttendanceThreshold,
    updated.declinePercentageThreshold,
    updated.varianceThreshold,
    updated.highRiskCutoff,
    updated.mediumRiskCutoff,
    current.id
  ]);

  saveDb();
  // Recalculate risk for all students with new thresholds
  await evaluateAllStudentsRisk();
  return updated;
}

export async function evaluateStudentRisk(studentId: string): Promise<RiskEvaluationResult | null> {
  const analytics = await calculateStudentAnalytics(studentId);
  if (!analytics) return null;

  const config = await getRiskConfiguration();
  const reasons: string[] = [];

  // 1. Attendance Check
  let lowAttendanceFlag = false;
  let attendancePenalty = 0;
  if (analytics.attendanceAverage < config.minAttendanceThreshold) {
    lowAttendanceFlag = true;
    const deficit = config.minAttendanceThreshold - analytics.attendanceAverage;
    attendancePenalty = Math.min(40, deficit * 2.2);
    reasons.push(`Cumulative attendance of ${analytics.attendanceAverage}% is below mandatory threshold of ${config.minAttendanceThreshold}%`);
  }

  // Check individual subject attendance
  for (const s of analytics.subjects) {
    if (s.attendancePercentage < config.minAttendanceThreshold) {
      lowAttendanceFlag = true;
      reasons.push(`${s.name} (${s.code}) attendance is ${s.attendancePercentage}%, failing requirement`);
    }
  }

  // 2. Declining Marks Check
  let decliningMarksFlag = false;
  let declinePenalty = 0;
  const decliningSubjects = analytics.subjects.filter(s => s.trend === 'DECLINING');
  if (decliningSubjects.length > 0) {
    decliningMarksFlag = true;
    declinePenalty = Math.min(35, decliningSubjects.length * 15);
    for (const sub of decliningSubjects) {
      const drop = sub.ia1Marks > 0 ? (((sub.ia1Marks / sub.ia1Max) * 100) - ((sub.midTermMarks / sub.midTermMax) * 100)).toFixed(1) : '15';
      reasons.push(`Downward score drop of ${drop}% in ${sub.code} across successive assessments`);
    }
  }

  // 3. Inconsistent Assessments Check (Variance across marks)
  let inconsistentAssessmentsFlag = false;
  let variancePenalty = 0;
  
  if (analytics.hasDetailedSubjectData) {
    let maxStdDev = 0;
    
    for (const sub of analytics.subjects) {
      const scores = [];
      if (sub.ia1Max > 0) scores.push((sub.ia1Marks / sub.ia1Max) * 100);
      if (sub.ia2Max > 0) scores.push((sub.ia2Marks / sub.ia2Max) * 100);
      if (sub.midTermMax > 0) scores.push((sub.midTermMarks / sub.midTermMax) * 100);
      if (sub.assignmentMax > 0) scores.push((sub.assignmentScore / sub.assignmentMax) * 100);
      
      if (scores.length >= 3) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        if (stdDev > maxStdDev) maxStdDev = stdDev;
      }
    }

    if (maxStdDev > config.varianceThreshold) {
      inconsistentAssessmentsFlag = true;
      variancePenalty = Math.min(25, (maxStdDev - config.varianceThreshold) * 1.8);
      reasons.push(`Assessment performance shows significant variation (High volatility across assessments)`);
    }
  }

  // 4. Weak Subjects / Low Overall GPA Penalty
  const weakSubjects = analytics.subjects.filter(s => s.riskStatus === 'HIGH');
  const weakCount = weakSubjects.length;
  let weakPenalty = 0;
  let lowGpaFlag = false;

  if (weakCount > 0) {
    weakPenalty = Math.min(30, weakCount * 12);
    reasons.push(`${weakCount} subject(s) currently performing in the academic danger zone (<60%)`);
  } else {
    // If no weak subjects but overall GPA is low (fallback for dataset students without subject-level data)
    if (analytics.currentGpa < (config.highRiskCutoff / 10)) { // ~6.5 GPA
      lowGpaFlag = true;
      weakPenalty = 30; // maximum weak penalty
      reasons.push(`Overall academic performance (GPA ${analytics.currentGpa}) is critically below expectations`);
    } else if (analytics.currentGpa < 7.5) {
      lowGpaFlag = true;
      weakPenalty = 15;
      reasons.push(`Overall academic performance (GPA ${analytics.currentGpa}) indicates moderate risk`);
    }
  }

  // Composite Risk Score: bounded [0, 100]
  let overallRiskScore = Math.min(100, Math.round(attendancePenalty + declinePenalty + variancePenalty + weakPenalty));

  // Risk Classification
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (overallRiskScore >= config.highRiskCutoff || (lowAttendanceFlag && decliningMarksFlag) || (lowGpaFlag && analytics.currentGpa < (config.highRiskCutoff / 10))) {
    riskLevel = 'HIGH';
    if (overallRiskScore < config.highRiskCutoff) {
      overallRiskScore = config.highRiskCutoff;
    }
  } else if (overallRiskScore >= config.mediumRiskCutoff || weakCount > 0 || lowGpaFlag || lowAttendanceFlag || decliningMarksFlag) {
    riskLevel = 'MEDIUM';
    if (overallRiskScore < config.mediumRiskCutoff) {
      overallRiskScore = config.mediumRiskCutoff;
    }
  }

  if (reasons.length === 0) {
    reasons.push('Academic indicators, assessment trajectory, and lecture attendance meet all institutional benchmark criteria.');
  }

  // Recommendations Generation
  const recommendations: string[] = [];
  if (riskLevel === 'HIGH' || riskLevel === 'MEDIUM') {
    if (lowAttendanceFlag) recommendations.push('Recommend attendance monitoring and parent communication.');
    if (decliningMarksFlag) recommendations.push('Schedule mentor meeting and review recent assessments.');
    if (weakCount > 0) recommendations.push('Recommend targeted support for the weak subject(s).');
    if (lowGpaFlag) recommendations.push('Monitor next assessment and consider creating an academic improvement plan.');
    
    let totalFlags = (lowAttendanceFlag ? 1 : 0) + (decliningMarksFlag ? 1 : 0) + (weakCount > 0 ? 1 : 0) + (lowGpaFlag ? 1 : 0) + (inconsistentAssessmentsFlag ? 1 : 0);
    if (totalFlags >= 2) {
      recommendations.push('Create an academic intervention plan for multi-factor risk.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Schedule mentor meeting.');
    }
  } else {
    recommendations.push('Continue standard monitoring.');
  }

  // Persist risk assessment
  await execute(`
    INSERT INTO risk_assessments (
      id, student_id, overall_risk_score, risk_level,
      declining_marks_flag, low_attendance_flag, inconsistent_assessments_flag,
      weak_subjects_count, explanation_reasons, calculated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id) DO UPDATE SET
      overall_risk_score = excluded.overall_risk_score,
      risk_level = excluded.risk_level,
      declining_marks_flag = excluded.declining_marks_flag,
      low_attendance_flag = excluded.low_attendance_flag,
      inconsistent_assessments_flag = excluded.inconsistent_assessments_flag,
      weak_subjects_count = excluded.weak_subjects_count,
      explanation_reasons = excluded.explanation_reasons,
      calculated_at = CURRENT_TIMESTAMP
  `, [
    `risk_${studentId}`,
    studentId,
    overallRiskScore,
    riskLevel,
    decliningMarksFlag ? 1 : 0,
    lowAttendanceFlag ? 1 : 0,
    inconsistentAssessmentsFlag ? 1 : 0,
    weakCount,
    JSON.stringify(reasons)
  ]);

  // Synchronize alerts based on evaluation
  await syncAlertsForStudent(studentId, riskLevel, reasons, analytics);

  saveDb();

  return {
    studentId,
    studentName: analytics.name,
    rollNumber: analytics.rollNumber,
    overallRiskScore,
    riskLevel,
    decliningMarksFlag,
    lowAttendanceFlag,
    inconsistentAssessmentsFlag,
    weakSubjectsCount: weakCount,
    explanationReasons: reasons,
    recommendations,
    calculatedAt: new Date().toISOString()
  };
}

async function syncAlertsForStudent(
  studentId: string,
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  reasons: string[],
  analytics: any
): Promise<void> {
  // Clear unread automated alerts older than today or reset
  if (riskLevel === 'HIGH') {
    const existing = await queryOne(`
      SELECT id FROM alerts WHERE student_id = ? AND severity = 'CRITICAL' AND is_resolved = 0
    `, [studentId]);

    if (!existing) {
      await execute(`
        INSERT INTO alerts (id, student_id, severity, title, message, risk_category)
        VALUES (?, ?, 'CRITICAL', 'Urgent Academic Early Warning: High Risk Identified', ?, 'MULTIPLE_RISK_FACTORS')
      `, [
        `alert_${studentId}_${Date.now()}`,
        studentId,
        `Student shows critical indicators requiring immediate faculty counseling: ${reasons.slice(0, 2).join('. ')}`
      ]);
    }
  } else if (riskLevel === 'MEDIUM') {
    const existing = await queryOne(`
      SELECT id FROM alerts WHERE student_id = ? AND severity = 'WARNING' AND is_resolved = 0
    `, [studentId]);

    if (!existing) {
      await execute(`
        INSERT INTO alerts (id, student_id, severity, title, message, risk_category)
        VALUES (?, ?, 'WARNING', 'Academic Performance Advisory: Moderate Risk', ?, 'ACADEMIC_ADVISORY')
      `, [
        `alert_${studentId}_${Date.now()}`,
        studentId,
        `Advisory notice: ${reasons[0] || 'Inconsistency detected in ongoing assessments.'}`
      ]);
    }
  }
}

export async function evaluateAllStudentsRisk(): Promise<RiskEvaluationResult[]> {
  const students = await query('SELECT id FROM students');
  const results: RiskEvaluationResult[] = [];
  for (const s of students) {
    const res = await evaluateStudentRisk(s.id);
    if (res) results.push(res);
  }
  return results;
}
