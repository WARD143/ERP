export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN' | 'PARENT';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  department: string;
  rollNumber?: string;
  studentId?: string;
  facultyId?: string;
}

export interface SubjectAnalytics {
  subjectId: string;
  code: string;
  name: string;
  credits: number;
  facultyName: string;
  ia1Marks: number;
  ia1Max: number;
  ia2Marks: number;
  ia2Max: number;
  midTermMarks: number;
  midTermMax: number;
  assignmentScore: number;
  assignmentMax: number;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  weightedScorePercentage: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  riskStatus: 'LOW' | 'MEDIUM' | 'HIGH';
  weakTopics: string[];
}

export interface StudentAnalytics {
  studentId: string;
  rollNumber: string;
  name: string;
  section: string;
  batch: string;
  semesterName: string;
  currentGpa: number;
  overallPercentage: number;
  attendanceAverage: number;
  rankInSection: number;
  totalStudentsInSection: number;
  trendStatus: 'IMPROVING' | 'STABLE' | 'DECLINING';
  hasDetailedSubjectData?: boolean;
  subjects: SubjectAnalytics[];
  weakSubjects: SubjectAnalytics[];
  strongSubjects: SubjectAnalytics[];
  comparisons: {
    studentGpa: number;
    sectionAverageGpa: number;
    highestSectionGpa: number;
    prevSemesterGpa: number;
    gpaDelta: number;
    attendanceDelta: number;
  };
}

export interface RiskAssessment {
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
  calculatedAt: string;
}

export interface Alert {
  id: string;
  student_id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  risk_category: string;
  is_read: number;
  is_resolved: number;
  resolution_notes?: string;
  created_at: string;
  student_name?: string;
  roll_number?: string;
}

export interface Recommendation {
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

export interface ForecastDataPoint {
  stage: string;
  actualPercentage?: number;
  projectedPercentage?: number;
  lowerConfidence?: number;
  upperConfidence?: number;
}

export interface SubjectForecast {
  subjectCode: string;
  subjectName: string;
  currentScorePercentage: number;
  projectedFinalPercentage: number;
  projectedGrade: string;
  trajectory: 'UPWARD' | 'STABLE' | 'DOWNWARD';
  riskOfFailure: 'LOW' | 'MODERATE' | 'HIGH';
}

export interface ForecastResult {
  studentId: string;
  hasSufficientData: boolean;
  message?: string;
  currentGpa: number;
  projectedFinalGpa: number;
  confidenceInterval: {
    minGpa: number;
    maxGpa: number;
  };
  trajectoryPoints: ForecastDataPoint[];
  subjectForecasts: SubjectForecast[];
  modelEvaluation: {
    algorithm: string;
    meanAbsoluteError: number;
    rSquared: number;
    trainingSampleSize: number;
  };
}

export interface WhatIfSimulationResult {
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

export interface Intervention {
  id: string;
  student_id: string;
  student_name?: string;
  roll_number?: string;
  faculty_id: string;
  faculty_name?: string;
  type: 'COUNSELING' | 'REMEDIAL_CLASS' | 'PEER_TUTORING' | 'ATTENDANCE_WARNING' | 'PARENT_CONTACT';
  notes: string;
  target_date?: string;
  status: 'SCHEDULED' | 'CONDUCTED' | 'FOLLOW_UP';
  created_at: string;
}

export interface RiskConfiguration {
  id: string;
  minAttendanceThreshold: number;
  declinePercentageThreshold: number;
  varianceThreshold: number;
  highRiskCutoff: number;
  mediumRiskCutoff: number;
}

export interface UCIRecord {
  id: number;
  subject_course: string;
  school: string;
  sex: string;
  age: number;
  address: string;
  famsize: string;
  pstatus: string;
  medu: number;
  fedu: number;
  mjob: string;
  fjob: string;
  reason: string;
  guardian: string;
  traveltime: number;
  studytime: number;
  failures: number;
  schoolsup: string;
  famsup: string;
  paid: string;
  activities: string;
  nursery: string;
  higher: string;
  internet: string;
  romantic: string;
  famrel: number;
  freetime: number;
  goout: number;
  dalc: number;
  walc: number;
  health: number;
  absences: number;
  g1: number;
  g2: number;
  g3: number;
  risk_status: 'LOW' | 'MEDIUM' | 'HIGH';
  final_score_pct: number;
}

export interface UCIDatasetAnalytics {
  overview: {
    totalRecords: number;
    mathStudents: number;
    portugueseStudents: number;
    averageG1: number;
    averageG2: number;
    averageG3: number;
    averageStudyTimeLevel: number;
    averageAbsences: number;
    averageFailures: number;
  };
  riskDistribution: Array<{
    risk_status: string;
    count: number;
    percentage: number;
  }>;
  studyImpact: Array<{
    studytime: number;
    student_count: number;
    avg_final_grade: number;
    avg_score_pct: number;
  }>;
  alcoholImpact: Array<{
    weekend_alcohol: number;
    count: number;
    avg_final_grade: number;
    avg_absences: number;
  }>;
  failureImpact: Array<{
    failures: number;
    count: number;
    avg_final_grade: number;
    high_risk_pct: number;
  }>;
}

export interface UCIPredictionResult {
  predictedG3: number;
  predictedPercentage: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  contributingFactors?: Array<{
    factor: string;
    weight: string;
    value: string;
  }>;
}
