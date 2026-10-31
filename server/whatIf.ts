import { calculateStudentAnalytics } from './analytics.js';
import { getRiskConfiguration } from './riskEngine.js';

export interface WhatIfInput {
  studentId: string;
  hypotheticalEndTermPercentage: number; // 0 to 100
  targetSubjectCode?: string;
  targetSubjectScore?: number;
  simulatedAttendanceBonus?: number; // percentage points to add, e.g. +5%
  resolveOverdueAssignments?: boolean;
}

export interface WhatIfResult {
  studentId: string;
  isHypotheticalScenario: true;
  scenarioDescription: string;
  baseline: {
    gpa: number;
    percentage: number;
    attendanceAverage: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  simulated: {
    gpa: number;
    percentage: number;
    attendanceAverage: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    gpaGain: number;
    percentageGain: number;
  };
  targetsNeeded: {
    scoreForDistinctionGpa8_5: number | null;
    scoreForFirstClassGpa7_0: number | null;
  };
  subjectProjections: Array<{
    code: string;
    name: string;
    baselinePercentage: number;
    simulatedPercentage: number;
    delta: number;
  }>;
}

export async function runWhatIfSimulation(input: WhatIfInput): Promise<WhatIfResult | null> {
  const analytics = await calculateStudentAnalytics(input.studentId);
  if (!analytics) return null;

  const config = await getRiskConfiguration();

  // Baseline figures
  const baselineGpa = analytics.currentGpa;
  const baselinePct = analytics.overallPercentage;
  const baselineAtt = analytics.attendanceAverage;

  // Determine baseline risk
  let baselineRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (baselineAtt < config.minAttendanceThreshold || analytics.subjects.some(s => s.riskStatus === 'HIGH')) {
    baselineRisk = baselineAtt < 65 ? 'HIGH' : 'MEDIUM';
  }

  // Calculate simulated subject percentages
  // Final Semester Grade = (Continuous Internal Assessments * 0.40) + (End Term Exam * 0.60)
  const targetEndTerm = Math.max(0, Math.min(100, input.hypotheticalEndTermPercentage));
  const attendanceBonus = Math.max(0, Math.min(30, input.simulatedAttendanceBonus || 0));

  let simulatedTotalScore = 0;
  let totalCredits = 0;

  const subjectProjections = analytics.subjects.map(sub => {
    let subEndTerm = targetEndTerm;
    if (input.targetSubjectCode && sub.code === input.targetSubjectCode && input.targetSubjectScore !== undefined) {
      subEndTerm = Math.max(0, Math.min(100, input.targetSubjectScore));
    }

    let internalScore = sub.weightedScorePercentage;
    if (input.resolveOverdueAssignments) {
      // simulate assignment recovery: boost internal score up to +8%
      internalScore = Math.min(100, internalScore + 6.5);
    }

    // Combined: 40% internals + 60% end term
    const simSubPct = Number((internalScore * 0.40 + subEndTerm * 0.60).toFixed(1));
    simulatedTotalScore += (simSubPct * sub.credits);
    totalCredits += sub.credits;

    return {
      code: sub.code,
      name: sub.name,
      baselinePercentage: sub.weightedScorePercentage,
      simulatedPercentage: simSubPct,
      delta: Number((simSubPct - sub.weightedScorePercentage).toFixed(1))
    };
  });

  const simulatedPercentage = Number((simulatedTotalScore / (totalCredits || 1)).toFixed(1));
  const simulatedGpa = Number((simulatedPercentage / 9.5).toFixed(2));
  const simulatedAttendance = Number(Math.min(100, baselineAtt + attendanceBonus).toFixed(1));

  // Determine simulated risk level
  let simulatedRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (simulatedAttendance < config.minAttendanceThreshold || simulatedPercentage < 60) {
    simulatedRisk = simulatedAttendance < 65 || simulatedPercentage < 50 ? 'HIGH' : 'MEDIUM';
  }

  // Calculate target scores needed for milestones
  // To get GPA 8.5 (approx 80.75%): 80.75 = internal*0.40 + targetEndTerm*0.60
  // targetEndTerm = (80.75 - internal*0.40) / 0.60
  const reqFor8_5 = (8.5 * 9.5 - baselinePct * 0.40) / 0.60;
  const scoreForDistinction = reqFor8_5 <= 100 ? Number(Math.max(0, reqFor8_5).toFixed(1)) : null;

  // For First Class GPA 7.0 (66.5%)
  const reqFor7_0 = (7.0 * 9.5 - baselinePct * 0.40) / 0.60;
  const scoreForFirstClass = reqFor7_0 <= 100 ? Number(Math.max(0, reqFor7_0).toFixed(1)) : null;

  return {
    studentId: input.studentId,
    isHypotheticalScenario: true,
    scenarioDescription: `Hypothetical Simulation: Target End-Term Score ${targetEndTerm}% ${attendanceBonus > 0 ? `with +${attendanceBonus}% attendance recovery` : ''} ${input.resolveOverdueAssignments ? 'and 100% assignment backlog clearance' : ''}`,
    baseline: {
      gpa: baselineGpa,
      percentage: baselinePct,
      attendanceAverage: baselineAtt,
      riskLevel: baselineRisk
    },
    simulated: {
      gpa: simulatedGpa,
      percentage: simulatedPercentage,
      attendanceAverage: simulatedAttendance,
      riskLevel: simulatedRisk,
      gpaGain: Number((simulatedGpa - baselineGpa).toFixed(2)),
      percentageGain: Number((simulatedPercentage - baselinePct).toFixed(1))
    },
    targetsNeeded: {
      scoreForDistinctionGpa8_5: scoreForDistinction,
      scoreForFirstClassGpa7_0: scoreForFirstClass
    },
    subjectProjections
  };
}
