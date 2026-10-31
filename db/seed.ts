import crypto from 'crypto';
import { execute, query, queryOne, resetDatabase, saveDb } from './database.js';

export function hashPassword(password: string): string {
  // Simple deterministic scrypt/pbkdf2 hash for secure local auth
  return crypto.pbkdf2Sync(password, 'edupulse_academic_salt_2026', 1000, 32, 'sha256').toString('hex');
}

export async function seedDatabase(forceReset = false): Promise<void> {
  if (forceReset) {
    await resetDatabase();
  }

  // Check if already seeded
  const existingUsers = await query('SELECT count(*) as count FROM users');
  if (existingUsers[0]?.count > 0 && !forceReset) {
    console.log('Database already contains records. Skipping seed.');
    return;
  }

  console.log('🌱 Seeding EduPulse AI Academic Database...');

  // 1. Insert Default Risk Configuration
  await execute(`
    INSERT INTO risk_configurations (id, min_attendance_threshold, decline_percentage_threshold, variance_threshold, high_risk_cutoff, medium_risk_cutoff)
    VALUES ('config_default', 75.0, 10.0, 15.0, 65.0, 35.0)
  `);

  // 2. Insert Semesters
  await execute(`
    INSERT INTO semesters (id, name, academic_year, semester_number, is_current, start_date, end_date) VALUES
    ('sem_4', 'Semester 4', '2025-2026', 4, 0, '2025-11-01', '2026-04-15'),
    ('sem_5', 'Semester 5', '2026-2027', 5, 1, '2026-07-15', '2026-12-10')
  `);

  // 3. Insert Users & Faculty
  const adminPwd = hashPassword('admin123');
  const guidePwd = hashPassword('guide123');
  const facultyPwd = hashPassword('faculty123');
  const studentPwd = hashPassword('student123');

  // Admin
  await execute(`
    INSERT INTO users (id, email, password_hash, role, name, department, phone) VALUES
    ('user_admin', 'admin@cse.college.edu', ?, 'ADMIN', 'Dr. S. K. Murthy', 'Computer Science & Engineering', '+91 98450 11223')
  `, [adminPwd]);

  // Faculty: Pratusha Mam (Guide)
  await execute(`
    INSERT INTO users (id, email, password_hash, role, name, department, phone) VALUES
    ('user_guide', 'guide@cse.college.edu', ?, 'FACULTY', 'Dr. Pratusha Mam (Guide)', 'Computer Science & Engineering', '+91 98450 22334')
  `, [guidePwd]);

  await execute(`
    INSERT INTO faculty (id, user_id, employee_id, name, department, designation, specialization) VALUES
    ('fac_guide', 'user_guide', 'EMP-CSE-042', 'Dr. Pratusha Mam', 'Computer Science & Engineering', 'Associate Professor & Capstone Guide', 'Machine Learning & Algorithms')
  `);

  // Faculty 2: Prof. K. Ramanathan
  await execute(`
    INSERT INTO users (id, email, password_hash, role, name, department, phone) VALUES
    ('user_fac2', 'ramanathan@cse.college.edu', ?, 'FACULTY', 'Prof. K. Ramanathan', 'Computer Science & Engineering', '+91 98450 33445')
  `, [facultyPwd]);

  await execute(`
    INSERT INTO faculty (id, user_id, employee_id, name, department, designation, specialization) VALUES
    ('fac_ramanathan', 'user_fac2', 'EMP-CSE-058', 'Prof. K. Ramanathan', 'Computer Science & Engineering', 'Assistant Professor', 'Database Systems & Operating Systems')
  `);

  // Faculty 3: Dr. A. V. Suresh
  await execute(`
    INSERT INTO users (id, email, password_hash, role, name, department, phone) VALUES
    ('user_fac3', 'suresh@cse.college.edu', ?, 'FACULTY', 'Dr. A. V. Suresh', 'Computer Science & Engineering', '+91 98450 44556')
  `, [facultyPwd]);

  await execute(`
    INSERT INTO faculty (id, user_id, employee_id, name, department, designation, specialization) VALUES
    ('fac_suresh', 'user_fac3', 'EMP-CSE-031', 'Dr. A. V. Suresh', 'Computer Science & Engineering', 'Professor', 'Computer Networks & Security')
  `);

  // 4. Insert Subjects (Semester 5)
  await execute(`
    INSERT INTO subjects (id, code, name, credits, semester_id, faculty_id) VALUES
    ('sub_cs301', 'CS301', 'Advanced Data Structures & Algorithms', 4, 'sem_5', 'fac_guide'),
    ('sub_cs302', 'CS302', 'Database Management Systems & Cloud DBs', 4, 'sem_5', 'fac_ramanathan'),
    ('sub_cs303', 'CS303', 'Operating Systems & Concurrency', 3, 'sem_5', 'fac_ramanathan'),
    ('sub_cs304', 'CS304', 'Computer Networks & Internet Protocols', 3, 'sem_5', 'fac_suresh'),
    ('sub_cs305', 'CS305', 'Machine Learning & Intelligent Systems', 4, 'sem_5', 'fac_guide')
  `);

  // 5. Insert Assessments for each subject
  const subjects = ['sub_cs301', 'sub_cs302', 'sub_cs303', 'sub_cs304', 'sub_cs305'];
  for (const subId of subjects) {
    await execute(`
      INSERT INTO assessments (id, subject_id, name, type, max_marks, weightage, assessment_date) VALUES
      ('as_${subId}_ia1', ?, 'Internal Assessment 1 (IA-1)', 'INTERNAL_1', 30.0, 20.0, '2026-08-20'),
      ('as_${subId}_ia2', ?, 'Internal Assessment 2 (IA-2)', 'INTERNAL_2', 30.0, 20.0, '2026-09-25'),
      ('as_${subId}_mid', ?, 'Mid-Semester Exam', 'MID_TERM', 50.0, 30.0, '2026-10-18'),
      ('as_${subId}_asg1', ?, 'Lab & Assignment Milestone 1', 'ASSIGNMENT', 20.0, 15.0, '2026-09-10'),
      ('as_${subId}_asg2', ?, 'Lab & Assignment Milestone 2', 'ASSIGNMENT', 20.0, 15.0, '2026-10-05')
    `, [subId, subId, subId, subId, subId]);
  }

  // 6. Insert Students representing all key personas
  // Archetypes:
  // 1. High Performer: P. TejAditya (2420030520)
  // 2. Improving Student: G. Akshath (2420030512)
  // 3. Declining Student: I. Rajesh (2420030684)
  // 4. Low Attendance: Rahul Verma (2420030533)
  // 5. Inconsistent Student: Ananya Sharma (2420030545)
  // 6. Urgent Intervention: Vikram Reddy (2420030556)
  // 7-12. General cohort students

  const studentDefinitions = [
    {
      id: 'stu_tejaditya',
      userId: 'user_tejaditya',
      roll: '2420030520',
      name: 'P. TejAditya',
      email: 'tejaditya@student.college.edu',
      section: 'A',
      profile: 'HIGH_PERFORMER',
      baseScore: 92,
      trend: 'STABLE_HIGH',
      attendanceRate: 95,
      prevGpa: 9.4
    },
    {
      id: 'stu_akshath',
      userId: 'user_akshath',
      roll: '2420030512',
      name: 'G. Akshath',
      email: 'akshath@student.college.edu',
      section: 'A',
      profile: 'IMPROVING',
      baseScore: 65,
      trend: 'IMPROVING',
      attendanceRate: 88,
      prevGpa: 7.2
    },
    {
      id: 'stu_rajesh',
      userId: 'user_rajesh',
      roll: '2420030684',
      name: 'I. Rajesh',
      email: 'rajesh@student.college.edu',
      section: 'A',
      profile: 'DECLINING',
      baseScore: 82,
      trend: 'DECLINING',
      attendanceRate: 78,
      prevGpa: 8.5
    },
    {
      id: 'stu_rahul',
      userId: 'user_rahul',
      roll: '2420030533',
      name: 'Rahul Verma',
      email: 'rahul@student.college.edu',
      section: 'A',
      profile: 'LOW_ATTENDANCE',
      baseScore: 64,
      trend: 'STABLE_AVERAGE',
      attendanceRate: 59,
      prevGpa: 6.8
    },
    {
      id: 'stu_ananya',
      userId: 'user_ananya',
      roll: '2420030545',
      name: 'Ananya Sharma',
      email: 'ananya@student.college.edu',
      section: 'A',
      profile: 'INCONSISTENT',
      baseScore: 72,
      trend: 'ERRATIC',
      attendanceRate: 83,
      prevGpa: 7.5
    },
    {
      id: 'stu_vikram',
      userId: 'user_vikram',
      roll: '2420030556',
      name: 'Vikram Reddy',
      email: 'vikram@student.college.edu',
      section: 'A',
      profile: 'URGENT_INTERVENTION',
      baseScore: 46,
      trend: 'DECLINING_LOW',
      attendanceRate: 63,
      prevGpa: 5.9
    },
    {
      id: 'stu_sneha',
      userId: 'user_sneha',
      roll: '2420030560',
      name: 'Sneha Patel',
      email: 'sneha@student.college.edu',
      section: 'A',
      profile: 'AVERAGE_CONSISTENT',
      baseScore: 75,
      trend: 'STABLE_AVERAGE',
      attendanceRate: 85,
      prevGpa: 7.6
    },
    {
      id: 'stu_rohan',
      userId: 'user_rohan',
      roll: '2420030571',
      name: 'Rohan Gupta',
      email: 'rohan@student.college.edu',
      section: 'B',
      profile: 'HIGH_PERFORMER',
      baseScore: 89,
      trend: 'STABLE_HIGH',
      attendanceRate: 93,
      prevGpa: 9.1
    },
    {
      id: 'stu_divya',
      userId: 'user_divya',
      roll: '2420030582',
      name: 'Divya Nair',
      email: 'divya@student.college.edu',
      section: 'B',
      profile: 'IMPROVING',
      baseScore: 68,
      trend: 'IMPROVING',
      attendanceRate: 86,
      prevGpa: 7.0
    },
    {
      id: 'stu_karthik',
      userId: 'user_karthik',
      roll: '2420030594',
      name: 'Karthik Iyer',
      email: 'karthik@student.college.edu',
      section: 'B',
      profile: 'MODERATE_RISK',
      baseScore: 61,
      trend: 'DECLINING',
      attendanceRate: 72,
      prevGpa: 6.5
    },
    {
      id: 'stu_pooja',
      userId: 'user_pooja',
      roll: '2420030605',
      name: 'Pooja Rao',
      email: 'pooja@student.college.edu',
      section: 'B',
      profile: 'SUBJECT_WEAKNESS',
      baseScore: 78,
      trend: 'STABLE_AVERAGE',
      attendanceRate: 89,
      prevGpa: 8.0
    },
    {
      id: 'stu_zaid',
      userId: 'user_zaid',
      roll: '2420030619',
      name: 'Mohammed Zaid',
      email: 'zaid@student.college.edu',
      section: 'B',
      profile: 'AVERAGE_CONSISTENT',
      baseScore: 77,
      trend: 'STABLE_AVERAGE',
      attendanceRate: 87,
      prevGpa: 7.9
    }
  ];

  for (const s of studentDefinitions) {
    // Insert user
    await execute(`
      INSERT INTO users (id, email, password_hash, role, name, roll_number, department, phone)
      VALUES (?, ?, ?, 'STUDENT', ?, ?, 'Computer Science & Engineering', '+91 99001 ' || substr(?, -5))
    `, [s.userId, s.email, studentPwd, s.name, s.roll, s.roll]);

    // Insert student
    await execute(`
      INSERT INTO students (id, user_id, roll_number, name, section, batch, current_semester_id, mentor_faculty_id)
      VALUES (?, ?, ?, ?, ?, '2024-2028', 'sem_5', 'fac_guide')
    `, [s.id, s.userId, s.roll, s.name, s.section]);

    // Insert historical semester 4 performance record
    await execute(`
      INSERT INTO performance_records (id, student_id, semester_id, gpa, percentage, total_credits, rank_in_section, attendance_average, trend_status)
      VALUES (?, ?, 'sem_4', ?, ?, 24, 5, ?, 'STABLE')
    `, [`perf_${s.id}_sem4`, s.id, s.prevGpa, s.prevGpa * 9.5, s.attendanceRate]);
  }

  // 7. Insert Marks & Attendance for each student and subject based on their archetype
  for (const s of studentDefinitions) {
    for (const subId of subjects) {
      // Calculate subject attendance
      let subAttPct = s.attendanceRate;
      if (s.profile === 'LOW_ATTENDANCE') {
        subAttPct = subId === 'sub_cs303' ? 52 : 61; // particularly low in OS
      } else if (s.profile === 'URGENT_INTERVENTION') {
        subAttPct = subId === 'sub_cs304' ? 58 : 64;
      } else if (s.profile === 'MODERATE_RISK') {
        subAttPct = subId === 'sub_cs301' ? 71 : 74;
      }

      const totalClasses = 48;
      const attendedClasses = Math.round((subAttPct / 100) * totalClasses);

      await execute(`
        INSERT INTO attendance (id, student_id, subject_id, total_classes, attended_classes, percentage)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [`att_${s.id}_${subId}`, s.id, subId, totalClasses, attendedClasses, (attendedClasses / totalClasses) * 100]);

      // Calculate Marks for IA1, IA2, Mid-Term, Assignments
      // Distinct trajectory per student archetype:
      let ia1Pct = s.baseScore;
      let ia2Pct = s.baseScore;
      let midPct = s.baseScore;

      if (s.profile === 'IMPROVING') {
        // e.g. G. Akshath: 62% -> 76% -> 85%
        ia1Pct = 62;
        ia2Pct = 76;
        midPct = 84;
      } else if (s.profile === 'DECLINING') {
        // e.g. I. Rajesh: 84% -> 68% -> 52%
        ia1Pct = 84;
        ia2Pct = 68;
        midPct = 52;
        if (subId === 'sub_cs304' || subId === 'sub_cs303') {
          midPct = 46; // specific weak subjects
        }
      } else if (s.profile === 'INCONSISTENT') {
        // e.g. Ananya: swings widely
        ia1Pct = subId === 'sub_cs301' ? 92 : 46;
        ia2Pct = subId === 'sub_cs301' ? 48 : 88;
        midPct = subId === 'sub_cs301' ? 86 : 52;
      } else if (s.profile === 'URGENT_INTERVENTION') {
        // e.g. Vikram: persistently low, multiple subjects failing
        ia1Pct = 50;
        ia2Pct = 44;
        midPct = 42;
        if (subId === 'sub_cs301' || subId === 'sub_cs304') {
          midPct = 36;
        }
      } else if (s.profile === 'SUBJECT_WEAKNESS') {
        // e.g. Pooja: great everywhere, but OS (sub_cs303) is weak
        if (subId === 'sub_cs303') {
          ia1Pct = 54;
          ia2Pct = 50;
          midPct = 48;
        } else {
          ia1Pct = 85;
          ia2Pct = 84;
          midPct = 86;
        }
      }

      // Add minor subject variance
      const subOffset = subId === 'sub_cs301' ? 2 : subId === 'sub_cs304' ? -3 : 0;
      const m1 = Math.min(30, Math.max(0, Math.round(((ia1Pct + subOffset) / 100) * 30)));
      const m2 = Math.min(30, Math.max(0, Math.round(((ia2Pct + subOffset) / 100) * 30)));
      const mMid = Math.min(50, Math.max(0, Math.round(((midPct + subOffset) / 100) * 50)));

      // IA-1
      await execute(`
        INSERT INTO marks (id, student_id, assessment_id, marks_obtained, max_marks, remarks)
        VALUES (?, ?, ?, ?, 30.0, 'Evaluated by Faculty')
      `, [`m_${s.id}_${subId}_ia1`, s.id, `as_${subId}_ia1`, m1]);

      // IA-2
      await execute(`
        INSERT INTO marks (id, student_id, assessment_id, marks_obtained, max_marks, remarks)
        VALUES (?, ?, ?, ?, 30.0, 'Evaluated by Faculty')
      `, [`m_${s.id}_${subId}_ia2`, s.id, `as_${subId}_ia2`, m2]);

      // Mid-Term
      await execute(`
        INSERT INTO marks (id, student_id, assessment_id, marks_obtained, max_marks, remarks)
        VALUES (?, ?, ?, ?, 50.0, 'Mid-Semester Exam Official')
      `, [`m_${s.id}_${subId}_mid`, s.id, `as_${subId}_mid`, mMid]);

      // Assignments
      let asg1Status: 'ON_TIME' | 'LATE' | 'MISSED' = 'ON_TIME';
      let asg2Status: 'ON_TIME' | 'LATE' | 'MISSED' = 'ON_TIME';
      let asg1Score = 18;
      let asg2Score = 17;

      if (s.profile === 'URGENT_INTERVENTION') {
        asg1Status = 'MISSED';
        asg2Status = 'LATE';
        asg1Score = 0;
        asg2Score = 8;
      } else if (s.profile === 'LOW_ATTENDANCE') {
        asg1Status = 'LATE';
        asg2Score = 12;
      }

      await execute(`
        INSERT INTO assignments (id, student_id, subject_id, title, score, max_score, submission_status, due_date, submitted_date)
        VALUES
        (?, ?, ?, 'Lab Assignment 1: Code Implementations', ?, 20.0, ?, '2026-09-10', '2026-09-09'),
        (?, ?, ?, 'Lab Assignment 2: Real-World Case Study', ?, 20.0, ?, '2026-10-05', '2026-10-04')
      `, [
        `asg_${s.id}_${subId}_1`, s.id, subId, asg1Score, asg1Status,
        `asg_${s.id}_${subId}_2`, s.id, subId, asg2Score, asg2Status
      ]);

      // Marks for assignments
      await execute(`
        INSERT INTO marks (id, student_id, assessment_id, marks_obtained, max_marks, remarks)
        VALUES
        (?, ?, ?, ?, 20.0, 'Assignment 1 Score'),
        (?, ?, ?, ?, 20.0, 'Assignment 2 Score')
      `, [
        `m_${s.id}_${subId}_asg1`, s.id, `as_${subId}_asg1`, asg1Score,
        `m_${s.id}_${subId}_asg2`, s.id, `as_${subId}_asg2`, asg2Score
      ]);
    }
  }

  // 8. Log initial interventions for high risk students
  await execute(`
    INSERT INTO interventions (id, student_id, faculty_id, type, notes, target_date, status)
    VALUES
    ('int_1', 'stu_vikram', 'fac_guide', 'COUNSELING', 'Academic review with Capstone Guide regarding declining performance in ML & Algorithms. Advised remedial practice sessions.', '2026-10-25', 'CONDUCTED'),
    ('int_2', 'stu_rahul', 'fac_ramanathan', 'ATTENDANCE_WARNING', 'Official attendance notification issued for CS303 (52%). Student committed to attend extra makeup labs.', '2026-10-28', 'SCHEDULED'),
    ('int_3', 'stu_rajesh', 'fac_suresh', 'REMEDIAL_CLASS', 'Special clinic on Computer Networks socket programming and transport protocols to halt recent mark drop.', '2026-11-02', 'SCHEDULED')
  `);

  saveDb();
  console.log('✅ Base seed data loaded successfully!');
}
