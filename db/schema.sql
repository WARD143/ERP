-- ============================================================================
-- AKTERA Academic Intelligence & Complete University ERP Schema (SQLite 3.x)
-- Engineering Capstone Project - 1 (A.Y. 2026-2027)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- Users & Authentication Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('STUDENT', 'FACULTY', 'ADMIN', 'PARENT')) NOT NULL,
    name TEXT NOT NULL,
    roll_number TEXT,
    department TEXT DEFAULT 'Computer Science & Engineering',
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Academic Semesters
CREATE TABLE IF NOT EXISTS semesters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    semester_number INTEGER NOT NULL,
    is_current INTEGER DEFAULT 1,
    start_date DATE,
    end_date DATE
);

-- Faculty Profiles
CREATE TABLE IF NOT EXISTS faculty (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    specialization TEXT
);

-- Subjects Offered
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    credits INTEGER NOT NULL,
    semester_id TEXT NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    faculty_id TEXT REFERENCES faculty(id)
);

-- Students Profiles
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roll_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    section TEXT NOT NULL,
    batch TEXT NOT NULL,
    current_semester_id TEXT NOT NULL REFERENCES semesters(id),
    mentor_faculty_id TEXT REFERENCES faculty(id)
);

-- Parent-Student Link Table
CREATE TABLE IF NOT EXISTS parent_students (
    id TEXT PRIMARY KEY,
    parent_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relation TEXT DEFAULT 'PARENT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_user_id, student_id)
);

-- Assessments (IA-1, IA-2, Assignments, Semester Exams)
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('INTERNAL_1', 'INTERNAL_2', 'ASSIGNMENT', 'MID_TERM', 'FINAL_EXAM')) NOT NULL,
    max_marks REAL NOT NULL,
    weightage REAL NOT NULL,
    assessment_date DATE NOT NULL
);

-- Marks Obtained
CREATE TABLE IF NOT EXISTS marks (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    marks_obtained REAL NOT NULL,
    max_marks REAL NOT NULL,
    is_absent INTEGER DEFAULT 0,
    remarks TEXT,
    entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, assessment_id)
);

-- Attendance Records per Subject
CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    total_classes INTEGER NOT NULL,
    attended_classes INTEGER NOT NULL,
    percentage REAL NOT NULL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id)
);

-- Assignments & Submissions
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATETIME NOT NULL,
    max_score REAL NOT NULL,
    weightage REAL DEFAULT 10.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Comprehensive Risk Engine Output (Explainable AI)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    overall_risk_score REAL NOT NULL, -- 0 to 100
    risk_level TEXT CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH')) NOT NULL,
    declining_marks_flag INTEGER DEFAULT 0,
    low_attendance_flag INTEGER DEFAULT 0,
    inconsistent_assessments_flag INTEGER DEFAULT 0,
    weak_subjects_count INTEGER DEFAULT 0,
    explanation_reasons TEXT NOT NULL, -- JSON array of strings
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id)
);

