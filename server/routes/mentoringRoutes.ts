import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';
import { query, queryOne, execute, saveDb } from '../../db/database.js';

export const mentoringRoutes = Router();

// Ensure mentoring tables exist
async function ensureMentoringTables() {
  await execute(`
    CREATE TABLE IF NOT EXISTS mentoring_records (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      faculty_id TEXT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
      session_date DATE NOT NULL,
      session_type TEXT DEFAULT 'ONE_ON_ONE',
      topic TEXT NOT NULL,
      mentor_notes TEXT NOT NULL,
      student_action_plan TEXT,
      parent_informed INTEGER DEFAULT 0,
      follow_up_date DATE,
      status TEXT CHECK(status IN ('SCHEDULED', 'COMPLETED', 'STUDENT_REQUESTED')) DEFAULT 'COMPLETED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS student_wellness (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      stress_level INTEGER DEFAULT 3, -- 1 (Low) to 5 (High)
      confidence_level INTEGER DEFAULT 4, -- 1 (Low) to 5 (High)
      study_hours_weekly INTEGER DEFAULT 18,
      sleep_hours_daily REAL DEFAULT 7.0,
      reflection_notes TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default mentoring records if none exist
  const existingRecords = await query('SELECT COUNT(*) as count FROM mentoring_records');
  if (existingRecords[0]?.count === 0) {
    await execute(`
      INSERT INTO mentoring_records (id, student_id, faculty_id, session_date, session_type, topic, mentor_notes, student_action_plan, parent_informed, follow_up_date, status) VALUES
      ('ment_1', 'stu_tejaditya', 'fac_guide', '2026-09-14', 'ONE_ON_ONE', 'Honors Track & Capstone Research', 'Reviewed high academic trajectory (GPA 9.66). Recommended submission of research paper on Early Warning Systems to IEEE student symposium. Student is well-balanced and motivated.', 'Prepare research draft on time-series risk forecasting; mentor peer study circle.', 0, '2026-10-14', 'COMPLETED'),
      ('ment_2', 'stu_akshath', 'fac_guide', '2026-09-15', 'ONE_ON_ONE', 'Mid-Term Recovery & Positive Slope', 'Congratulated Akshath on upward marks trajectory (+0.65 delta). Discussed balancing Operating Systems lab records with Database assignments. Recommended structured 2-hour daily study sprints.', 'Complete OS multithreading assignment ahead of schedule; revise DBMS normalization.', 0, '2026-10-15', 'COMPLETED'),
      ('ment_3', 'stu_rajesh', 'fac_guide', '2026-09-16', 'ONE_ON_ONE', 'Algorithms Score Decline & Remediation', 'Detailed session addressing algorithms mid-term drop. Identified specific struggle with dynamic programming & graph traversal. Offered faculty office hours for 1-on-1 tutoring.', 'Attend Wednesday 4 PM remedial clinic; solve 5 guided problems with tutor.', 1, '2026-09-30', 'COMPLETED'),
      ('ment_4', 'stu_rahul', 'fac_guide', '2026-09-18', 'ONE_ON_ONE', 'Attendance Shortfall & Exam Debarment Warning', 'Formally counseled student on 59.2% attendance. Explained statutory 75% rule for Hall Ticket issuance. Advised on medical leave documentation and mandatory regular class attendance.', 'Attend all scheduled lectures without absence for next 3 weeks to recover margin.', 1, '2026-10-02', 'COMPLETED'),
      ('ment_5', 'stu_vikram', 'fac_guide', '2026-09-19', 'ONE_ON_ONE', 'Comprehensive Academic Recovery Plan', 'Urgent proctorial intervention with parents. Formulated 14-day turnaround protocol covering all 5 core subjects with peer partner.', 'Daily attendance sign-off with proctor; weekly submission of assignment drafts.', 1, '2026-09-28', 'COMPLETED')
    `);

    await execute(`
      INSERT INTO student_wellness (id, student_id, stress_level, confidence_level, study_hours_weekly, sleep_hours_daily, reflection_notes) VALUES
      ('well_1', 'stu_tejaditya', 2, 5, 24, 7.5, 'Feeling energized and on schedule with Capstone project and coursework. Excited about machine learning assignments.'),
      ('well_2', 'stu_akshath', 3, 4, 18, 7.0, 'Steadily gaining confidence after IA-2 results. Managing time better between theory and lab classes.'),
      ('well_3', 'stu_rajesh', 4, 2, 12, 6.0, 'Feeling overwhelmed with dynamic programming and discrete math proofs. Need guidance on structuring study time.'),
      ('well_4', 'stu_rahul', 4, 2, 10, 6.5, 'Struggled with health issues in August causing attendance drop. Determined to recover attendance this month.'),
      ('well_5', 'stu_vikram', 5, 1, 8, 5.5, 'Anxious about end-term exams. The faculty mentoring session helped map out a concrete step-by-step recovery plan.')
    `);
    await saveDb();
  }
}

// Student: Get Assigned Mentor & Mentoring History
mentoringRoutes.get('/my-mentor', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  await ensureMentoringTables();
  const userId = req.user!.id;

  const student = await queryOne<{ id: string; mentor_faculty_id: string; name: string }>(`
    SELECT id, mentor_faculty_id, name FROM students WHERE user_id = ?
  `, [userId]);

  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const mentor = await queryOne<any>(`
    SELECT f.*, u.email, u.phone
    FROM faculty f
    JOIN users u ON f.user_id = u.id
    WHERE f.id = ?
  `, [student.mentor_faculty_id || 'fac_guide']);

  const sessions = await query(`
    SELECT m.*, f.name as faculty_name
    FROM mentoring_records m
    JOIN faculty f ON m.faculty_id = f.id
    WHERE m.student_id = ?
    ORDER BY m.session_date DESC
  `, [student.id]);

  const latestWellness = await queryOne<any>(`
    SELECT * FROM student_wellness WHERE student_id = ? ORDER BY submitted_at DESC LIMIT 1
  `, [student.id]);

  return res.json({
    mentor: {
      id: mentor?.id || 'fac_guide',
      name: mentor?.name || 'Dr. Pratusha Mam',
      designation: mentor?.designation || 'Associate Professor & Capstone Guide',
      department: mentor?.department || 'Computer Science & Engineering',
      specialization: mentor?.specialization || 'Machine Learning & Algorithms',
      email: mentor?.email || 'guide@cse.college.edu',
      phone: mentor?.phone || '+91 98450 22334',
      officeLocation: 'Room 412, Alan Turing Academic Block, 4th Floor',
      officeHours: 'Monday & Thursday · 2:00 PM – 4:30 PM',
      mentorWelcomeMessage: 'Welcome to your Proctorial Mentoring Portal. I am here to support your academic growth, project milestones, and professional wellness throughout Semester 5. Feel free to request a meeting whenever you need guidance.'
    },
    sessions,
    latestWellness: latestWellness || {
      stress_level: 3,
      confidence_level: 3,
      study_hours_weekly: 16,
      sleep_hours_daily: 7.0,
      reflection_notes: 'Regular academic progress. Maintaining steady preparation.'
    }
  });
});

// Faculty: Get All Assigned Mentees
mentoringRoutes.get('/my-mentees', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  await ensureMentoringTables();
  const userId = req.user!.id;

  const faculty = await queryOne<{ id: string; name: string }>(`
    SELECT id, name FROM faculty WHERE user_id = ?
  `, [userId]);

  const facultyId = faculty ? faculty.id : 'fac_guide';

  const mentees = await query<any>(`
    SELECT s.id, s.name, s.roll_number, s.section, s.batch,
           u.email, u.phone,
           r.risk_level, r.overall_risk_score, r.declining_marks_flag, r.low_attendance_flag,
           p.gpa, p.attendance_average, p.trend_status
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN risk_assessments r ON s.id = r.student_id
    LEFT JOIN performance_records p ON s.id = p.student_id
    ORDER BY r.overall_risk_score DESC
  `);

  // Enrich each mentee with latest mentoring session & wellness
  const enrichedMentees = await Promise.all(
    mentees.map(async (m) => {
      const lastSession = await queryOne<any>(`
        SELECT * FROM mentoring_records WHERE student_id = ? ORDER BY session_date DESC LIMIT 1
      `, [m.id]);

      const wellness = await queryOne<any>(`
        SELECT * FROM student_wellness WHERE student_id = ? ORDER BY submitted_at DESC LIMIT 1
      `, [m.id]);

      return {
        ...m,
        lastSessionDate: lastSession ? lastSession.session_date : 'Not recorded yet',
        lastSessionTopic: lastSession ? lastSession.topic : 'Initial proctorial induction',
        followUpDate: lastSession ? lastSession.follow_up_date : null,
        stressLevel: wellness ? wellness.stress_level : 3,
        confidenceLevel: wellness ? wellness.confidence_level : 3,
        studyHours: wellness ? wellness.study_hours_weekly : 15
      };
    })
  );

  return res.json({
    facultyName: faculty?.name || 'Dr. Pratusha Mam',
    mentees: enrichedMentees
  });
});

// Log or Schedule Mentoring Session
mentoringRoutes.post('/sessions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  await ensureMentoringTables();
  const {
    studentId,
    sessionDate,
    topic,
    mentorNotes,
    studentActionPlan,
    parentInformed,
    followUpDate,
    status
  } = req.body;

  if (!studentId || !topic || !mentorNotes) {
    return res.status(400).json({ error: 'studentId, topic, and mentorNotes are required.' });
  }

  const id = `ment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const facultyId = 'fac_guide';

  await execute(`
    INSERT INTO mentoring_records (
      id, student_id, faculty_id, session_date, topic, mentor_notes,
      student_action_plan, parent_informed, follow_up_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    studentId,
    facultyId,
    sessionDate || new Date().toISOString().split('T')[0],
    topic,
    mentorNotes,
    studentActionPlan || '',
    parentInformed ? 1 : 0,
    followUpDate || null,
    status || 'COMPLETED'
  ]);

  await saveDb();
  return res.json({ success: true, message: 'Mentoring record logged successfully.', id });
});

// Student: Submit Wellness & Self-Reflection Check-in
mentoringRoutes.post('/wellness', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  await ensureMentoringTables();
  const userId = req.user!.id;

  const student = await queryOne<{ id: string }>(`
    SELECT id FROM students WHERE user_id = ?
  `, [userId]);

  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const { stressLevel, confidenceLevel, studyHoursWeekly, sleepHoursDaily, reflectionNotes } = req.body;
  const id = `well_${Date.now()}`;

  await execute(`
    INSERT INTO student_wellness (
      id, student_id, stress_level, confidence_level, study_hours_weekly, sleep_hours_daily, reflection_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    student.id,
    Number(stressLevel) || 3,
    Number(confidenceLevel) || 3,
    Number(studyHoursWeekly) || 16,
    Number(sleepHoursDaily) || 7.0,
    reflectionNotes || 'Self-reflection recorded.'
  ]);

  await saveDb();
  return res.json({ success: true, message: 'Wellness check-in recorded successfully.' });
});

// Student: Request Mentoring Meeting
mentoringRoutes.post('/request-meeting', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  await ensureMentoringTables();
  const userId = req.user!.id;

  const student = await queryOne<{ id: string; mentor_faculty_id: string }>(`
    SELECT id, mentor_faculty_id FROM students WHERE user_id = ?
  `, [userId]);

  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const { preferredDate, topic, reason } = req.body;
  const id = `ment_req_${Date.now()}`;

  await execute(`
    INSERT INTO mentoring_records (
      id, student_id, faculty_id, session_date, topic, mentor_notes,
      student_action_plan, parent_informed, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'STUDENT_REQUESTED')
  `, [
    id,
    student.id,
    student.mentor_faculty_id || 'fac_guide',
    preferredDate || new Date().toISOString().split('T')[0],
    topic || 'General Academic Guidance',
    `Student Request: ${reason || 'Requested 1-on-1 counseling consultation.'}`,
    'Awaiting mentor confirmation.'
  ]);

  await saveDb();
  return res.json({ success: true, message: 'Mentoring meeting request submitted to Dr. Pratusha Mam.' });
});
