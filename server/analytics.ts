import { query, queryOne } from '../db/database.js';

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

export interface StudentOverviewAnalytics {
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
  assignmentAnalytics?: {
    totalAssignments: number;
    submitted: number;
    missing: number;
    submissionRate: number;
    averageScore: number;
  };
}

export async function calculateStudentAnalytics(studentId: string): Promise<StudentOverviewAnalytics | null> {
  const student = await queryOne(`
    SELECT s.*, u.email, u.department, sem.name as semester_name, sem.academic_year
    FROM students s
    JOIN users u ON s.user_id = u.id
    JOIN semesters sem ON s.current_semester_id = sem.id
    WHERE s.id = ?
  `, [studentId]);

  if (!student) return null;

  // Fetch subjects for current semester
  const subjects = await query(`
    SELECT sub.*, f.name as faculty_name
    FROM subjects sub
    LEFT JOIN faculty f ON sub.faculty_id = f.id
    WHERE sub.semester_id = ?
  `, [student.current_semester_id]);

  const prevSemRecord = await queryOne(`
    SELECT gpa, percentage, attendance_average
    FROM performance_records
    WHERE student_id = ? AND semester_id = 'sem_4'
  `, [studentId]);

  const prevGpa = prevSemRecord?.gpa || 7.5;
  const prevAtt = prevSemRecord?.attendance_average || 80.0;

  const subjectAnalyticsList: SubjectAnalytics[] = [];
  let totalWeightedScoreSum = 0;
  let totalCreditsSum = 0;
  let totalAttendanceSum = 0;
  let studentHasAnyMarks = false;

  for (const sub of subjects) {
    // Fetch marks for this student and subject
    const marksList = await query(`
      SELECT m.*, a.type, a.name as assessment_name, a.weightage, a.max_marks as official_max
      FROM assessments a
      LEFT JOIN marks m ON a.id = m.assessment_id AND m.student_id = ?
      WHERE a.subject_id = ?
    `, [studentId, sub.id]);

    let ia1 = 0, ia1Max = 30;
    let ia2 = 0, ia2Max = 30;
    let mid = 0, midMax = 50;
    let asgTotal = 0, asgMax = 40;

    let hasAnyMarks = false;

    for (const m of marksList) {
      if (m.marks_obtained != null) {
        hasAnyMarks = true;
      }
      const val = m.marks_obtained ?? 0;
      if (m.type === 'INTERNAL_1') {
        ia1 = val;
        ia1Max = m.max_marks || 30;
      } else if (m.type === 'INTERNAL_2') {
        ia2 = val;
        ia2Max = m.max_marks || 30;
      } else if (m.type === 'MID_TERM') {
        mid = val;
        midMax = m.max_marks || 50;
      } else if (m.type === 'ASSIGNMENT') {
        asgTotal += val;
      }
    }

    // Attendance
    const att = await queryOne(`
      SELECT * FROM attendance WHERE student_id = ? AND subject_id = ?
    `, [studentId, sub.id]);

    let totalClasses = 48;
    let attendedClasses = 0;
    let attPct = 0;

    if (att) {
      totalClasses = att.total_classes || 48;
      attendedClasses = att.attended_classes || 0;
      attPct = Number(att.percentage.toFixed(1));
    }

    totalAttendanceSum += attPct;

    // Calculate normalized percentage across available assessments
    // IA1 (25%), IA2 (25%), MidTerm (35%), Assignments (15%)
    const ia1Pct = (ia1 / ia1Max) * 100;
    const ia2Pct = (ia2 / ia2Max) * 100;
    const midPct = (mid / midMax) * 100;
    const asgPct = asgMax > 0 ? (asgTotal / asgMax) * 100 : 0;

    let weightedScorePct = 0;
    if (hasAnyMarks) {
      studentHasAnyMarks = true;
      weightedScorePct = Number(((ia1Pct * 0.25) + (ia2Pct * 0.25) + (midPct * 0.35) + (asgPct * 0.15)).toFixed(1));
    }

    // Trend detection
    let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
    if (hasAnyMarks) {
      const delta = midPct - ia1Pct;
      if (delta >= 6) trend = 'IMPROVING';
      else if (delta <= -6) trend = 'DECLINING';
    }

    // Risk Status for subject
    let riskStatus: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const weakTopics: string[] = [];

    if (hasAnyMarks) {
      if (weightedScorePct < 50 || attPct < 65 || (trend === 'DECLINING' && weightedScorePct < 60)) {
        riskStatus = 'HIGH';
      } else if (weightedScorePct < 65 || attPct < 75 || trend === 'DECLINING') {
        riskStatus = 'MEDIUM';
      }

      // Weak topics identification based on subject
      if (weightedScorePct < 60) {
        if (sub.code === 'CS301') weakTopics.push('Dynamic Programming', 'Graph Shortest Paths');
        else if (sub.code === 'CS302') weakTopics.push('Query Optimization & Indexing', 'ACID Transactions');
        else if (sub.code === 'CS303') weakTopics.push('Deadlock Avoidance', 'Virtual Memory Page Replacement');
        else if (sub.code === 'CS304') weakTopics.push('TCP Congestion Control', 'BGP Routing');
        else if (sub.code === 'CS305') weakTopics.push('Gradient Descent Optimization', 'Backpropagation');
      }
      if (attPct < 75 && attPct > 0) {
        weakTopics.push(`Attendance Shortfall (${attPct}% vs 75% required)`);
      }
      if (asgPct < 60) {
        weakTopics.push('Incomplete / Late Laboratory Submissions');
      }
    }

    subjectAnalyticsList.push({
      subjectId: sub.id,
      code: sub.code,
      name: sub.name,
      credits: sub.credits,
      facultyName: sub.faculty_name || 'Faculty Mentor',
      ia1Marks: ia1,
      ia1Max,
      ia2Marks: ia2,
      ia2Max,
      midTermMarks: mid,
      midTermMax: midMax,
      assignmentScore: asgTotal,
      assignmentMax: asgMax,
      totalClasses,
      attendedClasses,
      attendancePercentage: attPct,
      weightedScorePercentage: weightedScorePct,
      trend,
      riskStatus,
      weakTopics
    });

    totalWeightedScoreSum += (weightedScorePct * sub.credits);
    totalCreditsSum += sub.credits;
  }

  let overallPercentage = 0;
  let currentGpa = 0;
  let attendanceAverage = 0;
  let overallTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';

  if (studentHasAnyMarks) {
    overallPercentage = Number((totalWeightedScoreSum / (totalCreditsSum || 1)).toFixed(1));
    currentGpa = Number((overallPercentage / 9.5).toFixed(2));
    attendanceAverage = Number((totalAttendanceSum / (subjects.length || 1)).toFixed(1));
    
    const improvingCount = subjectAnalyticsList.filter(s => s.trend === 'IMPROVING').length;
    const decliningCount = subjectAnalyticsList.filter(s => s.trend === 'DECLINING').length;
    if (decliningCount >= 2 || (decliningCount > improvingCount && decliningCount >= 1)) {
      overallTrend = 'DECLINING';
    } else if (improvingCount >= 2 && improvingCount > decliningCount) {
      overallTrend = 'IMPROVING';
    }
  } else {
    overallPercentage = prevSemRecord?.percentage || 0;
    currentGpa = prevSemRecord?.gpa || 0;
    attendanceAverage = prevSemRecord?.attendance_average || 0;
    
    const rollInt = parseInt(student.roll_number, 10);
    if (!isNaN(rollInt)) {
      const uciId = rollInt - 2420030519;
      const uciRecord = await queryOne('SELECT g1, g2, g3 FROM uci_student_records WHERE id = ?', [uciId]);
      if (uciRecord) {
        const delta = uciRecord.g3 - uciRecord.g1;
        if (delta >= 2) overallTrend = 'IMPROVING';
        else if (delta <= -2) overallTrend = 'DECLINING';
      }
    }
  }

  // Section rank calculation & aggregates
  const allStudents = await query(`
    SELECT s.id, s.section, pr.gpa as prev_gpa
    FROM students s
    LEFT JOIN performance_records pr ON s.id = pr.student_id AND pr.semester_id = 'sem_4'
    WHERE s.section = ?
  `, [student.section]);

  // Sort students by actual performance (prev_gpa is best proxy for dataset records without sem5 marks)
  allStudents.sort((a, b) => (b.prev_gpa || 0) - (a.prev_gpa || 0));

  const totalStudentsInSection = allStudents.length || 1;
  let rankInSection = 1;
  const myIndex = allStudents.findIndex(s => s.id === studentId);
  if (myIndex !== -1) {
    rankInSection = myIndex + 1;
  }

  const weakSubjects = subjectAnalyticsList.filter(s => s.riskStatus === 'HIGH' || s.riskStatus === 'MEDIUM');
  const strongSubjects = subjectAnalyticsList.filter(s => s.riskStatus === 'LOW' && s.weightedScorePercentage >= 75);

  const result: StudentOverviewAnalytics = {
    studentId,
    rollNumber: student.roll_number,
    name: student.name,
    section: student.section,
    batch: student.batch,
    semesterName: student.semester_name,
    currentGpa,
    overallPercentage,
    attendanceAverage,
    rankInSection,
    totalStudentsInSection,
    trendStatus: overallTrend,
    hasDetailedSubjectData: studentHasAnyMarks,
    subjects: subjectAnalyticsList,
    weakSubjects,
    strongSubjects,
    comparisons: {
      studentGpa: currentGpa,
      sectionAverageGpa: 7.72,
      highestSectionGpa: 9.65,
      prevSemesterGpa: prevGpa,
      gpaDelta: Number((currentGpa - prevGpa).toFixed(2)),
      attendanceDelta: Number((attendanceAverage - prevAtt).toFixed(1))
    }
  };

  // 7. Calculate Assignment Analytics
  const assignments = await query(`SELECT * FROM assignments WHERE student_id = ?`, [studentId]);
  if (assignments.length > 0) {
    const totalAssignments = assignments.length;
    const submitted = assignments.filter((a: any) => a.submission_status !== 'MISSED').length;
    const missing = assignments.filter((a: any) => a.submission_status === 'MISSED').length;
    const submissionRate = Number(((submitted / totalAssignments) * 100).toFixed(1));
    const scoredAssignments = assignments.filter((a: any) => a.max_score > 0);
    const averageScore = scoredAssignments.length > 0 ? Number((scoredAssignments.reduce((sum: number, a: any) => sum + ((a.score / a.max_score) * 100), 0) / scoredAssignments.length).toFixed(1)) : 0;
    
    result.assignmentAnalytics = {
      totalAssignments,
      submitted,
      missing,
      submissionRate,
      averageScore
    };
  }

  return result;
}
