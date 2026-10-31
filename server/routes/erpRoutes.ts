import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';
import { query, queryOne } from '../../db/database.js';
import { calculateStudentAnalytics } from '../analytics.js';

export const erpRoutes = Router();

// 1. Hall Ticket / Examination Eligibility Service
erpRoutes.get('/hall-ticket/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { studentId } = req.params;
  const analytics = await calculateStudentAnalytics(studentId);

  if (!analytics) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const isEligible = analytics.attendanceAverage >= 75.0;
  const isCondonable = analytics.attendanceAverage >= 65.0 && analytics.attendanceAverage < 75.0;

  let debarmentStatus = 'ELIGIBLE';
  let debarmentRemarks = 'Approved for all registered course examinations.';

  if (!isEligible) {
    if (isCondonable) {
      debarmentStatus = 'CONDONATION_REQUIRED';
      debarmentRemarks = 'Attendance is between 65% and 75%. Medical/Condonation committee approval and fee receipt required.';
    } else {
      debarmentStatus = 'DEBARRED';
      debarmentRemarks = 'Attendance is below 65%. Debarred from End-Semester Examination per University Academic Regulations.';
    }
  }

  const examSchedule = [
    { code: 'CS301', subject: 'Advanced Data Structures & Algorithms', date: '2026-11-16', time: '10:00 AM – 01:00 PM', hall: 'Exam Hall 304, Turing Block' },
    { code: 'CS302', subject: 'Database Management Systems & Cloud DBs', date: '2026-11-18', time: '10:00 AM – 01:00 PM', hall: 'Exam Hall 304, Turing Block' },
    { code: 'CS303', subject: 'Operating Systems & Concurrency', date: '2026-11-20', time: '10:00 AM – 01:00 PM', hall: 'Exam Hall 306, Turing Block' },
    { code: 'CS304', subject: 'Computer Networks & Internet Protocols', date: '2026-11-23', time: '10:00 AM – 01:00 PM', hall: 'Exam Hall 306, Turing Block' },
    { code: 'CS305', subject: 'Machine Learning & Intelligent Systems', date: '2026-11-25', time: '10:00 AM – 01:00 PM', hall: 'Exam Hall 308, Turing Block' }
  ];

  return res.json({
    institution: 'Apex Institute of Technology & Engineering (Autonomous)',
    accreditation: 'Affiliated to State Technological University · NAAC A++ Accredited',
    academicYear: '2026–2027',
    semester: 'Semester 5 (B.Tech CSE)',
    examinationName: 'End-Semester Regular Examinations — November 2026',
    hallTicketNumber: `HT2026-${analytics.rollNumber}`,
    studentName: analytics.name,
    rollNumber: analytics.rollNumber,
    section: analytics.section,
    batch: analytics.batch,
    department: 'Computer Science & Engineering',
    examCenter: 'Main Campus Examination Complex · Turing Block Center 102',
    cumulativeAttendance: analytics.attendanceAverage,
    debarmentStatus,
    debarmentRemarks,
    isEligible,
    examSchedule,
    generatedAt: new Date().toISOString(),
    controllerOfExaminations: 'Dr. V. R. Shastri, Ph.D.'
  });
});

// 2. Official Provisional Grade Card / Transcript Service
erpRoutes.get('/grade-card/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { studentId } = req.params;
  const analytics = await calculateStudentAnalytics(studentId);

  if (!analytics) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const semesterHistory = [
    { sem: 'Semester 1', credits: 21, sgpa: 8.80, status: 'PASSED - FIRST CLASS WITH DISTINCTION' },
    { sem: 'Semester 2', credits: 22, sgpa: 8.95, status: 'PASSED - FIRST CLASS WITH DISTINCTION' },
    { sem: 'Semester 3', credits: 23, sgpa: 8.70, status: 'PASSED - FIRST CLASS WITH DISTINCTION' },
    { sem: 'Semester 4', credits: 24, sgpa: analytics.comparisons.prevSemesterGpa, status: 'PASSED - FIRST CLASS' },
    { sem: 'Semester 5 (Current)', credits: 18, sgpa: analytics.currentGpa, status: 'IN PROGRESS (CIE EVALUATED)' }
  ];

  const totalCredits = semesterHistory.reduce((acc, s) => acc + s.credits, 0);
  const totalWeight = semesterHistory.reduce((acc, s) => acc + s.credits * s.sgpa, 0);
  const cgpa = (totalWeight / totalCredits).toFixed(2);

  return res.json({
    institution: 'Apex Institute of Technology & Engineering',
    degree: 'Bachelor of Technology (B.Tech)',
    branch: 'Computer Science & Engineering',
    rollNumber: analytics.rollNumber,
    studentName: analytics.name,
    cgpa,
    currentSgpa: analytics.currentGpa.toFixed(2),
    totalCreditsEarned: totalCredits,
    currentSubjects: analytics.subjects,
    semesterHistory,
    evaluationScale: '10.0 Grading Scale (Absolute UGC Standard)'
  });
});