-- Early Warning Alerts System
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    severity TEXT CHECK(severity IN ('CRITICAL', 'WARNING', 'INFO')) NOT NULL,
    category TEXT CHECK(category IN ('ATTENDANCE', 'ACADEMIC_DECLINE', 'INCONSISTENCY', 'BACKLOG_RISK')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    trigger_metric TEXT NOT NULL,
    threshold_value REAL,
    actual_value REAL,
    is_read INTEGER DEFAULT 0,
    is_resolved INTEGER DEFAULT 0,
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Actionable Recommendations & Interventions
CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    priority TEXT CHECK(priority IN ('HIGH', 'MEDIUM', 'LOW')) NOT NULL,
    title TEXT NOT NULL,
    actionable_steps TEXT NOT NULL,
    rationale TEXT NOT NULL,
    status TEXT CHECK(status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')) DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Initiated Interventions & Counseling Records
CREATE TABLE IF NOT EXISTS interventions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    faculty_id TEXT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('COUNSELING', 'REMEDIAL_CLASS', 'PEER_TUTORING', 'ATTENDANCE_WARNING', 'PARENT_CONTACT')) NOT NULL,
    notes TEXT NOT NULL,
    target_date DATE,
    status TEXT CHECK(status IN ('SCHEDULED', 'CONDUCTED', 'FOLLOW_UP')) DEFAULT 'SCHEDULED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Configurable Risk Engine Thresholds (Admin Controlled)
CREATE TABLE IF NOT EXISTS risk_configurations (
    id TEXT PRIMARY KEY,
    min_attendance_threshold REAL DEFAULT 75.0,
    decline_percentage_threshold REAL DEFAULT 10.0,
    variance_threshold REAL DEFAULT 15.0,
    high_risk_cutoff REAL DEFAULT 65.0,
    medium_risk_cutoff REAL DEFAULT 35.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- UNIVERSITY ERP EXTENSIONS (KL UNIVERSITY INSPIRED PORTAL MODULES)
-- ============================================================================

-- 1. Course Registrations
CREATE TABLE IF NOT EXISTS course_registrations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    registration_type TEXT CHECK(registration_type IN ('REGULAR', 'BETTERMENT', 'RECOURSE', 'DETAIN', 'CERTIFICATE')) NOT NULL,
    academic_year TEXT DEFAULT '2026-2027',
    semester TEXT DEFAULT 'Semester VI',
    status TEXT DEFAULT 'APPROVED',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Course Materials & Handouts
CREATE TABLE IF NOT EXISTS course_materials (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT CHECK(type IN ('HANDOUT', 'SYLLABUS', 'NOTES', 'QUESTION_BANK', 'SLIDES')) NOT NULL,
    file_url TEXT,
    unit_number INTEGER,
    uploaded_by TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Session & Lecture Feedback
CREATE TABLE IF NOT EXISTS session_feedbacks (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    faculty_id TEXT,
    clarity_rating INTEGER CHECK(clarity_rating BETWEEN 1 AND 5),
    pace_rating INTEGER CHECK(pace_rating BETWEEN 1 AND 5),
    engagement_rating INTEGER CHECK(engagement_rating BETWEEN 1 AND 5),
    comments TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. CRT (Campus Recruitment Training)
CREATE TABLE IF NOT EXISTS crt_training (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    module TEXT CHECK(module IN ('APTITUDE', 'CODING', 'VERBAL', 'SOFT_SKILLS', 'MOCK_TEST')) NOT NULL,
    title TEXT NOT NULL,
    score REAL,
    max_score REAL,
    status TEXT DEFAULT 'COMPLETED',
    date DATE,
    rank INTEGER
);

-- 5. Career Choice & Preferences
CREATE TABLE IF NOT EXISTS career_preferences (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    primary_domain TEXT,
    secondary_domain TEXT,
    target_role TEXT,
    preferred_location TEXT,
    higher_studies_intent TEXT,
    assessment_score REAL DEFAULT 0,
    recommendations TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Counselling Diary & Appointments
CREATE TABLE IF NOT EXISTS counselling_appointments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    faculty_id TEXT NOT NULL,
    appointment_date DATETIME NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT CHECK(status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')) DEFAULT 'SCHEDULED',
    minutes_of_meeting TEXT,
    action_items TEXT,
    follow_up_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Clubs, SIL Points & Activities
CREATE TABLE IF NOT EXISTS clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    lead_faculty TEXT,
    description TEXT,
    icon TEXT
);

CREATE TABLE IF NOT EXISTS club_memberships (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    club_id TEXT NOT NULL,
    role TEXT DEFAULT 'MEMBER',
    sil_points INTEGER DEFAULT 0,
    joined_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS club_events (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    venue TEXT,
    sil_awarded INTEGER DEFAULT 10,
    registered_count INTEGER DEFAULT 0
);

-- 8. Examination Scheduling & Seating
CREATE TABLE IF NOT EXISTS exam_schedules (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    exam_type TEXT DEFAULT 'END_SEMESTER',
    exam_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    hall_number TEXT NOT NULL,
    seat_number TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS insem_answer_scripts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    assessment_name TEXT NOT NULL,
    evaluated_marks REAL NOT NULL,
    max_marks REAL NOT NULL,
    scrutiny_status TEXT DEFAULT 'CONFIRMED',
    script_url TEXT
);

-- 9. Central Library Management
CREATE TABLE IF NOT EXISTS library_books (
    id TEXT PRIMARY KEY,
    isbn TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    total_copies INTEGER DEFAULT 10,
    available_copies INTEGER DEFAULT 8
);

CREATE TABLE IF NOT EXISTS library_transactions (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    fine_amount REAL DEFAULT 0,
    status TEXT CHECK(status IN ('ISSUED', 'RETURNED', 'OVERDUE', 'RESERVED')) DEFAULT 'ISSUED'
);

-- 10. Fee Structures & Payments
CREATE TABLE IF NOT EXISTS fee_structures (
    id TEXT PRIMARY KEY,
    fee_type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    semester TEXT DEFAULT 'Semester VI',
    due_date DATE
);

CREATE TABLE IF NOT EXISTS fee_payments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    fee_type TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_mode TEXT CHECK(payment_mode IN ('ONLINE_UPI', 'NET_BANKING', 'CREDIT_CARD', 'CHEQUE', 'DEMAND_DRAFT')) NOT NULL,
    transaction_ref TEXT UNIQUE NOT NULL,
    status TEXT CHECK(status IN ('PAID', 'PENDING', 'VERIFYING', 'FAILED')) DEFAULT 'PAID',
    receipt_number TEXT UNIQUE NOT NULL,
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Hostel Management & Complaints
CREATE TABLE IF NOT EXISTS hostel_allocations (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    block_name TEXT NOT NULL,
    room_number TEXT NOT NULL,
    bed_number TEXT NOT NULL,
    occupancy_type TEXT DEFAULT '2-SHARING-AC',
    warden_name TEXT,
    warden_contact TEXT,
    fee_status TEXT DEFAULT 'CLEARED'
);

CREATE TABLE IF NOT EXISTS hostel_complaints (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    room_number TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'OPEN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Infrastructure Complaints
CREATE TABLE IF NOT EXISTS infra_complaints (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    location TEXT NOT NULL,
    facility_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'IN_PROGRESS',
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Institutional Feedback
CREATE TABLE IF NOT EXISTS institution_feedback (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    category TEXT CHECK(category IN ('COURSE', 'FACULTY', 'INFRASTRUCTURE')) NOT NULL,
    target_id TEXT,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    action_taken TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. NoDue Multi-Department Clearance
CREATE TABLE IF NOT EXISTS no_due_clearance (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    department_status TEXT DEFAULT 'CLEARED',
    library_status TEXT DEFAULT 'CLEARED',
    hostel_status TEXT DEFAULT 'CLEARED',
    accounts_status TEXT DEFAULT 'CLEARED',
    laboratory_status TEXT DEFAULT 'CLEARED',
    overall_status TEXT DEFAULT 'APPROVED',
    remarks TEXT,
    approved_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Registrar Office Document Requests
CREATE TABLE IF NOT EXISTS document_requests (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    document_type TEXT CHECK(document_type IN ('BONAFIDE', 'TRANSCRIPT', 'STUDY_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'CUSTODIAN')) NOT NULL,
    purpose TEXT NOT NULL,
    copies INTEGER DEFAULT 1,
    status TEXT CHECK(status IN ('PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'DELIVERED', 'REJECTED')) DEFAULT 'PROCESSING',
    reference_number TEXT UNIQUE NOT NULL,
    estimated_delivery DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Psychometric Tests & Career Fit
CREATE TABLE IF NOT EXISTS psychometric_assessments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    test_type TEXT CHECK(test_type IN ('INTEREST', 'APTITUDE', 'PERSONALITY', 'CAREER_FIT')) NOT NULL,
    score REAL NOT NULL,
    primary_archetype TEXT,
    analysis_summary TEXT,
    suggested_careers TEXT,
    taken_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 17. Security Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    endpoint TEXT,
    ip_address TEXT,
    user_agent TEXT,
    status_code INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
