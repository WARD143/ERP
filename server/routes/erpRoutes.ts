import { Router, Response } from 'express';
import crypto from 'crypto';
import { authenticateToken, enforceStudentOwnership, AuthenticatedRequest, logSecurityAudit } from '../auth.js';
import { query, queryOne, execute } from '../../db/database.js';
import { calculateStudentAnalytics } from '../analytics.js';

export const erpRoutes = Router();

// ----------------------------------------------------
// 1. ACADEMIC REGISTRATION
// ----------------------------------------------------
erpRoutes.get('/registration/courses/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
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

erpRoutes.post('/registration/register', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Derive studentId securely from verified server session if student
    const studentId = req.user!.role === 'STUDENT' ? req.user!.studentId! : (req.body.studentId || req.user!.studentId!);
    const { subjectId, registrationType } = req.body;

    if (!studentId || !subjectId || !registrationType) {
      return res.status(400).json({ error: 'Missing required registration parameters.' });
    }

    // Verify subject exists
    const subject = await queryOne('SELECT id FROM subjects WHERE id = ?', [subjectId]);
    if (!subject) {
      return res.status(404).json({ error: 'Invalid course: subject does not exist.' });
    }

    const regId = `reg_${studentId}_${Date.now()}`;
    await execute(`
      INSERT OR REPLACE INTO course_registrations (id, student_id, subject_id, registration_type, academic_year, semester, status)
      VALUES (?, ?, ?, ?, '2026-2027', 'Semester VI', 'APPROVED')
    `, [regId, studentId, subjectId, registrationType]);

    await logSecurityAudit(req.user!.id, 'COURSE_REGISTRATION', `/api/erp/registration/register`, req.ip, 200);
    res.json({ success: true, message: `Successfully registered for course under ${registrationType} category.`, registrationId: regId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 2. ATTENDANCE REGISTER
// ----------------------------------------------------
erpRoutes.get('/attendance/register/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
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
erpRoutes.get('/career/preferences/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
    const prefs = await queryOne('SELECT * FROM career_preferences WHERE student_id = ?', [studentId]);
    res.json(prefs || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRoutes.post('/career/preferences', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.role === 'STUDENT' ? req.user!.studentId! : (req.body.studentId || req.user!.studentId!);
    const { primaryDomain, secondaryDomain, targetRole, preferredLocation, higherStudiesIntent } = req.body;

    if (!studentId || !primaryDomain || !targetRole) {
      return res.status(400).json({ error: 'Student ID, primary domain, and target role are required.' });
    }

    const id = `cp_${studentId}`;
    await execute(`
      INSERT OR REPLACE INTO career_preferences 
      (id, student_id, primary_domain, secondary_domain, target_role, preferred_location, higher_studies_intent, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, studentId, primaryDomain, secondaryDomain || '', targetRole, preferredLocation || '', higherStudiesIntent || '']);

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

erpRoutes.post('/courses/feedback', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.role === 'STUDENT' ? req.user!.studentId! : (req.body.studentId || req.user!.studentId!);
    const { subjectId, clarityRating, paceRating, engagementRating, comments } = req.body;

    if (!subjectId || !clarityRating) {
      return res.status(400).json({ error: 'Subject ID and clarity rating are required.' });
    }

    const id = `fb_${studentId}_${Date.now()}`;
    await execute(`
      INSERT INTO session_feedbacks (id, student_id, subject_id, clarity_rating, pace_rating, engagement_rating, comments)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, studentId, subjectId, Number(clarityRating), Number(paceRating) || 3, Number(engagementRating) || 3, comments || '']);

    res.json({ success: true, message: 'Lecture session feedback recorded.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 5. CRT (CAMPUS RECRUITMENT TRAINING)
// ----------------------------------------------------
erpRoutes.get('/crt/progress/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
    const trainings = await query('SELECT * FROM crt_training WHERE student_id = ? ORDER BY date DESC', [studentId]);
    res.json({
      trainings,
      summary: {
        totalModules: trainings.length,
        averageScore: trainings.length ? Math.round(trainings.reduce((acc: number, t: any) => acc + (t.score || 0), 0) / trainings.length) : 0,
        status: trainings.length ? 'TRAINING_ACTIVE' : 'NO_TRAINING_RECORDS'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 6. COUNSELLING DIARY & MENTOR APPOINTMENTS
// ----------------------------------------------------
erpRoutes.get('/counselling/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
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

erpRoutes.post('/counselling/schedule', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.role === 'STUDENT' ? req.user!.studentId! : (req.body.studentId || req.user!.studentId!);
    const { facultyId, appointmentDate, purpose } = req.body;

    if (!facultyId || !appointmentDate || !purpose) {
      return res.status(400).json({ error: 'Faculty ID, date, and purpose are required.' });
    }

    const id = `apt_${studentId}_${Date.now()}`;
    await execute(`
      INSERT INTO counselling_appointments (id, student_id, faculty_id, appointment_date, purpose, status)
      VALUES (?, ?, ?, ?, ?, 'SCHEDULED')
    `, [id, studentId, facultyId, appointmentDate, purpose]);

    res.json({ success: true, message: 'Mentoring appointment scheduled.', appointmentId: id });
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

erpRoutes.get('/clubs/membership/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
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
// 8. FEE PAYMENTS & VERIFICATION (SECURE / DEMO MODE)
// ----------------------------------------------------
erpRoutes.get('/fees/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
    const structure = await query('SELECT * FROM fee_structures ORDER BY amount DESC');
    const payments = await query('SELECT * FROM fee_payments WHERE student_id = ? ORDER BY paid_at DESC', [studentId]);

    const totalBilled = structure.reduce((acc: number, f: any) => acc + f.amount, 0);
    const totalPaid = payments.filter((p: any) => p.status === 'PAID').reduce((acc: number, p: any) => acc + p.amount, 0);
    const dues = Math.max(0, totalBilled - totalPaid);

    const isLiveGateway = !!(process.env.PAYMENT_GATEWAY_KEY && process.env.PAYMENT_GATEWAY_SECRET);

    res.json({
      gatewayMode: isLiveGateway ? 'LIVE_GATEWAY' : 'DEMO_SIMULATION_MODE',
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

/**
 * Payment Initiation Endpoint:
 * - Validates input parameters on server side
 * - Prevents negative amounts, zero amounts, or arbitrary fee types
 * - Creates payment in PENDING status
 * - Never marks PAID automatically unless verified
 */
erpRoutes.post('/fees/initiate-payment', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.role === 'STUDENT' ? req.user!.studentId! : (req.body.studentId || req.user!.studentId!);
    const { feeType, amount, paymentMode } = req.body;

    const numAmount = Number(amount);
    if (!studentId || !feeType || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid student ID, fee type, and positive amount are required.' });
    }

    // Verify fee exists in university fee structure
    const feeItem = await queryOne('SELECT amount FROM fee_structures WHERE fee_type = ?', [feeType]);
    if (!feeItem) {
      return res.status(400).json({ error: 'Unrecognized fee type for university structure.' });
    }

    const payId = `fp_${studentId}_${Date.now()}`;
    const txnRef = `TXN-PENDING-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const isLiveGateway = !!(process.env.PAYMENT_GATEWAY_KEY && process.env.PAYMENT_GATEWAY_SECRET);

    // Initial insertion ALWAYS has PENDING status
    await execute(`
      INSERT INTO fee_payments (id, student_id, fee_type, amount, payment_mode, transaction_ref, status, receipt_number)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
    `, [payId, studentId, feeType, numAmount, paymentMode || 'ONLINE_UPI', txnRef, 'PENDING_RECEIPT']);

    await logSecurityAudit(req.user!.id, 'PAYMENT_INITIATED', `/api/erp/fees/initiate-payment`, req.ip, 200);

    res.json({
      success: true,
      paymentId: payId,
      transactionRef: txnRef,
      status: 'PENDING',
      gatewayMode: isLiveGateway ? 'LIVE_GATEWAY' : 'DEMO_SIMULATION_MODE',
      message: isLiveGateway
        ? 'Payment intent initiated with live gateway provider. Awaiting webhook confirmation.'
        : 'Payment order created in DEMO MODE. No real charge has occurred.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Demo Mode Payment Confirmation:
 * - Explicitly labeled as simulated demo payment
 * - Updates status from PENDING to DEMO_PAID / PAID with clear demo receipt
 */
erpRoutes.post('/fees/demo-confirm-payment', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required.' });
    }

    const payment = await queryOne('SELECT * FROM fee_payments WHERE id = ?', [paymentId]);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }

    if (req.user!.role === 'STUDENT' && payment.student_id !== req.user!.studentId) {
      return res.status(403).json({ error: 'Unauthorized to confirm payment for another student.' });
    }

    if (payment.status === 'PAID') {
      return res.status(400).json({ error: 'This payment transaction has already been reconciled.' });
    }

    const recNum = `REC-DEMO-${Date.now().toString().slice(-6)}`;
    const finalTxn = `TXN-DEMO-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await execute(`
      UPDATE fee_payments 
      SET status = 'PAID', receipt_number = ?, transaction_ref = ?
      WHERE id = ?
    `, [recNum, finalTxn, paymentId]);

    await logSecurityAudit(req.user!.id, 'DEMO_PAYMENT_CONFIRMED', `/api/erp/fees/demo-confirm-payment`, req.ip, 200);

    res.json({
      success: true,
      status: 'PAID',
      gatewayMode: 'DEMO_SIMULATION_MODE',
      receiptNumber: recNum,
      transactionRef: finalTxn,
      message: 'Payment confirmed under DEMO SIMULATION MODE. Balance updated.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 9. HOSTEL MANAGEMENT
// ----------------------------------------------------
erpRoutes.get('/hostel/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
    const allocation = await queryOne('SELECT * FROM hostel_allocations WHERE student_id = ?', [studentId]);
    const complaints = await query('SELECT * FROM hostel_complaints WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
    res.json({ allocation: allocation || null, complaints });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRoutes.post('/hostel/complaint', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.role === 'STUDENT' ? req.user!.studentId! : (req.body.studentId || req.user!.studentId!);
    const { roomNumber, issueType, description, priority } = req.body;

    if (!roomNumber || !issueType || !description) {
      return res.status(400).json({ error: 'Room number, issue type, and description are required.' });
    }

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
erpRoutes.get('/library/records/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
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
erpRoutes.get('/nodue/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
    const clearance = await queryOne('SELECT * FROM no_due_clearance WHERE student_id = ?', [studentId]);
    res.json(clearance || {
      department_status: 'PENDING_REVIEW',
      library_status: 'PENDING_REVIEW',
      hostel_status: 'PENDING_REVIEW',
      accounts_status: 'PENDING_REVIEW',
      laboratory_status: 'PENDING_REVIEW',
      overall_status: 'IN_PROGRESS',
      remarks: 'Clearance verification initiated.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 12. REGISTRAR OFFICE DOCUMENT REQUESTS
// ----------------------------------------------------
erpRoutes.get('/documents/requests/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
    const requests = await query('SELECT * FROM document_requests WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
    res.json({ requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

erpRoutes.post('/documents/request', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user!.role === 'STUDENT' ? req.user!.studentId! : (req.body.studentId || req.user!.studentId!);
    const { documentType, purpose, copies } = req.body;

    if (!documentType || !purpose) {
      return res.status(400).json({ error: 'Document type and purpose are required.' });
    }

    const refNum = `DOC-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const id = `dr_${Date.now()}`;
    const estDelivery = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await execute(`
      INSERT INTO document_requests (id, student_id, document_type, purpose, copies, status, reference_number, estimated_delivery)
      VALUES (?, ?, ?, ?, ?, 'PROCESSING', ?, ?)
    `, [id, studentId, documentType, purpose, Number(copies) || 1, refNum, estDelivery]);

    res.json({ success: true, message: 'Registrar document request filed.', referenceNumber: refNum, estimatedDelivery: estDelivery });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 13. DYNAMIC HALL TICKET & EXAM ELIGIBILITY ENGINE
// ----------------------------------------------------
erpRoutes.get('/hall-ticket/:studentId', authenticateToken, enforceStudentOwnership, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user!.studentId!;
    const analytics = await calculateStudentAnalytics(studentId);

    if (!analytics) {
      return res.status(404).json({ error: 'Student academic records not found.' });
    }

    // 1. Attendance Eligibility Check (Institutional Policy >= 75%)
    const attendanceEligible = analytics.attendanceAverage >= 75.0;
    const condonationEligible = analytics.attendanceAverage >= 65.0 && analytics.attendanceAverage < 75.0;

    // 2. Dynamic Fee Clearance Check from Database
    const feeSummary = await queryOne(`
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM fee_structures) as total_billed,
        (SELECT COALESCE(SUM(amount), 0) FROM fee_payments WHERE student_id = ? AND status = 'PAID') as total_paid
    `, [studentId]);

    const totalBilled = feeSummary?.total_billed || 0;
    const totalPaid = feeSummary?.total_paid || 0;
    const outstandingDues = Math.max(0, totalBilled - totalPaid);
    const feeCleared = outstandingDues === 0;

    // 3. Dynamic Registered Exam Schedule from DB
    const examSchedule = await query(`
      SELECT es.id, s.code, s.name as subject, es.exam_date as date, es.time_slot as time, es.hall_number as hall, es.seat_number
      FROM exam_schedules es
      JOIN subjects s ON es.subject_id = s.id
      JOIN course_registrations cr ON cr.subject_id = s.id
      WHERE cr.student_id = ? AND cr.status = 'APPROVED'
      ORDER BY es.exam_date ASC
    `, [studentId]);

    // 4. Overall Eligibility Determination
    let debarmentStatus = 'ELIGIBLE';
    const reasons: string[] = [];

    if (!attendanceEligible) {
      if (condonationEligible) {
        debarmentStatus = 'CONDONATION_REQUIRED';
        reasons.push(`Attendance is ${analytics.attendanceAverage.toFixed(1)}% (requires approved condonation for 65%-75%).`);
      } else {
        debarmentStatus = 'DEBARRED';
        reasons.push(`Attendance is ${analytics.attendanceAverage.toFixed(1)}%, below the mandatory 65% minimum threshold.`);
      }
    }

    if (!feeCleared) {
      if (debarmentStatus === 'ELIGIBLE') debarmentStatus = 'FEE_HOLD';
      reasons.push(`Outstanding tuition or examination fee balance: ₹${outstandingDues.toLocaleString()}.`);
    }

    if (examSchedule.length === 0) {
      reasons.push('No approved course examination schedules found for Semester VI.');
    }

    const isHallTicketIssued = debarmentStatus === 'ELIGIBLE' && feeCleared && examSchedule.length > 0;

    res.json({
      institution: 'Koneru Lakshmaiah Education Foundation (KL Deemed to be University)',
      accreditation: 'NAAC A++ Accredited · Category 1 Autonomy · NIRF Top 30 Ranked',
      academicYear: '2026–2027',
      semester: 'Semester VI (B.Tech CSE)',
      examinationName: 'Regular End-Semester Examinations — November 2026',
      hallTicketNumber: isHallTicketIssued ? `HT2026-${analytics.rollNumber}` : null,
      studentName: analytics.name,
      rollNumber: analytics.rollNumber,
      section: analytics.section,
      attendancePercentage: analytics.attendanceAverage,
      debarmentStatus,
      isHallTicketIssued,
      debarmentRemarks: reasons.length ? reasons.join(' ') : 'All academic and fee clearance criteria verified. Hall ticket active.',
      feeClearance: feeCleared ? 'CLEARED' : 'PENDING_DUES',
      outstandingDues,
      examSchedule: isHallTicketIssued ? examSchedule : []
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