// 3. Weekly Lecture & Lab Timetable Service
erpRoutes.get('/timetable', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  const weeklyTimetable = [
    {
      day: 'Monday',
      periods: [
        { time: '09:00 - 10:00', code: 'CS301', subject: 'Data Structures & Algorithms', faculty: 'Dr. Pratusha Mam', room: 'LH-401' },
        { time: '10:05 - 11:05', code: 'CS302', subject: 'Database Management Systems', faculty: 'Prof. K. Ramanathan', room: 'LH-401' },
        { time: '11:15 - 12:15', code: 'CS304', subject: 'Computer Networks', faculty: 'Dr. A. V. Suresh', room: 'LH-401' },
        { time: '01:15 - 03:15', code: 'CS305L', subject: 'Machine Learning Lab (Batch A)', faculty: 'Dr. Pratusha Mam', room: 'Lab 4' }
      ]
    },
    {
      day: 'Tuesday',
      periods: [
        { time: '09:00 - 10:00', code: 'CS303', subject: 'Operating Systems', faculty: 'Prof. K. Ramanathan', room: 'LH-401' },
        { time: '10:05 - 11:05', code: 'CS305', subject: 'Machine Learning Systems', faculty: 'Dr. Pratusha Mam', room: 'LH-401' },
        { time: '11:15 - 01:15', code: 'CS302L', subject: 'Cloud Database Lab (Batch A)', faculty: 'Prof. K. Ramanathan', room: 'Lab 2' },
        { time: '02:00 - 03:00', code: 'MENTOR', subject: 'Proctorial Mentoring & Guidance Hour', faculty: 'Dr. Pratusha Mam', room: 'Room 412' }
      ]
    },
    {
      day: 'Wednesday',
      periods: [
        { time: '09:00 - 10:00', code: 'CS301', subject: 'Data Structures & Algorithms', faculty: 'Dr. Pratusha Mam', room: 'LH-401' },
        { time: '10:05 - 11:05', code: 'CS304', subject: 'Computer Networks', faculty: 'Dr. A. V. Suresh', room: 'LH-401' },
        { time: '11:15 - 12:15', code: 'CS303', subject: 'Operating Systems', faculty: 'Prof. K. Ramanathan', room: 'LH-401' },
        { time: '01:15 - 03:15', code: 'CAPSTONE', subject: 'Engineering Capstone Project Lab', faculty: 'Faculty Guides', room: 'Project Hub' }
      ]
    },
    {
      day: 'Thursday',
      periods: [
        { time: '09:00 - 10:00', code: 'CS305', subject: 'Machine Learning Systems', faculty: 'Dr. Pratusha Mam', room: 'LH-401' },
        { time: '10:05 - 11:05', code: 'CS302', subject: 'Database Management Systems', faculty: 'Prof. K. Ramanathan', room: 'LH-401' },
        { time: '11:15 - 01:15', code: 'CS303L', subject: 'OS & Systems Programming Lab', faculty: 'Prof. K. Ramanathan', room: 'Lab 3' },
        { time: '02:00 - 04:00', code: 'LIBRARY', subject: 'Research Reference & Self-Study', faculty: 'Library Faculty', room: 'Central Library' }
      ]
    },
    {
      day: 'Friday',
      periods: [
        { time: '09:00 - 10:00', code: 'CS304', subject: 'Computer Networks', faculty: 'Dr. A. V. Suresh', room: 'LH-401' },
        { time: '10:05 - 11:05', code: 'CS301', subject: 'Data Structures & Algorithms', faculty: 'Dr. Pratusha Mam', room: 'LH-401' },
        { time: '11:15 - 12:15', code: 'CS303', subject: 'Operating Systems', faculty: 'Prof. K. Ramanathan', room: 'LH-401' },
        { time: '01:15 - 03:00', code: 'SEMINAR', subject: 'Technical Seminar & Coding Practice', faculty: 'CSE Faculty', room: 'Seminar Hall B' }
      ]
    }
  ];

  return res.json({ timetable: weeklyTimetable });
});

// 4. Campus Announcements & ERP Circulars
erpRoutes.get('/circulars', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  const circulars = [
    {
      id: 'circ_1',
      title: 'Mandatory 75% Attendance Requirement for Semester 5 Exam Hall Ticket',
      date: '2026-09-20',
      category: 'EXAMINATIONS',
      priority: 'HIGH',
      author: 'Controller of Examinations',
      content: 'All students are notified that per University Academic Regulations, minimum 75% physical attendance in every registered course is strictly required to download the November 2026 End-Semester Examination Hall Ticket.'
    },
    {
      id: 'circ_2',
      title: 'Mid-Term Assessment Marks Publication & Grievance Window',
      date: '2026-09-18',
      category: 'ACADEMICS',
      priority: 'MEDIUM',
      author: 'Dean Academics',
      content: 'Mid-Term examination marks have been published on the EduPulse ERP portal. Students may submit re-verification requests through their faculty mentors by Sep 28.'
    },
    {
      id: 'circ_3',
      title: 'Engineering Capstone Project – 1 Phase Review Schedule',
      date: '2026-09-15',
      category: 'PROJECTS',
      priority: 'MEDIUM',
      author: 'Department of CSE',
      content: 'First milestone reviews for Capstone Project – 1 (A.Y. 2026–2027) will be conducted by respective guides starting October 5. Submit literature review and system architecture drafts.'
    },
    {
      id: 'circ_4',
      title: 'Remedial Problem-Solving Clinics (Data Structures & Networks)',
      date: '2026-09-12',
      category: 'STUDENT_SUPPORT',
      priority: 'LOW',
      author: 'CSE Academic Mentoring Cell',
      content: 'Weekly remedial problem-solving sessions will be held every Wednesday at 4:00 PM in Room 412 for students flagged with declining marks in CS301 and CS304.'
    }
  ];

  return res.json({ circulars });
});

// 5. University Fee & Scholarship Clearance Status
erpRoutes.get('/fee-clearance/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { studentId } = req.params;

  return res.json({
    studentId,
    tuitionFeeStatus: 'CLEARED',
    examinationFeeStatus: 'CLEARED',
    libraryDues: 'NO DUES',
    hostelDues: 'NOT APPLICABLE (DAY SCHOLAR)',
    scholarshipCategory: 'Merit-Cum-Means State Technical Fellowship',
    scholarshipSanctioned: '₹45,000 / Year',
    hallTicketFinanceClearance: 'APPROVED'
  });
});
