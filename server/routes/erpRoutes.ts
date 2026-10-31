import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';
import { query, queryOne, execute } from '../../db/database.js';
import { calculateStudentAnalytics } from '../analytics.js';

export const erpRoutes = Router();

// ----------------------------------------------------
// 1. ACADEMIC REGISTRATION
// ----------------------------------------------------
erpRoutes.get('/registration/courses/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const registrations = await query(`
      SELECT cr.*, s.code, s.name as subject_name, s.credits, f.name as faculty_name
      FROM course_registrations cr
      JOIN subjects s ON cr.subject_id = s.id
      LEFT JOIN faculty f ON s.faculty_id = f.id
      WHERE cr.student_id = ?
      ORDER BY cr.registered_at DESC
    `, [studentId]);

    const availableCourses = await query(`
      SELECT s.*, f.name as faculty_name 
      FROM subjects s
      LEFT JOIN faculty f ON s.faculty_id = f.id
    `);

    res.json({ registrations, availableCourses });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRoutes.post('/registration/register', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, subjectId, registrationType } = req.body;
    if (!studentId || !subjectId || !registrationType) {
      return res.status(400).json({ error: 'Missing required registration parameters.' });
    }

    const regId = `reg_${studentId}_${Date.now()}`;
    await execute(`
      INSERT OR REPLACE INTO course_registrations (id, student_id, subject_id, registration_type, academic_year, semester, status)
      VALUES (?, ?, ?, ?, '2026-2027', 'Semester VI', 'APPROVED')
    `, [regId, studentId, subjectId, registrationType]);

    res.json({ success: true, message: `Successfully registered for course under ${registrationType} category.`, registrationId: regId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 2. ATTENDANCE REGISTER
// ----------------------------------------------------
erpRoutes.get('/attendance/register/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const records = await query(`
      SELECT a.*, s.code, s.name as subject_name, s.credits
      FROM attendance a
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.student_id = ?
    `, [studentId]);

    const shortageRecords = records.filter((r: any) => r.percentage < 75.0);
    const avgPercentage = records.length ? (records.reduce((acc: number, r: any) => acc + r.percentage, 0) / records.length) : 0;

    res.json({
      records,
      summary: {
        totalSubjects: records.length,
        averagePercentage: Math.round(avgPercentage * 10) / 10,
        shortageCount: shortageRecords.length,
        isEligible: avgPercentage >= 75.0,
        condonationEligible: avgPercentage >= 65.0 && avgPercentage < 75.0
      },
      shortageRecords
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. CAREER CHOICE & PREFERENCES
// ----------------------------------------------------
erpRoutes.get('/career/preferences/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const prefs = await queryOne('SELECT * FROM career_preferences WHERE student_id = ?', [studentId]);
    res.json(prefs || {
      primary_domain: 'Software Engineering',
      secondary_domain: 'Cloud & AI',
      target_role: 'Software Development Engineer',
      preferred_location: 'Hyderabad / Bengaluru',
      higher_studies_intent: 'Industry First',
      assessment_score: 85,
      recommendations: 'Recommended to focus on Data Structures, System Design and Cloud Microservices.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRoutes.post('/career/preferences', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, primaryDomain, secondaryDomain, targetRole, preferredLocation, higherStudiesIntent } = req.body;
    const id = `cp_${studentId}`;
    await execute(`
      INSERT OR REPLACE INTO career_preferences 
      (id, student_id, primary_domain, secondary_domain, target_role, preferred_location, higher_studies_intent, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, studentId, primaryDomain, secondaryDomain, targetRole, preferredLocation, higherStudiesIntent]);

    res.json({ success: true, message: 'Career preferences saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 4. COURSES: MATERIALS, HANDOUTS & FEEDBACK
// ----------------------------------------------------
erpRoutes.get('/courses/materials', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subjectId = req.query.subjectId as string;
    let sql = `
      SELECT cm.*, s.code, s.name as subject_name 
      FROM course_materials cm
      JOIN subjects s ON cm.subject_id = s.id
    `;
    const params: any[] = [];
    if (subjectId) {
      sql += ' WHERE cm.subject_id = ?';
      params.push(subjectId);
    }
    sql += ' ORDER BY cm.unit_number ASC, cm.uploaded_at DESC';
    const materials = await query(sql, params);
    res.json({ materials });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRoutes.post('/courses/feedback', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, subjectId, clarityRating, paceRating, engagementRating, comments } = req.body;
    const id = `fb_${studentId}_${Date.now()}`;
    await execute(`
      INSERT INTO session_feedbacks (id, student_id, subject_id, clarity_rating, pace_rating, engagement_rating, comments)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, studentId, subjectId, clarityRating, paceRating, engagementRating, comments]);

    res.json({ success: true, message: 'Lecture session feedback recorded.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 5. CRT (CAMPUS RECRUITMENT TRAINING)
// ----------------------------------------------------
erpRoutes.get('/crt/progress/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const trainings = await query('SELECT * FROM crt_training WHERE student_id = ? ORDER BY date DESC', [studentId]);
    res.json({
      trainings,
      summary: {
        totalModules: trainings.length,
        averageAptitude: 90.5,
        codingProficiency: 'Level 4 (Advanced)',
        mockInterviewStatus: 'Cleared (Recommended for Tier-1 Companies)'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 6. COUNSELLING DIARY & MENTOR APPOINTMENTS
// ----------------------------------------------------
erpRoutes.get('/counselling/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const appointments = await query(`
      SELECT ca.*, f.name as faculty_name, f.department, f.designation
      FROM counselling_appointments ca
      JOIN faculty f ON ca.faculty_id = f.id
      WHERE ca.student_id = ?
      ORDER BY ca.appointment_date DESC
    `, [studentId]);

    const mentor = await queryOne(`
      SELECT f.*, u.email, u.phone 
      FROM students s
      JOIN faculty f ON s.mentor_faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      WHERE s.id = ?
    `, [studentId]);

    res.json({ appointments, mentor });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRoutes.post('/counselling/schedule', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, facultyId, appointmentDate, purpose } = req.body;
    const id = `apt_${studentId}_${Date.now()}`;
    await execute(`
      INSERT INTO counselling_appointments (id, student_id, faculty_id, appointment_date, purpose, status)
      VALUES (?, ?, ?, ?, ?, 'SCHEDULED')
    `, [id, studentId, facultyId, appointmentDate, purpose]);

    res.json({ success: true, message: 'Proctorial mentoring appointment scheduled.', appointmentId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 7. CLUBS, SIL POINTS & ACTIVITIES
// ----------------------------------------------------
erpRoutes.get('/clubs', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const clubs = await query('SELECT * FROM clubs');
    const events = await query(`
      SELECT ce.*, c.name as club_name 
      FROM club_events ce
      JOIN clubs c ON ce.club_id = c.id
      ORDER BY ce.date ASC
    `);
    res.json({ clubs, events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRoutes.get('/clubs/membership/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const memberships = await query(`
      SELECT cm.*, c.name as club_name, c.category, c.lead_faculty
      FROM club_memberships cm
      JOIN clubs c ON cm.club_id = c.id
      WHERE cm.student_id = ?
    `, [studentId]);

    const totalSil = memberships.reduce((acc: number, m: any) => acc + (m.sil_points || 0), 0);
    res.json({ memberships, totalSil, requiredSil: 80, isSilEligible: totalSil >= 80 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 8. FEE PAYMENTS & STRUCTURE
// ----------------------------------------------------
erpRoutes.get('/fees/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const structure = await query('SELECT * FROM fee_structures ORDER BY amount DESC');
    const payments = await query('SELECT * FROM fee_payments WHERE student_id = ? ORDER BY paid_at DESC', [studentId]);

    const totalBilled = structure.reduce((acc: number, f: any) => acc + f.amount, 0);
    const totalPaid = payments.reduce((acc: number, p: any) => acc + p.amount, 0);
    const dues = Math.max(0, totalBilled - totalPaid);

    res.json({
      structure,
      payments,
      summary: {
        totalBilled,
        totalPaid,
        dues,
        isCleared: dues === 0
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRoutes.post('/fees/pay', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, feeType, amount, paymentMode } = req.body;
    const payId = `fp_${studentId}_${Date.now()}`;
    const txnRef = `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const recNum = `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    await execute(`
      INSERT INTO fee_payments (id, student_id, fee_type, amount, payment_mode, transaction_ref, status, receipt_number)
      VALUES (?, ?, ?, ?, ?, ?, 'PAID', ?)
    `, [payId, studentId, feeType, amount, paymentMode || 'ONLINE_UPI', txnRef, recNum]);

    res.json({ success: true, message: 'Fee payment receipt generated successfully.', receiptNumber: recNum, transactionRef: txnRef });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 9. HOSTEL MANAGEMENT
// ----------------------------------------------------
erpRoutes.get('/hostel/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const allocation = await queryOne('SELECT * FROM hostel_allocations WHERE student_id = ?', [studentId]);
    const complaints = await query('SELECT * FROM hostel_complaints WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
    res.json({ allocation, complaints });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRoutes.post('/hostel/complaint', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, roomNumber, issueType, description, priority } = req.body;
    const id = `hc_${Date.now()}`;
    await execute(`
      INSERT INTO hostel_complaints (id, student_id, room_number, issue_type, description, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, 'OPEN')
    `, [id, studentId, roomNumber, issueType, description, priority || 'MEDIUM']);

    res.json({ success: true, message: 'Hostel maintenance ticket logged.', complaintId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 10. LIBRARY MANAGEMENT
// ----------------------------------------------------
erpRoutes.get('/library/records/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const search = (req.query.search as string || '').toLowerCase().trim();

    let bookSql = 'SELECT * FROM library_books';
    const params: any[] = [];
    if (search) {
      bookSql += ' WHERE LOWER(title) LIKE ? OR LOWER(author) LIKE ? OR LOWER(category) LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const books = await query(bookSql, params);

    const transactions = await query(`
      SELECT lt.*, lb.title, lb.author, lb.category, lb.isbn
      FROM library_transactions lt
      JOIN library_books lb ON lt.book_id = lb.id
      WHERE lt.student_id = ?
      ORDER BY lt.issue_date DESC
    `, [studentId]);

    res.json({ books, transactions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 11. NODUE CLEARANCE
// ----------------------------------------------------
erpRoutes.get('/nodue/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const clearance = await queryOne('SELECT * FROM no_due_clearance WHERE student_id = ?', [studentId]);
    res.json(clearance || {
      department_status: 'CLEARED',
      library_status: 'CLEARED',
      hostel_status: 'CLEARED',
      accounts_status: 'CLEARED',
      laboratory_status: 'CLEARED',
      overall_status: 'APPROVED',
      remarks: 'All institutional departments cleared for certificate dispatch.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 12. REGISTRAR OFFICE DOCUMENT REQUESTS
// ----------------------------------------------------
erpRoutes.get('/documents/requests/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const requests = await query('SELECT * FROM document_requests WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
    res.json({ requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRoutes.post('/documents/request', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { studentId, documentType, purpose, copies } = req.body;
    const refNum = `DOC-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const id = `dr_${Date.now()}`;
    const estDelivery = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await execute(`
      INSERT INTO document_requests (id, student_id, document_type, purpose, copies, status, reference_number, estimated_delivery)
      VALUES (?, ?, ?, ?, ?, 'PROCESSING', ?, ?)
    `, [id, studentId, documentType, purpose, copies || 1, refNum, estDelivery]);

    res.json({ success: true, message: 'Registrar document application filed.', referenceNumber: refNum, estimatedDelivery: estDelivery });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 13. HALL TICKET & EXAM ELIGIBILITY
// ----------------------------------------------------
erpRoutes.get('/hall-ticket/:studentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
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
        debarmentRemarks = 'Attendance is between 65% and 75%. Condonation committee approval and fee receipt required.';
      } else {
        debarmentStatus = 'DEBARRED';
        debarmentRemarks = 'Attendance is below 65%. Debarred from End-Semester Examination per Academic Regulations.';
      }
    }

    const examSchedule = [
      { code: 'CS301', subject: 'Advanced Data Structures & Algorithms', date: '2026-11-16', time: '10:00 AM – 01:00 PM', hall: 'Exam Hall 304, Turing Block' },
      { code: 'CS302', subject: 'Database Management Systems & Cloud DBs', date: '2026-11-18', time: '10:00 AM – 01:00 PM', hall: 'Exam Hall 304, Turing Block' },
      { code: 'CS303', subject: 'Operating Systems & Concurrency', date: '2026-11-20', time: '10:00 AM – 01:00 PM', hall: 'Exam Hall 306, Turing Block' },
      { code: 'CS304', subject: 'Computer Networks & Internet Protocols', date: '2026-11-23', time: '10:00 AM – 01:00 PM', hall: 'Exam Hall 306, Turing Block' },
      { code: 'CS305', subject: 'Machine Learning & Intelligent Systems', date: '2026-11-25', time: '10:00 AM – 01:00 PM', hall: 'Exam Hall 308, Turing Block' }
    ];

    res.json({
      institution: 'Koneru Lakshmaiah Education Foundation (KL Deemed to be University)',
      accreditation: 'NAAC A++ Accredited · Category 1 Autonomy · NIRF Top 30 Ranked',
      academicYear: '2026–2027',
      semester: 'Semester VI (B.Tech CSE)',
      examinationName: 'Regular End-Semester Examinations — November 2026',
      hallTicketNumber: `HT2026-${analytics.rollNumber}`,
      studentName: analytics.name,
      rollNumber: analytics.rollNumber,
      section: analytics.section,
      attendancePercentage: analytics.attendanceAverage,
      debarmentStatus,
      debarmentRemarks,
      feeClearance: 'CLEARED',
      examSchedule
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
